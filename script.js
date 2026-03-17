let level = 1, tubes = [], selected = null;
let isSoundOn = true, isVibrateOn = true, currentLang = 'en';

const COLORS = ['#ff0055', '#00f2fe', '#4facfe', '#fadb14', '#70e000', '#9b59b6', '#ff8c00', '#ffffff'];
const LANGS = {
    en: { level: "Level", settings: "Settings", sound: "Sound", vibrate: "Vibrate", share: "Share", privacy: "Privacy", win: "FANTASTIC!", settingsBtn: "Settings" },
    ar: { level: "مستوى", settings: "الإعدادات", sound: "الصوت", vibrate: "اهتزاز", share: "مشاركة", privacy: "الخصوصية", win: "رائع!", settingsBtn: "الإعدادات" },
    fa: { level: "مرحله", settings: "تنظیمات", sound: "صدا", vibrate: "لرزش", share: "اشتراک‌گذاری", privacy: "حریم خصوصی", win: "عالی بود!", settingsBtn: "تنظیمات" }
};

// صداهای استاندارد گوگل برای پایداری در موبایل
const sndTap = new Audio("https://actions.google.com/sounds/v1/competition_game/single_winner_not_too_loud.ogg");
const sndWin = new Audio("https://actions.google.com/sounds/v1/cartoon/clime_up_the_ladder_fast.ogg");

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
    if(isSoundOn) { sndTap.play().catch(()=>{}); } // رفع محدودیت Autoplay
    document.getElementById('main-menu').style.display = 'none'; 
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
            if (isSoundOn) { sndTap.currentTime = 0; sndTap.play().catch(()=>{}); }
        }
    } else {
        moveGroup(selected, i);
        selected = null;
    }
    render();
}

function moveGroup(from, to) {
    if (from === to) return;
    const f = tubes[from], t = tubes[to];
    if (f.length === 0) return;
    const color = f[f.length - 1];
    if (t.length < 4 && (t.length === 0 || t[t.length - 1] === color)) {
        let count = 0;
        for (let i = f.length - 1; i >= 0; i--) {
            if (f[i] === color) count++; else break;
        }
        let ballsToMove = Math.min(count, 4 - t.length);
        for (let i = 0; i < ballsToMove; i++) t.push(f.pop());
        if (isVibrateOn && navigator.vibrate) navigator.vibrate(40);
        if (checkWin()) handleWin();
    }
}

function checkWin() { return tubes.every(t => t.length === 0 || (t.length === 4 && t.every(b => b === t[0]))); }

function handleWin() {
    if (isSoundOn) sndWin.play().catch(()=>{});
    document.getElementById('win-overlay').style.display = 'flex';
    setTimeout(() => {
        level++;
        localStorage.setItem('neon_lvl', level);
        updateUI();
        loadLevel();
    }, 2500);
}

function goHome() { document.getElementById('main-menu').style.display = 'flex'; }
function resetLevel() { loadLevel(); }
function nextLevel() { level++; localStorage.setItem('neon_lvl', level); updateUI(); loadLevel(); }
function toggleSettings(s) { document.getElementById('settings-panel').style.display = s ? 'flex' : 'none'; }

function changeLang(lang) {
    currentLang = lang;
    localStorage.setItem('neon_lang', lang);
    const trans = LANGS[lang];
    const map = { 'txt-level': 'level', 'txt-menu-lvl': 'level', 'txt-settings': 'settings', 'txt-sound': 'sound', 'txt-vibrate': 'vibrate', 'txt-share': 'share', 'txt-privacy': 'privacy', 'txt-win': 'win', 'txt-settings-btn': 'settingsBtn' };
    for (let id in map) if (document.getElementById(id)) document.getElementById(id).innerText = trans[map[id]];
    document.body.className = (lang === 'ar' || lang === 'fa') ? 'rtl' : '';
}

function toggleSound() { isSoundOn = !isSoundOn; localStorage.setItem('neon_sound', isSoundOn); updateUI(); }
function toggleVibrate() { isVibrateOn = !isVibrateOn; localStorage.setItem('neon_vibrate', isVibrateOn); updateUI(); }

window.onload = init;
