let level = 1, tubes = [], selected = null, history = [], audioCtx = null;
let soundEnabled = true, vibrateEnabled = true, currentLang = 'en';

const COLORS = ['#ff0055', '#00f2fe', '#4facfe', '#fadb14', '#70e000', '#9b59b6', '#ff8c00', '#ffffff'];

const LANGS = {
    en: {
        level: "Level", settings: "Settings", sound: "Sound", vibrate: "Vibrate",
        auto: "Auto", contact: "Contact Us", share: "Share Game", next: "NEXT LEVEL",
        win: "FANTASTIC!", skipQ: "Skip this level?", resetQ: "Restart level?", copied: "Link Copied!"
    },
    ar: {
        level: "مستوى", settings: "الإعدادات", sound: "الصوت", vibrate: "اهتزاز",
        auto: "تلقائي", contact: "تواصل معنا", share: "مشاركة", next: "المستوى التالي",
        win: "رائع!", skipQ: "هل تريد تخطي المستوى؟", resetQ: "إعادة تشغيل المستوى؟", copied: "تم نسخ الرابط!"
    },
    fa: {
        level: "مرحله", settings: "تنظیمات", sound: "صدا", vibrate: "لرزش",
        auto: "خودکار", contact: "تماس با ما", share: "اشتراک‌گذاری", next: "مرحله بعد",
        win: "عالی بود!", skipQ: "این مرحله رد شود؟", resetQ: "شروع مجدد مرحله؟", copied: "لینک کپی شد!"
    }
};

function changeLang(lang) {
    currentLang = lang;
    localStorage.setItem('neon_lang', lang);
    
    // بروزرسانی تمام متون در صفحه
    document.getElementById('txt-level').innerText = LANGS[lang].level;
    document.getElementById('txt-start-level').innerText = LANGS[lang].level;
    document.getElementById('txt-settings').innerText = LANGS[lang].settings;
    document.getElementById('txt-sound').innerText = LANGS[lang].sound;
    document.getElementById('txt-vibrate').innerText = LANGS[lang].vibrate;
    document.getElementById('txt-auto').innerText = LANGS[lang].auto;
    document.getElementById('txt-contact').innerText = LANGS[lang].contact;
    document.getElementById('txt-share').innerText = LANGS[lang].share;
    document.getElementById('txt-win').innerText = LANGS[lang].win;
    document.getElementById('txt-next').innerText = LANGS[lang].next;

    // تغییر جهت صفحه (RTL برای عربی و فارسی)
    document.body.className = (lang === 'ar' || lang === 'fa') ? 'rtl' : '';
    
    // فعال کردن دکمه مربوطه در تنظیمات
    document.querySelectorAll('.lang-switch button').forEach(b => b.classList.remove('active'));
    document.getElementById('btn-' + lang).classList.add('active');
}

function playSnd(f, d) {
    if(!soundEnabled) return;
    try {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') audioCtx.resume();
        let o = audioCtx.createOscillator(), g = audioCtx.createGain();
        o.connect(g); g.connect(audioCtx.destination);
        o.frequency.value = f; g.gain.setValueAtTime(0.1, audioCtx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + d);
        o.start(); o.stop(audioCtx.currentTime + d);
    } catch(e) {}
}

function init() {
    level = parseInt(localStorage.getItem('neon_lvl')) || 1;
    soundEnabled = localStorage.getItem('neon_snd') !== 'false';
    vibrateEnabled = localStorage.getItem('neon_vib') !== 'false';
    const savedLang = localStorage.getItem('neon_lang') || 'en';
    
    changeLang(savedLang);
    
    if(!soundEnabled) document.getElementById('sound-toggle').classList.remove('active');
    if(!vibrateEnabled) document.getElementById('vibrate-toggle').classList.remove('active');
    
    showMainMenu();
}

function showMainMenu() {
    document.getElementById('start-level').innerText = level;
    document.getElementById('start-menu').style.display = 'flex';
}

function startGame() {
    document.getElementById('start-menu').style.display = 'none';
    if(tubes.length === 0) loadLevel();
}

function loadLevel() {
    document.getElementById('level-num').innerText = level;
    document.getElementById('win-overlay').style.display = 'none';
    selected = null; history = [];
    let colorCount = Math.min(3 + Math.floor(level / 5), 8);
    let balls = [];
    for(let i=0; i<colorCount; i++) { for(let j=0; j<4; j++) balls.push(COLORS[i]); }
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
            ball.style.boxShadow = `0 0 10px ${color}80, inset -3px -3px 5px rgba(0,0,0,0.4)`;
            div.appendChild(ball);
        });
        board.appendChild(div);
    });
    document.getElementById('undo-count').innerText = history.length;
}

function tap(i) {
    if(selected === null) {
        if(tubes[i].length > 0) { selected = i; playSnd(440, 0.08); render(); }
    } else {
        if(selected !== i) moveLogic(selected, i);
        selected = null; render();
    }
}

function moveLogic(from, to) {
    let f = tubes[from], t = tubes[to];
    if(f.length === 0) return;
    let color = f[f.length - 1];
    if(t.length < 4 && (t.length === 0 || t[t.length-1] === color)) {
        history.push(JSON.stringify(tubes));
        while(f.length > 0 && f[f.length-1] === color && t.length < 4) { t.push(f.pop()); }
        playSnd(600, 0.1);
        if(vibrateEnabled && window.navigator.vibrate) window.navigator.vibrate(30);
        if(checkWin()) setTimeout(() => { document.getElementById('win-overlay').style.display = 'flex'; playSnd(800, 0.4); }, 300);
    }
}

function checkWin() {
    return tubes.filter(t => t.length > 0).every(t => t.length === 4 && t.every(b => b === t[0]));
}

function nextLevel() { level++; localStorage.setItem('neon_lvl', level); loadLevel(); }
function reset() { if(confirm(LANGS[currentLang].resetQ)) loadLevel(); }
function undo() { if(history.length > 0) { tubes = JSON.parse(history.pop()); render(); } }
function addTube() { if(tubes.length < 12) { tubes.push([]); render(); playSnd(500, 0.1); } }
function skipLevel() { if(confirm(LANGS[currentLang].skipQ)) nextLevel(); }
function toggleSettings(show) { document.getElementById('settings-panel').style.display = show ? 'flex' : 'none'; }

function toggleOption(type) {
    if(type === 'sound') {
        soundEnabled = !soundEnabled;
        document.getElementById('sound-toggle').classList.toggle('active');
        localStorage.setItem('neon_snd', soundEnabled);
        if(soundEnabled) playSnd(600, 0.1);
    } else if(type === 'vibrate') {
        vibrateEnabled = !vibrateEnabled;
        document.getElementById('vibrate-toggle').classList.toggle('active');
        localStorage.setItem('neon_vib', vibrateEnabled);
        if(vibrateEnabled && window.navigator.vibrate) window.navigator.vibrate(50);
    }
}

function shareGame() {
    navigator.clipboard.writeText(window.location.href).then(() => alert(LANGS[currentLang].copied));
}

init();
