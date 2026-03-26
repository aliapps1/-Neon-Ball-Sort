let startTime = 0;
let level = 1, tubes = [], selected = null, history = [], audioCtx = null;
let soundEnabled = true, vibrateEnabled = true, currentLang = 'en';
let coins = parseInt(localStorage.getItem("neon_coins")) || 100;
let rewardUsed = false;
let undoUsed = false;
let hintUsed = false;
let skipUsed = false;
let addTubeUsed = false;
let hintFrom = null, hintTo = null;
let initialTubes = null;

const COSTS = {
    undo: 5,
    hint: 8,
    addTube: 15,
    skip: 25,
    freeCoins: 5,
    win: 10,
    doubleReward: 10
};

const COLORS = [
    '#ff0055', '#00f2fe', '#4facfe', '#fadb14',
    '#70e000', '#9b59b6', '#ff8c00', '#ffffff'
];

const LANGS = {
    en: {
        level: "Level",
        settings: "Settings",
        sound: "Sound",
        vibrate: "Vibrate",
        contact: "Contact",
        share: "Share",
        next: "NEXT",
        win: "FANTASTIC",
        reward: "+10 Coins",
        doubleReward: "🎥 Double Reward",
        freeCoins: "🎥 Get Coins",
        hintBtn: "💡 Hint",
        skip: "⏭️ Skip",
        noCoins: "Not enough coins",
        noHint: "No hint available",
        perfect: "🔥 PERFECT! +20",
        speedBonus: "⚡ Speed Bonus! +15",
        freeCoinsToast: "+5 Coins 💰",
        doubleRewardToast: "+20 Coins 💰",
        copied: "Link copied!"
    },
    ar: {
        level: "مستوى",
        settings: "الإعدادات",
        sound: "الصوت",
        vibrate: "اهتزاز",
        contact: "اتصل بنا",
        share: "مشاركة",
        next: "التالي",
        win: "رائع",
        reward: "+10 عملات",
        doubleReward: "🎥 مضاعفة الجائزة",
        freeCoins: "🎥 احصل على عملات",
        hintBtn: "💡 تلميح",
        skip: "⏭️ تخطي",
        noCoins: "لا توجد عملات كافية",
        noHint: "لا يوجد تلميح متاح",
        perfect: "🔥 مثالي! +20",
        speedBonus: "⚡ مكافأة السرعة! +15",
        freeCoinsToast: "+5 عملات 💰",
        doubleRewardToast: "+20 عملة 💰",
        copied: "تم نسخ الرابط!"
    },
    fa: {
        level: "مرحله",
        settings: "تنظیمات",
        sound: "صدا",
        vibrate: "لرزش",
        contact: "تماس",
        share: "اشتراک‌گذاری",
        next: "بعدی",
        win: "عالی",
        reward: "+10 سکه",
        doubleReward: "🎥 دوبرابر جایزه",
        freeCoins: "🎥 دریافت سکه",
        hintBtn: "💡 راهنما",
        skip: "⏭️ رد کردن",
        noCoins: "سکه کافی نداری",
        noHint: "راهنمایی پیدا نشد",
        perfect: "🔥 بی‌نقص! +20",
        speedBonus: "⚡ جایزه سرعت! +15",
        freeCoinsToast: "+5 سکه 💰",
        doubleRewardToast: "+20 سکه 💰",
        copied: "لینک کپی شد!"
    }
};

const RANKS = {
    en: [
        { min: 1, label: "Beginner" },
        { min: 21, label: "Skilled" },
        { min: 101, label: "Pro" },
        { min: 301, label: "Master" },
        { min: 701, label: "Legend" }
    ],
    ar: [
        { min: 1, label: "مبتدئ" },
        { min: 21, label: "ماهر" },
        { min: 101, label: "محترف" },
        { min: 301, label: "خبير" },
        { min: 701, label: "أسطورة" }
    ],
    fa: [
        { min: 1, label: "مبتدی" },
        { min: 21, label: "ماهر" },
        { min: 101, label: "حرفه‌ای" },
        { min: 301, label: "استاد" },
        { min: 701, label: "افسانه‌ای" }
    ]
};

function saveCoins() {
    localStorage.setItem("neon_coins", coins);
}

function updateCoinsUI() {
    const el = document.getElementById("coins");
    if (el) el.innerText = coins;
}

function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.innerText = text;
}

function showToast(msg, duration = 1800) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.innerText = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), duration);
}

function getRank(lvl) {
    const list = RANKS[currentLang] || RANKS.en;
    let rank = list[0].label;
    list.forEach(item => {
        if (lvl >= item.min) rank = item.label;
    });
    return rank;
}

function updateStartRank() {
    setText('txt-start-level', getRank(level));
    setText('start-level', `${LANGS[currentLang].level} ${level}`);
}

