let level = 1;
let score = 0;
let tubes = [];
let selected = null;
let history = [];
let audioCtx = null;

const NEON_COLORS = ['#ff0055', '#00f2fe', '#4facfe', '#fadb14', '#70e000', '#9b59b6', '#ff8c00', '#ffffff'];

function init() {
    const savedLevel = localStorage.getItem('neonBallLevel');
    const savedScore = localStorage.getItem('neonBallScore');
    if(savedLevel) level = parseInt(savedLevel);
    if(savedScore) score = parseInt(savedScore);
    
    // اضافه کردن بخش نمایش امتیاز به HTML به صورت خودکار
    createScoreUI();
    loadLevel();
}

function createScoreUI() {
    if(!document.getElementById('score-display')) {
        const header = document.querySelector('.header');
        const scoreDiv = document.createElement('div');
        scoreDiv.id = 'score-display';
        scoreDiv.innerHTML = `SCORE: <span id="score-val">${score}</span>`;
        scoreDiv.style.color = '#fadb14';
        scoreDiv.style.fontWeight = 'bold';
        header.appendChild(scoreDiv);
    }
}

function playSound(type) {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    if (type === 'move') {
        osc.frequency.setValueAtTime(440, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        osc.stop(audioCtx.currentTime + 0.1);
    } else if (type === 'win') {
        osc.frequency.setValueAtTime(587, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        osc.stop(audioCtx.currentTime + 0.4);
    }
    osc.start();
}

function loadLevel() {
    document.getElementById('level-num').innerText = level;
    document.getElementById('score-val').innerText = score;
    document.getElementById('win-overlay').style.display = 'none';
    history = [];
    selected = null;
    
    let colorCount = Math.min(3 + Math.floor(level / 5), 8);
    let balls = [];
    for(let i=0; i<colorCount; i++) {
        for(let j=0; j<4; j++) balls.push(NEON_COLORS[i]);
    }
    
    balls.sort(() => Math.random() - 0.5);
    tubes = [];
    for(let i=0; i<colorCount; i++) tubes.push(balls.splice(0, 4));
    tubes.push([]); tubes.push([]);
    
    render();
}

function render() {
    const board = document.getElementById('board');
    board.innerHTML = '';
    tubes.forEach((t, i) => {
        const div = document.createElement('div');
        div.className = `tube ${selected === i ? 'active' : ''}`;
        div.onclick = () => tap(i);
        t.forEach(color => {
            const ball = document.createElement('div');
            ball.className = 'ball';
            ball.style.backgroundColor = color;
            ball.style.boxShadow = `0 0 15px ${color}80, inset -4px -4px 8px rgba(0,0,0,0.4), inset 6px 6px 10px rgba(255,255,255,0.3)`;
            div.appendChild(ball);
        });
        board.appendChild(div);
    });
}

function tap(i) {
    if(selected === null) {
        if(tubes[i].length > 0) {
            selected = i;
            render();
        }
    } else {
        if (selected !== i) {
            moveLogic(selected, i);
        }
        selected = null;
        render();
    }
}

function moveLogic(from, to) {
    let fromTube = tubes[from];
    let toTube = tubes[to];
    
    if (fromTube.length === 0) return;
    
    let colorToMove = fromTube[fromTube.length - 1];
    
    // چک کردن اینکه آیا جابجایی مجاز است
    if (toTube.length < 4 && (toTube.length === 0 || toTube[toTube.length - 1] === colorToMove)) {
        history.push(JSON.stringify(tubes));
        
        // پیدا کردن تعداد توپ‌های همرنگ در بالای لوله مبدأ
        let count = 0;
        for (let j = fromTube.length - 1; j >= 0; j--) {
            if (fromTube[j] === colorToMove) count++;
            else break;
        }
        
        // محاسبه فضای خالی در مقصد
        let space = 4 - toTube.length;
        let ballsToMove = Math.min(count, space);
        
        // جابجایی دسته‌جمعی
        for (let k = 0; k < ballsToMove; k++) {
            toTube.push(fromTube.pop());
            score += 10; // ۱۰ امتیاز برای هر توپ
        }
        
        playSound('move');
        updateScore();

        if (toTube.length === 4 && toTube.every(b => b === toTube[0])) {
            score += 50; // امتیاز پاداش برای کامل کردن یک لوله
            updateScore();
        }

        if(checkWin()) showWin();
    }
}

function updateScore() {
    document.getElementById('score-val').innerText = score;
    localStorage.setItem('neonBallScore', score);
}

function showWin() {
    playSound('win');
    score += 100; // پاداش اتمام مرحله
    updateScore();
    setTimeout(() => {
        document.getElementById('win-overlay').style.display = 'flex';
        localStorage.setItem('neonBallLevel', level + 1);
    }, 500);
}

// توابع کمکی همان قبلی‌ها هستند
function checkWin() { return tubes.every(t => t.length === 0 || (t.length === 4 && t.every(b => b === t[0]))); }
function nextLevel() { level++; loadLevel(); }
function reset() { loadLevel(); }
function undo() { if(history.length > 0) { tubes = JSON.parse(history.pop()); render(); } }
function addTube() { if(tubes.length < 12) { tubes.push([]); render(); } }

init();
