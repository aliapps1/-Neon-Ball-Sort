let level = 1, tubes = [], selected = null;
let isSoundOn = true, isVibrateOn = true, currentLang = 'en';

const COLORS = ['#ff0055', '#00f2fe', '#4facfe', '#fadb14', '#70e000', '#9b59b6', '#ff8c00', '#ffffff'];

const LANGS = {
    en: { level: "Level", settings: "Settings", sound: "Sound", vibrate: "Vibrate", share: "Share Game", privacy: "Privacy" },
    ar: { level: "مستوى", settings: "الإعدادات", sound: "الصوت", vibrate: "اهتزاز", share: "مشاركة", privacy: "الخصوصية" },
    fa: { level: "مرحله", settings: "تنظیمات", sound: "صدا", vibrate: "لرزش", share: "اشتراک‌گذاری", privacy: "حریم خصوصی" }
};

function init() {
    level = parseInt(localStorage.getItem('neon_lvl')) || 1;
    isSoundOn = localStorage.getItem('neon_sound') !== 'false';
    isVibrateOn = localStorage.getItem('neon_vibrate') !== 'false';
    currentLang = localStorage.getItem('neon_lang') || 'en';
    
    updateUI();
    loadLevel();
}

function updateUI() {
    changeLang(currentLang);
    document.getElementById('sound-btn').classList.toggle('active', isSoundOn);
    document.getElementById('vibrate-btn').classList.toggle('active', isVibrateOn);
    document.getElementById('menu-level-num').innerText = level;
    document.getElementById('level-num').innerText = level;
}

function startGame() {
    document.getElementById('main-menu').style.display = 'none';
    loadLevel();
}

function goHome() {
    document.getElementById('main-menu').style.display = 'flex';
    updateUI();
}

function loadLevel() {
    const colorCount = Math.min(3 + Math.floor(level / 5), 8);
    let balls = [];
    for(let i=0; i<colorCount; i++) {
        for(let j=0; j<4; j++) balls.push(COLORS[i]);
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
            div.appendChild(ball);
        });
        board.appendChild(div);
    });
}

function tap(i) {
    if (selected === null) {
        if (tubes[i].length > 0) {
            selected = i;
            if (isSoundOn) playTapSound();
        }
    } else {
        moveBall(selected, i);
        selected = null;
    }
    render();
}

function moveBall(from, to) {
    const f = tubes[from], t = tubes[to];
    if (from !== to && f.length > 0 && t.length < 4 && (t.length === 0 || t[t.length-1] === f[f.length-1])) {
        t.push(f.pop());
        if (isVibrateOn && navigator.vibrate) navigator.vibrate(40);
        checkWin();
    }
}

function checkWin() {
    const win = tubes.every(t => t.length === 0 || (t.length === 4 && t.every(b => b === t[0])));
    if (win) {
        setTimeout(() => {
            alert("Level Complete!");
            nextLevel();
        }, 300);
    }
}

function nextLevel() {
    level++;
    localStorage.setItem('neon_lvl', level);
    updateUI();
    loadLevel();
}

function resetLevel() { loadLevel(); }

function toggleSettings(show) {
    document.getElementById('settings-panel').style.display = show ? 'flex' : 'none';
}

function changeLang(lang) {
    currentLang = lang;
    localStorage.setItem('neon_lang', lang);
    const trans = LANGS[lang];
    document.getElementById('txt-level').innerText = trans.level;
    document.getElementById('txt-menu-lvl').innerText = trans.level;
    document.getElementById('txt-settings').innerText = trans.settings;
    document.getElementById('txt-sound').innerText = trans.sound;
    document.getElementById('txt-vibrate').innerText = trans.vibrate;
    document.getElementById('txt-share').innerText = trans.share;
    document.getElementById('txt-privacy').innerText = trans.privacy;
    
    document.querySelectorAll('.lang-switch button').forEach(b => b.classList.remove('active'));
    document.getElementById('btn-' + lang).classList.add('active');
}

function toggleSound() {
    isSoundOn = !isSoundOn;
    localStorage.setItem('neon_sound', isSoundOn);
    updateUI();
}

function toggleVibrate() {
    isVibrateOn = !isVibrateOn;
    localStorage.setItem('neon_vibrate', isVibrateOn);
    updateUI();
}

async function shareGame() {
    if (navigator.share) {
        await navigator.share({ title: 'Neon Ball Sort', url: window.location.href });
    }
}

function playTapSound() { /* کد پخش صدا اینجا قرار می‌گیرد */ }

init();