function changeLang(lang) {
    currentLang = lang;
    localStorage.setItem('neon_lang', lang);
    const t = LANGS[lang];

    setText('txt-level', t.level);
    setText('txt-settings', t.settings);
    setText('txt-sound', t.sound);
    setText('txt-vibrate', t.vibrate);
    setText('txt-contact', t.contact);
    setText('txt-share', t.share);
    setText('txt-win', t.win);
    setText('txt-next', t.next);
    setText('txt-reward', t.reward);
    setText('txt-double-reward', t.doubleReward);
    setText('txt-free-coins', t.freeCoins);
    setText('txt-skip-btn', t.skip);
    setText('txt-hint-btn', t.hintBtn);

    ['en', 'ar', 'fa'].forEach(code => {
        document.getElementById('btn-' + code)?.classList.toggle('active', code === lang);
    });

    updateStartRank();
    document.body.dir = (lang === 'fa' || lang === 'ar') ? 'rtl' : 'ltr';
}

function playSnd(f = 600, d = 0.1) {
    if (!soundEnabled) return;

    try {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }

        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }

        const o = audioCtx.createOscillator();
        const g = audioCtx.createGain();

        o.connect(g);
        g.connect(audioCtx.destination);

        o.frequency.value = f;
        g.gain.setValueAtTime(0.1, audioCtx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + d);

        o.start();
        o.stop(audioCtx.currentTime + d);
    } catch (e) {}
}

function getLevelConfig(level) {
    if (level <= 5)   return { colors: 3, emptyTubes: 2, reverseMoves: 18 };
    if (level <= 15)  return { colors: 4, emptyTubes: 2, reverseMoves: 28 };
    if (level <= 30)  return { colors: 5, emptyTubes: 2, reverseMoves: 40 };
    if (level <= 60)  return { colors: 6, emptyTubes: 2, reverseMoves: 55 };
    if (level <= 100) return { colors: 6, emptyTubes: 1, reverseMoves: 70 };
    if (level <= 150) return { colors: 7, emptyTubes: 2, reverseMoves: 82 };
    if (level <= 220) return { colors: 7, emptyTubes: 1, reverseMoves: 96 };
    return { colors: 8, emptyTubes: 1, reverseMoves: 110 };
}

function cloneState(state) {
    return state.map(t => [...t]);
}

function isSolved(state) {
    return state.every(t => t.length === 0 || (t.length === 4 && t.every(v => v === t[0])));
}

function buildSolvedState(colors, emptyTubes) {
    const state = [];
    for (let i = 0; i < colors; i++) {
        state.push([COLORS[i], COLORS[i], COLORS[i], COLORS[i]]);
    }
    for (let i = 0; i < emptyTubes; i++) {
        state.push([]);
    }
    return state;
}

function topStreak(tube) {
    if (tube.length === 0) return 0;
    const top = tube[tube.length - 1];
    let count = 1;
    for (let i = tube.length - 2; i >= 0; i--) {
        if (tube[i] === top) count++;
        else break;
    }
    return count;
}

function countCompleteTubes(state) {
    return state.filter(t => t.length === 4 && t.every(v => v === t[0])).length;
}

function countTopPairs(state) {
    let count = 0;
    for (const tube of state) {
        if (topStreak(tube) === 2) count++;
    }
    return count;
}

function countTopTriples(state) {
    let count = 0;
    for (const tube of state) {
        if (topStreak(tube) >= 3) count++;
    }
    return count;
}

function hasValidPlayerMove(state) {
    for (let from = 0; from < state.length; from++) {
        const source = state[from];
        if (source.length === 0) continue;

        const color = source[source.length - 1];

        for (let to = 0; to < state.length; to++) {
            if (from === to) continue;

            const target = state[to];
            if (target.length >= 4) continue;

            if (target.length === 0 || target[target.length - 1] === color) {
                return true;
            }
        }
    }
    return false;
}

function getReverseCandidates(state) {
    const moves = [];

    for (let from = 0; from < state.length; from++) {
        const source = state[from];
        if (source.length === 0) continue;

        const movingColor = source[source.length - 1];

        for (let to = 0; to < state.length; to++) {
            if (from === to) continue;

            const target = state[to];
            if (target.length >= 4) continue;

            // reverse move قانونی = همان قانون move اصلی
            if (target.length === 0 || target[target.length - 1] === movingColor) {
                moves.push({ from, to });
            }
        }
    }

    return moves;
}

function applyMove(state, from, to) {
    state[to].push(state[from].pop());
}

function scoreLevelQuality(state, config) {
    if (isSolved(state)) return -9999;
    if (countCompleteTubes(state) > 0) return -9999;
    if (!hasValidPlayerMove(state)) return -9999;

    const triples = countTopTriples(state);
    const pairs = countTopPairs(state);
    const emptyCount = state.filter(t => t.length === 0).length;

    let score = 0;

    // سختی پایه
    score += config.colors * 10;
    score += (2 - config.emptyTubes) * 16;

    // stage خیلی آماده نباشه
    score -= triples * 20;
    score -= pairs * 7;

    // stage خیلی خفه هم نباشه
    if (pairs === 0) score -= 10;
    if (triples > 1) score -= 50;
    if (emptyCount > config.emptyTubes) score -= 25;

    // stage متعادل‌تر
    if (pairs >= 1 && pairs <= 3) score += 10;
    if (triples === 1
