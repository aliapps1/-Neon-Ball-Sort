let startTime = 0;
let level = 1, tubes = [], selected = null, history = [], audioCtx = null;
let soundEnabled = true, vibrateEnabled = true, currentLang = 'en';
let coins = parseInt(localStorage.getItem("neon_coins")) || 100;
let rewardUsed = false;
let hintFrom = null, hintTo = null;

// ✅ FIX 4: ذخیره snapshot اولیه برای reset واقعی
let initialTubes = null;

const COSTS = {
    undo: 5, hint: 8, addTube: 15, skip: 25,
    freeCoins: 5, win: 10, doubleReward: 10
};

function saveCoins() { localStorage.setItem("neon_coins", coins); }
function updateCoinsUI() { let el = document.getElementById("coins"); if (el) el.innerText = coins; }

const COLORS = ['#ff0055','#00f2fe','#4facfe','#fadb14','#70e000','#9b59b6','#ff8c00','#ffffff'];

function getLevelConfig(level) {
    if (level < 20)       return { colors: 3, emptyTubes: 2 };
    else if (level < 50)  return { colors: 4, emptyTubes: 2 };
    else if (level < 100) return { colors: 5, emptyTubes: 2 };
    else if (level < 200) return { colors: 6, emptyTubes: 2 };
    else                  return { colors: 7, emptyTubes: 2 };
}

// ✅ FIX 3: generateLevel حرفه‌ای
// از حالت حل‌شده شروع میکنه و با حرکت‌های معکوس shuffle میکنه
// این تضمین میکنه پازل همیشه قابل حل باشه
function generateLevel(colors, emptyTubes = 2) {
    let state = [];
    for (let i = 0; i < colors; i++) {
        state.push([COLORS[i], COLORS[i], COLORS[i], COLORS[i]]);
    }
    for (let i = 0; i < emptyTubes; i++) state.push([]);

    const totalTubes = colors + emptyTubes;
    const moves = Math.min(60 + level * 2, 200);

    for (let m = 0; m < moves; m++) {
        let candidates = [];

        for (let from = 0; from < totalTubes; from++) {
            if (state[from].length === 0) continue;
            let topFrom = state[from][state[from].length - 1];

            for (let to = 0; to < totalTubes; to++) {
                if (from === to) continue;
                if (state[to].length >= 4) continue;

                let topTo = state[to].length > 0 ? state[to][state[to].length - 1] : null;
                if (topTo !== null && topTo !== topFrom) continue;

                // جلوگیری از کامل کردن یه لوله (که بعداً reverse کنه به solved)
                let wouldComplete = state[to].length === 3 && state[to].every(b => b === topFrom);
                if (!wouldComplete) candidates.push({ from, to });
            }
        }

        if (candidates.length === 0) break;
        let move = candidates[Math.floor(Math.random() * candidates.length)];
        state[move.to].push(state[move.from].pop());
    }

    // اگه اتفاقاً solved بود، دوباره تلاش کن
    if (isSolved(state)) return generateLevel(colors, emptyTubes);

    return state;
}

function isSolved(state) {
    return state.every(t => t.length === 0 || (t.length === 4 && t.every(b => b === t[0])));
}

const LANGS = {
    en: {
        level:"Level", settings:"Settings", sound:"Sound", vibrate:"Vibrate",
        contact:"Contact", share:"Share", next:"NEXT", win:"FANTASTIC",
        reward:"+10 Coins", doubleReward:"🎥 Double Reward",
        freeCoins:"🎥 Get Coins", hintBtn:"💡 Hint",
        noCoins:"Not enough coins", noHint:"No hint available",
        perfect:"🔥 PERFECT! +20", speedBonus:"⚡ Speed Bonus! +15"
    },
    ar: {
        level:"مستوى", settings:"الإعدادات", sound:"الصوت", vibrate:"اهتزاز",
        contact:"اتصل بنا", share:"مشاركة", next:"التالي", win:"رائع",
        reward:"+10 عملات", doubleReward:"🎥 مضاعفة الجائزة",
        freeCoins:"🎥 احصل على عملات", hintBtn:"💡 تلميح",
        noCoins:"لا توجد عملات كافية", noHint:"لا يوجد تلميح متاح",
        perfect:"🔥 مثالي! +20", speedBonus:"⚡ مكافأة السرعة! +15"
    },
    fa: {
        level:"مرحله", settings:"تنظیمات", sound:"صدا", vibrate:"لرزش",
        contact:"تماس با ما", share:"اشتراک‌گذاری", next:"بعدی", win:"عالی",
        reward:"+10 سکه", doubleReward:"🎥 دوبرابر جایزه",
        freeCoins:"🎥 دریافت سکه", hintBtn:"💡 راهنما",
        noCoins:"سکه کافی نداری", noHint:"راهنمایی پیدا نشد",
        perfect:"🔥 بی‌نقص! +20", speedBonus:"⚡ جایزه سرعت! +15"
    }
};

