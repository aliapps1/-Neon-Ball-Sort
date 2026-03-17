let level = 1;
let score = 0;
let tubes = [];
let selected = null;
let history = [];
let audioCtx = null;

const NEON_COLORS = ['#ff0055', '#00f2fe', '#4facfe', '#fadb14', '#70e000', '#9b59b6', '#ff8c00', '#ffffff'];

// تابع ایجاد صدا بدون نیاز به فایل خارجی
function playSound(freq, duration) {
    try {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        osc.start();
        osc.stop(audioCtx.currentTime + duration);
    } catch (e) { console.log("Audio error"); }
}

function init() {
    const savedLevel = localStorage.getItem('neonBallLevel');
    if(savedLevel) level = parseInt(savedLevel);
    loadLevel();
}

function loadLevel() {
    document.getElementById('level-num').innerText = level;
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
            ball.style.boxShadow = `0 0 15px ${color}80`;
            div.appendChild(ball);
        });
        board.appendChild(div);
    });
}

function tap(i) {
    if(selected === null) {
        if(tubes[i].length > 0) {
            selected = i;
            playSound(400, 0.05); // صدای انتخاب
            render();
        }
    } else {
        if (selected !== i) {
            moveLogic(selected, i);
        } else {
            selected = null; // لغو انتخاب اگر دوباره روی همان لوله زد
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
    
    // بررسی قانون بازی (مقصد خالی باشد یا رنگ بالا یکی باشد)
    if (toTube.length < 4 && (toTube.length === 0 || toTube[toTube.length - 1] === colorToMove)) {
        history.push(JSON.stringify(tubes));
        
        // محاسبه تعداد توپ‌های همرنگ برای جابجایی یکباره
        let count = 0;
        for (let j = fromTube.length - 1; j >= 0; j--) {
            if (fromTube[j] === colorToMove) count++;
            else break;
        }
        
        let space = 4 - toTube.length;
        let ballsToMove = Math.min(count, space);
        
        for (let k = 0; k < ballsToMove; k++) {
            toTube.push(fromTube.pop());
        }
        
        playSound(600, 0.1); // صدای جابجایی موفق
        
        // بررسی خودکار پیروزی
        if(checkWin()) {
            showWin();
        }
    } else {
        playSound(150, 0.2); // صدای خطا
    }
}

function checkWin() {
    return tubes.every(t => t.length === 0 || (t.length === 4 && t.every(b => b === t[0])));
}

function showWin() {
    playSound(800, 0.3);
    setTimeout(() => {
        document.getElementById('win-overlay').style.display = 'flex';
        // ذخیره مرحله بعدی در حافظه
        level++;
        localStorage.setItem('neonBallLevel', level);
    }, 300);
}

function nextLevel() {
    loadLevel(); // بارگذاری لول جدید که در مرحله قبل ذخیره شده بود
}

function reset() { loadLevel(); }
function undo() { if(history.length > 0) { tubes = JSON.parse(history.pop()); render(); } }
function addTube() { if(tubes.length < 12) { tubes.push([]); render(); } }

init();
