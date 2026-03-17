let level = 1, tubes = [], selected = null, history = [], audioCtx = null;
let soundEnabled = true, vibrateEnabled = true, currentLang = 'en';

const COLORS = ['#ff0055', '#00f2fe', '#4facfe', '#fadb14', '#70e000', '#9b59b6', '#ff8c00', '#ffffff'];

const LANGS = {
    en: { level: "Level", settings: "Settings", sound: "Sound", vibrate: "Vibrate", contact: "Contact Us", privacy: "Privacy", next: "NEXT LEVEL", win: "FANTASTIC!", resetQ: "Restart level?" },
    ar: { level: "مستوى", settings: "الإعدادات", sound: "الصوت", vibrate: "اهتزاز", contact: "تواصل معنا", privacy: "الخصوصية", next: "المستوى التالي", win: "رائع!", resetQ: "إعادة تشغيل المستوى؟" },
    fa: { level: "مرحله", settings: "تنظیمات", sound: "صدا", vibrate: "لرزش", contact: "تماس با ما", privacy: "حریم خصوصی", next: "مرحله بعد", win: "عالی بود!", resetQ: "شروع مجدد مرحله؟" }
};

function changeLang(lang) {
    currentLang = lang;
    localStorage.setItem('neon_lang', lang);
    const ids = ['txt-level', 'txt-start-level', 'txt-settings', 'txt-sound', 'txt-vibrate', 'txt-contact', 'txt-privacy', 'txt-win', 'txt-next'];
    ids.forEach(id => {
        let key = id.replace('txt-', '').replace('start-', '');
        if(document.getElementById(id)) document.getElementById(id).innerText = LANGS[lang][key];
    });
    document.body.className = (lang === 'ar' || lang === 'fa') ? 'rtl' : '';
    document.querySelectorAll('.lang-switch button').forEach(b => b.classList.remove('active'));
    document.getElementById('btn-' + lang).classList.add('active');
}

function init() {
    level = parseInt(localStorage.getItem('neon_lvl')) || 1;
    const savedLang = localStorage.getItem('neon_lang') || 'en';
    changeLang(savedLang);
    showMainMenu();
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
    if(f.length > 0 && (t.length === 0 || t[t.length-1] === f[f.length-1]) && t.length < 4) {
        t.push(f.pop());
        if(checkWin()) document.getElementById('win-overlay').style.display = 'flex';
    }
}

function checkWin() { return tubes.filter(t => t.length > 0).every(t => t.length === 4 && t.every(b => b === t[0])); }
function nextLevel() { level++; localStorage.setItem('neon_lvl', level); loadLevel(); }
function showMainMenu() { document.getElementById('start-level').innerText = level; document.getElementById('start-menu').style.display = 'flex'; }
function startGame() { document.getElementById('start-menu').style.display = 'none'; loadLevel(); }
function toggleSettings(s) { document.getElementById('settings-panel').style.display = s ? 'flex' : 'none'; }
function reset() { if(confirm(LANGS[currentLang].resetQ)) loadLevel(); }

init();
