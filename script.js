let level = 1;
let tubes = [];
let selected = null;
let history = [];

const NEON_COLORS = ['#ff0055', '#00f2fe', '#4facfe', '#fadb14', '#70e000', '#9b59b6', '#ff8c00', '#ffffff'];

function init() {
    const saved = localStorage.getItem('neonBallLevel');
    if(saved) level = parseInt(saved);
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
    tubes.push([]); tubes.push([]); // لوله‌های خالی
    
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
            ball.style.boxShadow += `, 0 0 15px ${color}80`;
            div.appendChild(ball);
        });
        board.appendChild(div);
    });
}

function tap(i) {
    if(selected === null) {
        if(tubes[i].length > 0) { selected = i; render(); }
    } else {
        move(selected, i);
        selected = null;
        render();
    }
}

function move(from, to) {
    if(from === to) return;
    let b = tubes[from][tubes[from].length-1];
    let target = tubes[to];
    
    if(target.length < 4 && (target.length === 0 || target[target.length-1] === b)) {
        history.push(JSON.stringify(tubes));
        target.push(tubes[from].pop());
        if(checkWin()) showWin();
    }
}

function checkWin() {
    return tubes.every(t => t.length === 0 || (t.length === 4 && t.every(b => b === t[0])));
}

function showWin() {
    setTimeout(() => {
        document.getElementById('win-overlay').style.display = 'flex';
        localStorage.setItem('neonBallLevel', level + 1);
    }, 500);
}

function nextLevel() { level++; loadLevel(); }
function reset() { loadLevel(); }
function undo() { if(history.length > 0) { tubes = JSON.parse(history.pop()); render(); } }
function addTube() { if(tubes.length < 12) { tubes.push([]); render(); } }

init();
