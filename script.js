let startTime = 0;
let level = 1, tubes = [], selected = null, history = [], audioCtx = null;
let soundEnabled = true, vibrateEnabled = true, currentLang = 'en';
let coins = parseInt(localStorage.getItem("neon_coins")) || 100;
let rewardUsed = false;
let undoUsed = false;
let hintUsed = false;
let skipUsed = false;
let addTubeUsed = false;
let addTubeCount = 0;
let hintFrom = null, hintTo = null;
let initialTubes = null;

// ✅ Win sound file
const winSound = new Audio("win_effect.mp3");
winSound.volume = 0.6;
winSound.preload = "auto";

function playWinSound() {
    if (!soundEnabled) return;
    try {
        winSound.currentTime = 0;
        winSound.play().catch(() => {});
    } catch (e) {}
}

const COSTS = {
    undo: 5, hint: 8, addTube: 15, skip: 25,
    freeCoins: 5, win: 10, doubleReward: 10
};

function saveCoins() { localStorage.setItem("neon_coins", coins); }
function updateCoinsUI() {
    let el = document.getElementById("coins");
    if (el) el.innerText = coins;
}

const COLORS = ['#ff0055','#00f2fe','#4facfe','#fadb14','#70e000','#9b59b6','#ff8c00','#ffffff','#ff6b6b','#00d4aa'];

function getLevelConfig(level) {
    if (level <= 5)        return { colors: 3, emptyTubes: 2 };
    else if (level <= 15)  return { colors: 4, emptyTubes: 2 };
    else if (level <= 30)  return { colors: 5, emptyTubes: 2 };
    else if (level <= 60)  return { colors: 6, emptyTubes: 2 };
    else if (level <= 100) return { colors: 7, emptyTubes: 2 };
    else if (level <= 150) return { colors: 8, emptyTubes: 2 };
    else if (level <= 220) return { colors: 9, emptyTubes: 2 };
    else                   return { colors: 10, emptyTubes: 2 };
}

function isSolved(state) {
    return state.every(t => t.length === 0 || (t.length === 4 && t.every(b => b === t[0])));
}

function isBadLevel(state) {
    for (let t of state) {
        if (t.length === 4 && t.every(b => b === t[0])) return true;
    }

    let easy = 0;
    for (let t of state) {
        if (t.length >= 2) {
            let top = t[t.length - 1];
            let count = 1;
            for (let i = t.length - 2; i >= 0; i--) {
                if (t[i] === top) count++;
