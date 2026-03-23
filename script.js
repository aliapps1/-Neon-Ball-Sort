let level = 1, tubes = [], selected = null, history = [], audioCtx = null;
let soundEnabled = true, vibrateEnabled = true, currentLang = 'en';

// 💰 سیستم سکه
let coins = parseInt(localStorage.getItem("neon_coins")) || 100;

function saveCoins() {
    localStorage.setItem("neon_coins", coins);
}

function updateCoinsUI() {
    const el = document.getElementById("coins");
    if(el) el.innerText = coins;
}

// 🎯 رنگ‌ها
const COLORS = ['#ff0055', '#00f2fe', '#4facfe', '#fadb14', '#70e000', '#9b59b6', '#ff8c00', '#ffffff'];

// 🌍 زبان‌ها
const LANGS = {
    en: { level:"Level", settings:"Settings", sound:"Sound", vibrate:"Vibrate", auto:"Auto", contact:"Contact", share:"Share", next:"NEXT LEVEL", win:"FANTASTIC!" },
    ar: { level:"مستوى", settings:"الإعدادات", sound:"الصوت", vibrate:"اهتزاز", auto:"تلقائي", contact:"تواصل", share:"مشاركة", next:"التالي", win:"رائع!" },
    fa: { level:"مرحله", settings:"تنظیمات", sound:"صدا", vibrate:"لرزش", auto:"خودکار", contact:"تماس", share:"اشتراک", next:"بعدی", win:"عالی!" }
};

function changeLang(lang) {
    currentLang = lang;
    localStorage.setItem('neon_lang', lang);
    document.body.className = (lang === 'ar' || lang === 'fa') ? 'rtl' : '';
}

// 🔊 صدا
function playSnd(f, d) {
    if(!soundEnabled) return;
    try {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        let o = audioCtx.createOscillator(), g = audioCtx.createGain();
        o.connect(g); g.connect(audioCtx.destination);
        o.frequency.value = f;
        g.gain.setValueAtTime(0.1, audioCtx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + d);
        o.start(); o.stop(audioCtx.currentTime + d);
    } catch(e) {}
}

// 🚀 شروع
function init() {
    level = parseInt(localStorage.getItem('neon_lvl')) || 1;
    soundEnabled = localStorage.getItem('neon_snd') !== 'false';
    vibrateEnabled = localStorage.getItem('neon_vib') !== 'false';

    changeLang(localStorage.getItem('neon_lang') || 'en');

    dailyReward();
    updateCoinsUI();
    showMainMenu();
}

// 🎁 جایزه روزانه
function dailyReward() {
    let last = localStorage.getItem("last_reward");
    let now = Date.now();

    if (!last || now - last > 86400000) {
        coins += 50;
        localStorage.setItem("last_reward", now);
        saveCoins();
        alert("🎁 Daily Reward: 50 Coins");
    }
}

// 🏠 منو
function showMainMenu() {
    document.getElementById('start-level').innerText = level;
    document.getElementById('start-menu').style.display = 'flex';
}

function startGame() {
    document.getElementById('start-menu').style.display = 'none';
    if(tubes.length === 0) loadLevel();
}

// 🧠 ساخت مرحله
function loadLevel() {
    document.getElementById('level-num').innerText = level;
    document.getElementById('win-overlay').style.display = 'none';
    selected = null; history = [];

    let colorCount = Math.min(3 + Math.floor(level / 5), 8);
    let balls = [];

    for(let i=0; i<colorCount; i++) {
        for(let j=0; j<4; j++) balls.push(COLORS[i]);
    }

    // shuffle بهتر
    for (let i = balls.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [balls[i], balls[j]] = [balls[j], balls[i]];
    }

    tubes = [];
    for(let i=0; i<colorCount; i++) tubes.push(balls.splice(0, 4));
    tubes.push([]); tubes.push([]);

    render();
}

// 🎨 رندر
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

    document.getElementById('undo-count').innerText = history.length;
    updateCoinsUI();
}

// 👆 کلیک
function tap(i) {
    if(selected === null) {
        if(tubes[i].length > 0) {
            selected = i;
            playSnd(400, 0.05);
        }
    } else {
        if(selected !== i) moveLogic(selected, i);
        selected = null;
    }
    render();
}

// 🔄 حرکت
function moveLogic(from, to) {
    let f = tubes[from], t = tubes[to];
    if(f.length === 0) return;

    let color = f[f.length - 1];

    if(t.length < 4 && (t.length === 0 || t[t.length-1] === color)) {
        history.push(JSON.stringify(tubes));

        while(f.length > 0 && f[f.length-1] === color && t.length < 4) {
            t.push(f.pop());
        }

        playSnd(600, 0.1);

        if(checkWin()) {
            setTimeout(() => {
                coins += 10;
                saveCoins();
                updateCoinsUI();
                document.getElementById('win-overlay').style.display = 'flex';
                playSnd(800, 0.3);
            }, 300);
        }
    }
}

// 🏆 برد
function checkWin() {
    return tubes.filter(t => t.length > 0)
        .every(t => t.length === 4 && t.every(b => b === t[0]));
}

// ➡️ مرحله بعد
function nextLevel() {
    level++;
    localStorage.setItem('neon_lvl', level);
    loadLevel();
}

// 🔄 ریست
function reset() {
    if(confirm("Restart level?")) loadLevel();
}

// ↩️ undo (پولی)
function undo() {
    if (coins < 20) return alert("Not enough coins!");
    coins -= 20;
    saveCoins();

    if(history.length > 0) {
        tubes = JSON.parse(history.pop());
    }

    render();
}

// ➕ tube (پولی)
function addTube() {
    if (coins < 50) return alert("Not enough coins!");
    coins -= 50;
    saveCoins();

    if(tubes.length < 12) tubes.push([]);
    render();
}

// ⏭ skip (پولی)
function skipLevel() {
    if (coins < 100) return alert("Not enough coins!");
    coins -= 100;
    saveCoins();
    nextLevel();
}

// 🎥 تبلیغ فیک
function watchAdReward() {
    alert("Watching Ad...");
    setTimeout(() => {
        coins += 30;
        saveCoins();
        updateCoinsUI();
        alert("+30 Coins!");
    }, 2000);
}

// ⚙️ تنظیمات
function toggleOption(type) {
    if(type === 'sound') {
        soundEnabled = !soundEnabled;
        localStorage.setItem('neon_snd', soundEnabled);
    } else if(type === 'vibrate') {
        vibrateEnabled = !vibrateEnabled;
        localStorage.setItem('neon_vib', vibrateEnabled);
    }
}