const RANKS = {
    en: [{min:1,label:"Beginner"},{min:21,label:"Skilled"},{min:101,label:"Pro"},{min:301,label:"Master"},{min:701,label:"Legend"}],
    ar: [{min:1,label:"مبتدئ"},{min:21,label:"ماهر"},{min:101,label:"محترف"},{min:301,label:"خبير"},{min:701,label:"أسطورة"}],
    fa: [{min:1,label:"مبتدی"},{min:21,label:"ماهر"},{min:101,label:"حرفه‌ای"},{min:301,label:"استاد"},{min:701,label:"افسانه‌ای"}]
};

function setText(id, text) { let el = document.getElementById(id); if (el) el.innerText = text; }

function getRank(lvl) {
    const list = RANKS[currentLang] || RANKS.en;
    let r = list[0].label;
    list.forEach(e => { if (lvl >= e.min) r = e.label; });
    return r;
}

function updateStartRank() {
    setText('txt-start-level', getRank(level));
    setText('start-level', `${LANGS[currentLang].level} ${level}`);
}

function changeLang(lang) {
    currentLang = lang;
    localStorage.setItem('neon_lang', lang);
    let t = LANGS[lang];

    setText('txt-level', t.level);         setText('txt-settings', t.settings);
    setText('txt-sound', t.sound);         setText('txt-vibrate', t.vibrate);
    setText('txt-contact', t.contact);     setText('txt-share', t.share);
    setText('txt-win', t.win);             setText('txt-next', t.next);
    setText('txt-reward', t.reward);       setText('txt-double-reward', t.doubleReward);
    setText('txt-free-coins', t.freeCoins);
    setText('txt-hint-btn', t.hintBtn); // ✅ فقط یک hint button در ad-box

    ['en','ar','fa'].forEach(l => {
        document.getElementById('btn-' + l)?.classList.toggle('active', l === lang);
    });

    updateStartRank();
    document.body.dir = (lang === 'fa' || lang === 'ar') ? 'rtl' : 'ltr';
}

function playSnd(f = 600, d = 0.1) {
    if (!soundEnabled) return;
    try {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') audioCtx.resume();
        let o = audioCtx.createOscillator(), g = audioCtx.createGain();
        o.connect(g); g.connect(audioCtx.destination);
        o.frequency.value = f;
        g.gain.setValueAtTime(0.1, audioCtx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + d);
        o.start(); o.stop(audioCtx.currentTime + d);
    } catch(e) {}
}

function showToast(msg, duration = 1800) {
    let toast = document.getElementById('toast');
    if (!toast) return;
    toast.innerText = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), duration);
}

document.addEventListener('DOMContentLoaded', init);

function init() {
    level = parseInt(localStorage.getItem('neon_lvl')) || 1;
    soundEnabled = localStorage.getItem('neon_snd') !== 'false';
    vibrateEnabled = localStorage.getItem('neon_vib') !== 'false';
    currentLang = localStorage.getItem('neon_lang') || 'en';

    changeLang(currentLang);
    updateCoinsUI();

    document.getElementById('sound-toggle')?.classList.toggle('active', soundEnabled);
    document.getElementById('vibrate-toggle')?.classList.toggle('active', vibrateEnabled);

    showMainMenu();
}

function showMainMenu() {
    updateStartRank();
    document.getElementById('start-menu').style.display = 'flex';
}

function startGame() {
    document.getElementById('start-menu').style.display = 'none';
    loadLevel();
}

function loadLevel() {
    setText('level-num', level);
    startTime = Date.now();

    document.getElementById('win-overlay').style.display = 'none';

    // ✅ FIX 5: reset کامل دکمه Double Reward در هر بار loadLevel
    rewardUsed = false;
    let drBtn = document.getElementById('txt-double-reward');
    if (drBtn) { drBtn.style.opacity = ''; drBtn.style.pointerEvents = ''; }

    selected = null; history = []; hintFrom = null; hintTo = null;

    let config = getLevelConfig(level);
    tubes = generateLevel(config.colors, config.emptyTubes);

    // ✅ FIX 4: snapshot اولیه
    initialTubes = JSON.stringify(tubes);

    render();
}

function render() {
    let board = document.getElementById('board');
    board.innerHTML = '';

    tubes.forEach((t, i) => {
        let div = document.createElement('div');
        let classes = ['tube'];
        if (selected === i) classes.push('active');
        if (hintFrom === i) classes.push('hint-from');
        if (hintTo === i) classes.push('hint-to');
        div.className = classes.join(' ');
        div.onclick = () => tap(i);

        t.forEach(color => {
            let b = document.createElement('div');
            b.className = 'ball';
            b.style.backgroundColor = color;
            b.style.setProperty('--ball-color', color);
            div.appendChild(b);
        });

        board.appendChild(div);
    });

    setText('undo-count', history.length);
    updateCoinsUI();
}

function tap(i) {
    if (selected === null) {
        if (tubes[i].length > 0) { selected = i; playSnd(400, 0.05); }
    } else {
        if (selected !== i) moveLogic(selected, i);
        selected = null;
    }
    render();
}

