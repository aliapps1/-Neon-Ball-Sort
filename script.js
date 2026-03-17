let level = 1, tubes = [], selected = null, history = [];
let isSoundOn = true, isVibrateOn = true, currentLang = 'en';

const COLORS = ['#ff0055', '#00f2fe', '#4facfe', '#fadb14', '#70e000', '#9b59b6', '#ff8c00', '#ffffff'];

const LANGS = {
    en: { level: "Level", settings: "Settings", sound: "Sound", vibrate: "Vibrate", share: "Share Game", privacy: "Privacy", win: "FANTASTIC!", resetQ: "Restart level?" },
    ar: { level: "مستوى", settings: "الإعدادات", sound: "الصوت", vibrate: "اهتزاز", share: "مشاركة", privacy: "الخصوصية", win: "رائع!", resetQ: "إعادة تشغيل؟" },
    fa: { level: "مرحله", settings: "تنظیمات", sound: "صدا", vibrate: "لرزش", share: "اشتراک‌گذاری", privacy: "حریم خصوصی", win: "عالی بود!", resetQ: "دوباره؟" }
};

function changeLang(lang) {
    currentLang = lang;
    localStorage.setItem('neon_lang', lang);
    const ids = { 'txt-level': 'level', 'txt-settings': 'settings', 'txt-sound': 'sound', 'txt-vibrate': 'vibrate', 'txt-share': 'share', 'txt-privacy': 'privacy', 'txt-win': 'win' };
    for (let id in ids) {
        if (document.getElementById(id)) document.getElementById(id).innerText = LANGS[lang][ids[id]];
    }
    document.body.className = (lang === 'ar' || lang === 'fa') ? 'rtl' : '';
    document.querySelectorAll('.lang-switch button').forEach(b => b.classList.remove('active'));
    if(document.getElementById('btn-' + lang)) document.getElementById('btn-' + lang).classList.add('active');
}

function toggleSound() {
    isSoundOn = !isSoundOn;
    const btn = document.getElementById('sound-btn');
    btn.classList.toggle('active', isSoundOn);
    btn.querySelector('.icon').innerText = isSoundOn ? '🔊' : '🔈';
    localStorage.setItem('neon_sound', isSoundOn);
}

function toggleVibrate() {
    isVibrateOn = !isVibrateOn;
    const btn = document.getElementById('vibrate-btn');
    btn.classList.toggle('active', isVibrateOn);
    if (isVibrateOn && navigator.vibrate) navigator.vibrate(50);
    localStorage.setItem('neon_vibrate', isVibrateOn);
}

async function shareGame() {
    const data = { title: 'Neon Ball Sort Pro', text: 'Check out this game!', url: window.location.href };
    try {
        if (navigator.share) await navigator.share(data);
        else window.open(`https://wa.me/?text=${encodeURIComponent(data.text + " " + data.url)}`);
    } catch (e) { console.log(e); }
}

function loadLevel() {
    document.getElementById('level-num').innerText = level;
    document.getElementById('win-overlay').style.display = 'none';
    let colorCount = Math.min(3 + Math.floor(level / 5), 8);
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
    if(selected === null) { if(tubes[i].length > 0) { selected = i; render(); } }
    else { moveLogic(selected, i); selected = null; render(); }
}

function moveLogic(from, to) {
    let f = tubes[from], t = tubes[to];
    if(from !== to && f.length > 0 && (t.length === 0 || t[t.length-1] === f[f.length-1]) && t.length < 4) {
        t.push(f.pop());
        if(checkWin()) document.getElementById('win-overlay').style.display = 'flex';
    }
    render();
}

function checkWin() { return tubes.filter(t => t.length > 0).every(t => t.length === 4 && t.every(b => b === t[0])); }
function nextLevel() { level++; localStorage.setItem('neon_lvl', level); loadLevel(); }
function resetLevel() { if(confirm(LANGS[currentLang].resetQ)) loadLevel(); }
function toggleSettings(s) { document.getElementById('settings-panel').style.display = s ? 'flex' : 'none'; }

// شروع اولیه بازی
window.onload = () => {
    level = parseInt(localStorage.getItem('neon_lvl')) || 1;
    isSoundOn = localStorage.getItem('neon_sound') !== 'false';
    isVibrateOn = localStorage.getItem('neon_vibrate') !== 'false';
    changeLang(localStorage.getItem('neon_lang') || 'en');
    document.getElementById('sound-btn').classList.toggle('active', isSoundOn);
    document.getElementById('vibrate-btn').classList.toggle('active', isVibrateOn);
    loadLevel();
};
