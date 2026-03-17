let level = 1, tubes = [], selected = null;
let isSoundOn = true, isVibrateOn = true, currentLang = 'en';

const COLORS = ['#ff0055', '#00f2fe', '#4facfe', '#fadb14', '#70e000', '#9b59b6', '#ff8c00', '#ffffff'];
const LANGS = {
    en: { level: "Level", settings: "Settings", sound: "Sound", vibrate: "Vibrate", share: "Share", privacy: "Privacy", win: "FANTASTIC!" },
    ar: { level: "مستوى", settings: "الإعدادات", sound: "الصوت", vibrate: "اهتزاز", share: "مشاركة", privacy: "الخصوصية", win: "رائع!" },
    fa: { level: "مرحله", settings: "تنظیمات", sound: "صدا", vibrate: "لرزش", share: "اشتراک‌گذاری", privacy: "حریم خصوصی", win: "عالی بود!" }
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

function loadLevel() {
    document.getElementById('win-overlay').style.display = 'none';
    const colorCount = Math.min(3 + Math.floor(level / 5), 8);
    let balls = [];
    for(let i=0; i<colorCount; i++) for(let j=0; j<4; j++) balls.push(COLORS[i]);
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
        t.forEach(c => {
            const b = document.createElement('div'); b.className = 'ball';
            b.style.backgroundColor = c; div.appendChild(b);
        });
        board.appendChild(div);
    });
}

function tap(i) {
    if (selected === null) {
        if (tubes[i].length > 0) {
            selected = i;
            if (isSoundOn) document.getElementById('snd-tap').play();
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
        if (checkWin()) handleWin();
    }
}

function checkWin() {
    return tubes.every(t => t.length === 0 || (t.length === 4 && t.every(b => b === t[0])));
}

function handleWin() {
    if (isSoundOn) document.getElementById('snd-win').play();
    document.getElementById('win-overlay').style.display = 'flex';
    setTimeout(() => {
        level++;
        localStorage.setItem('neon_lvl', level);
        updateUI();
        loadLevel();
    }, 2500); // ۲.۵ ثانیه نمایش تبریک و بعد لول بعدی
}

function startGame() { document.getElementById('main-menu').style.display = 'none'; }
function goHome() { document.getElementById('main-menu').style.display = 'flex'; }
function resetLevel() { loadLevel(); }
function nextLevel() { level++; localStorage.setItem('neon_lvl', level); updateUI(); loadLevel(); }
function toggleSettings(s) { document.getElementById('settings-panel').style.display = s ? 'flex' : 'none'; }

function changeLang(lang) {
    currentLang = lang;
    localStorage.setItem('neon_lang', lang);
    const trans = LANGS[lang];
    const map = { 'txt-level': 'level', 'txt-menu-lvl': 'level', 'txt-settings': 'settings', 'txt-sound': 'sound', 'txt-vibrate': 'vibrate', 'txt-share': 'share', 'txt-privacy': 'privacy', 'txt-win': 'win' };
    for (let id in map) if (document.getElementById(id)) document.getElementById(id).innerText = trans[map[id]];
    document.body.className = (lang === 'ar' || lang === 'fa') ? 'rtl' : '';
    document.querySelectorAll('.lang-switch button').forEach(b => b.classList.remove('active'));
    document.getElementById('btn-' + lang).classList.add('active');
}

function toggleSound() { isSoundOn = !isSoundOn; localStorage.setItem('neon_sound', isSoundOn); updateUI(); }
function toggleVibrate() { isVibrateOn = !isVibrateOn; localStorage.setItem('neon_vibrate', isVibrateOn); updateUI(); }

async function shareGame() {
    if (navigator.share) await navigator.share({ title: 'Neon Ball Sort', url: window.location.href });
}

window.onload = init;
