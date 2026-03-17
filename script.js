let level = 1, tubes = [], selected = null;
let isSoundOn = true, isVibrateOn = true, currentLang = 'en';

const COLORS = ['#ff0055', '#00f2fe', '#4facfe', '#fadb14', '#70e000', '#9b59b6', '#ff8c00', '#ffffff'];

const LANGS = {
    en: { level: "Level", settings: "Settings", sound: "Sound", vibrate: "Vibrate", share: "Share Game", privacy: "Privacy", resetQ: "Restart?" },
    ar: { level: "مستوى", settings: "الإعدادات", sound: "الصوت", vibrate: "اهتزاز", share: "مشاركة", privacy: "الخصوصية", resetQ: "إعادة؟" },
    fa: { level: "مرحله", settings: "تنظیمات", sound: "صدا", vibrate: "لرزش", share: "اشتراک‌گذاری", privacy: "حریم خصوصی", resetQ: "دوباره؟" }
};

// تغییر زبان
function changeLang(lang) {
    currentLang = lang;
    localStorage.setItem('neon_lang', lang);
    const ids = { 'txt-level': 'level', 'txt-settings': 'settings', 'txt-sound': 'sound', 'txt-vibrate': 'vibrate', 'txt-share': 'share', 'txt-privacy': 'privacy' };
    for (let id in ids) {
        if (document.getElementById(id)) document.getElementById(id).innerText = LANGS[lang][ids[id]];
    }
    document.body.className = (lang === 'ar' || lang === 'fa') ? 'rtl' : '';
    document.querySelectorAll('.lang-switch button').forEach(b => b.classList.remove('active'));
    document.getElementById('btn-' + lang).classList.add('active');
}

// مدیریت صدا
function toggleSound() {
    isSoundOn = !isSoundOn;
    const btn = document.getElementById('sound-btn');
    btn.classList.toggle('active', isSoundOn);
    btn.querySelector('.icon').innerText = isSoundOn ? '🔊' : '🔈';
    localStorage.setItem('neon_sound', isSoundOn);
}

// مدیریت اهتزاز
function toggleVibrate() {
    isVibrateOn = !isVibrateOn;
    const btn = document.getElementById('vibrate-btn');
    btn.classList.toggle('active', isVibrateOn);
    if (isVibrateOn && navigator.vibrate) navigator.vibrate(50);
    localStorage.setItem('neon_vibrate', isVibrateOn);
}

// اشتراک‌گذاری هوشمند (واتساپ، تلگرام و غیره)
async function shareGame() {
    const data = { title: 'Neon Ball Sort', text: 'Play this cool game!', url: window.location.href };
    try {
        if (navigator.share) await navigator.share(data);
        else window.open(`https://wa.me/?text=${encodeURIComponent(data.text + " " + data.url)}`);
    } catch (e) { console.log(e); }
}

function toggleSettings(show) { document.getElementById('settings-panel').style.display = show ? 'flex' : 'none'; }

function init() {
    level = parseInt(localStorage.getItem('neon_lvl')) || 1;
    const savedLang = localStorage.getItem('neon_lang') || 'en';
    isSoundOn = localStorage.getItem('neon_sound') !== 'false';
    isVibrateOn = localStorage.getItem('neon_vibrate') !== 'false';
    
    changeLang(savedLang);
    document.getElementById('sound-btn').classList.toggle('active', isSoundOn);
    document.getElementById('vibrate-btn').classList.toggle('active', isVibrateOn);
    loadLevel();
}

function loadLevel() {
    document.getElementById('level-num').innerText = level;
    // منطق ساخت لوله‌ها و توپ‌ها اینجا قرار می‌گیرد...
    render();
}

function render() { /* کد نمایش لوله‌ها */ }

init();