function moveLogic(from, to) {
    let f = tubes[from], t = tubes[to];
    if (f.length === 0) return false;

    let color = f[f.length - 1];
    if (t.length < 4 && (t.length === 0 || t[t.length - 1] === color)) {
        history.push(JSON.stringify(tubes));
        while (f.length > 0 && f[f.length - 1] === color && t.length < 4) {
            t.push(f.pop());
        }
        hintFrom = null; hintTo = null;
        playSnd(600, 0.1);
        if (vibrateEnabled && navigator.vibrate) navigator.vibrate(30);
        if (isSolved(tubes)) handleWin();
        return true;
    }
    return false;
}

function handleWin() {
    coins += COSTS.win;

    if (history.length === 0) {
        coins += 20;
        setTimeout(() => showToast(LANGS[currentLang].perfect), 350);
    }

    let time = (Date.now() - startTime) / 1000;
    if (time < 20) {
        coins += 15;
        setTimeout(() => showToast(LANGS[currentLang].speedBonus), 900);
    }

    saveCoins(); updateCoinsUI();

    setTimeout(() => {
        document.getElementById('win-overlay').style.display = 'flex';
        playSnd(800, 0.3);
    }, 400);
}

function nextLevel() {
    level++;
    localStorage.setItem('neon_lvl', level);
    updateStartRank();
    loadLevel();
}

// ✅ FIX 4: reset واقعی — همان پازل اولیه را برمیگردونه
function reset() {
    if (!initialTubes) { loadLevel(); return; }
    tubes = JSON.parse(initialTubes);
    selected = null; history = []; hintFrom = null; hintTo = null;
    startTime = Date.now();
    render();
}

function undo() {
    if (history.length === 0) return;
    if (!spendCoins(COSTS.undo)) return;
    tubes = JSON.parse(history.pop());
    hintFrom = null; hintTo = null;
    render();
}

function addTube() {
    if (tubes.length >= 12) return;
    if (!spendCoins(COSTS.addTube)) return;
    tubes.push([]); render();
}

function skipLevel() {
    if (!spendCoins(COSTS.skip)) return;
    nextLevel();
}

function toggleSettings(show) {
    document.getElementById('settings-panel').style.display = show ? 'flex' : 'none';
}

function toggleOption(type) {
    if (type === 'sound') {
        soundEnabled = !soundEnabled;
        localStorage.setItem('neon_snd', soundEnabled);
        document.getElementById('sound-toggle')?.classList.toggle('active', soundEnabled);
        if (soundEnabled) playSnd(700, 0.1);
    }
    if (type === 'vibrate') {
        vibrateEnabled = !vibrateEnabled;
        localStorage.setItem('neon_vib', vibrateEnabled);
        document.getElementById('vibrate-toggle')?.classList.toggle('active', vibrateEnabled);
        if (vibrateEnabled && navigator.vibrate) navigator.vibrate(50);
    }
}

function spendCoins(amount) {
    if (coins < amount) { showCoinPopup(); return false; }
    coins -= amount;
    saveCoins(); updateCoinsUI();
    return true;
}

function findHintMove() {
    for (let from = 0; from < tubes.length; from++) {
        let f = tubes[from];
        if (f.length === 0) continue;
        let color = f[f.length - 1];
        for (let to = 0; to < tubes.length; to++) {
            if (from === to) continue;
            let t = tubes[to];
            if (t.length < 4 && (t.length === 0 || t[t.length - 1] === color)) {
                return { from, to };
            }
        }
    }
    return null;
}

// ✅ hint اول پیدا میکنه، بعد سکه کم میکنه
function useHint() {
    const hint = findHintMove();
    if (!hint) { showToast(LANGS[currentLang].noHint); return; }
    if (!spendCoins(COSTS.hint)) return;
    hintFrom = hint.from;
    hintTo = hint.to;
    render();
    setTimeout(() => { hintFrom = null; hintTo = null; render(); }, 1400);
}

function watchCoinsReward() {
    coins += COSTS.freeCoins;
    saveCoins(); updateCoinsUI();
    closeCoinPopup();
    showToast(`+${COSTS.freeCoins} 💰`);
}

// ✅ FIX 5: فقط سکه میده — nextLevel صدا نمیزنه
function watchAdReward() {
    if (rewardUsed) return;
    rewardUsed = true;
    coins += COSTS.win * 2;
    saveCoins(); updateCoinsUI();
    let btn = document.getElementById('txt-double-reward');
    if (btn) { btn.style.opacity = '0.5'; btn.style.pointerEvents = 'none'; }
    showToast(`+${COSTS.win * 2} 💰`);
}

function showCoinPopup() {
    let text = document.getElementById('popup-text');
    if (text) text.innerText = LANGS[currentLang].noCoins;
    document.getElementById('coin-popup').style.display = 'flex';
}

function closeCoinPopup() {
    document.getElementById('coin-popup').style.display = 'none';
}

async function shareGame() {
    const text = { en:"Try this puzzle!", ar:"جرب اللعبة!", fa:"این بازی رو امتحان کن!" };
    try {
        if (navigator.share) {
            await navigator.share({ title:"Neon Ball Sort", text:text[currentLang], url:window.location.href });
        } else {
            await navigator.clipboard.writeText(window.location.href);
            showToast("Link copied!");
        }
    } catch(e) {}
        }
