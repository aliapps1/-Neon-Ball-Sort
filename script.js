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
let winSound = null;

function playWinSound() {
    if (!soundEnabled) return;
    try {
        if (!winSound) {
            winSound = new Audio("win_effect.mp3");
            winSound.volume = 0.35;
        }
        winSound.currentTime = 0;
        winSound.play().catch(() => {});
        setTimeout(() => {
            if (winSound) {
                winSound.pause();
                winSound.currentTime = 0;
            }
        }, 3000);
    } catch (e) {}
}

const COSTS = { undo: 5, hint: 8, addTube: 15, skip: 25, freeCoins: 5, win: 10, doubleReward: 10 };

function saveCoins() { localStorage.setItem("neon_coins", coins); }
function updateCoinsUI() { const el = document.getElementById("coins"); if (el) el.innerText = coins; }

const COLORS = ['#ffb3c6','#00f2fe','#fff000','#70e000','#9b59b6','#ff8c00','#ffffff','#4facfe','#95a5a6','#3d2314','#009688','#e6004c'];

function getLevelConfig(level) {
    if (level <= 5) return { colors: 4, emptyTubes: 2 };
    if (level <= 20) return { colors: 6, emptyTubes: 2 };
    if (level <= 50) return { colors: 8, emptyTubes: 2 };
    if (level <= 100) return { colors: 9, emptyTubes: 2 };
    if (level <= 200) return { colors: 10, emptyTubes: 2 };
    if (level <= 300) return { colors: 11, emptyTubes: 2 };
    return { colors: 12, emptyTubes: 2 };
}

function isSolved(state) { return state.every(t => t.length === 0 || (t.length === 4 && t.every(b => b === t[0]))); }
function isBadLevel(state) {
    for (const t of state) if (t.length === 4 && t.every(b => b === t[0])) return true;
    let easy = 0;
    for (const t of state) {
        if (t.length >= 2) {
            const top = t[t.length - 1];
            let count = 1;
            for (let i = t.length - 2; i >= 0; i--) {
                if (t[i] === top) count++;
                else break;
            }
            if (count >= 2) easy++;
        }
    }
    return easy > 2;
}

function generateLevel(colors, emptyTubes = 2) {
    for (let attempt = 0; attempt < 100; attempt++) {
        const balls = [];
        for (let i = 0; i < colors; i++) for (let j = 0; j < 4; j++) balls.push(COLORS[i]);
        for (let i = balls.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [balls[i], balls[j]] = [balls[j], balls[i]];
        }
        const state = [];
        for (let i = 0; i < colors; i++) state.push(balls.slice(i * 4, i * 4 + 4));
        for (let i = 0; i < emptyTubes; i++) state.push([]);
        if (!isBadLevel(state)) return state;
    }

    const balls = [];
    for (let i = 0; i < colors; i++) for (let j = 0; j < 4; j++) balls.push(COLORS[i]);
    for (let i = balls.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [balls[i], balls[j]] = [balls[j], balls[i]];
    }
    const state = [];
    for (let i = 0; i < colors; i++) state.push(balls.slice(i * 4, i * 4 + 4));
    for (let i = 0; i < emptyTubes; i++) state.push([]);
    return state;
}

const LANGS = {
    en: {level:"Level",settings:"Settings",sound:"Sound",vibrate:"Vibrate",contact:"Contact Us",share:"Share App",next:"NEXT",win:"FANTASTIC",reward:"+10 Coins",doubleReward:"💰 Double Reward",freeCoins:"Get Coins",hintBtn:"💡 Hint",skip:"⏭️ Skip",addTube:"➕🧪 Add Tube",home:"Home",restart:"Restart",undo:"Undo",rank:"Rank",advertisement:"Advertisement",noCoins:"Not enough coins",noHint:"No hint available",perfect:"🔥 PERFECT! +20",speedBonus:"⚡ Speed Bonus! +15",freeCoinsToast:"+5 Coins 💰",doubleRewardToast:"+20 Coins 💰",copied:"Link copied!",premium:"Go Premium",support:"Support Developer",rate:"Rate App"},
    ar: {level:"مستوى",settings:"الإعدادات",sound:"الصوت",vibrate:"اهتزاز",contact:"اتصل بنا",share:"مشاركة التطبيق",next:"التالي",win:"رائع",reward:"+10 عملات 💰",doubleReward:"💰 مضاعفة الجائزة",freeCoins:"احصل على عملات",hintBtn:"💡 تلميح",skip:"⏭️ تخطي",addTube:"➕🧪 أنبوب إضافي",home:"الرئيسية",restart:"إعادة",undo:"تراجع",rank:"الرتبة",advertisement:"إعلان",noCoins:"لا توجد عملات كافية",noHint:"لا يوجد تلميح متاح",perfect:"🔥 مثالي! +20",speedBonus:"⚡ مكافأة السرعة! +15",freeCoinsToast:"+5 عملات 💰",doubleRewardToast:"+20 عملة 💰",copied:"تم نسخ الرابط!",premium:"النسخة الممتازة",support:"دعم المطور",rate:"تقييم التطبيق"},
    fa: {level:"مرحله",settings:"تنظیمات",sound:"صدا",vibrate:"لرزش",contact:"تماس با ما",share:"اشتراک‌گذاری برنامه",next:"بعدی",win:"عالی",reward:"+10 سکه",doubleReward:"💰 دوبرابر جایزه",freeCoins:"دریافت سکه",hintBtn:"💡 راهنما",skip:"⏭️ رد کردن",addTube:"➕🧪 لوله اضافه",home:"خانه",restart:"شروع مجدد",undo:"برگشت",rank:"رتبه",advertisement:"تبلیغات",noCoins:"سکه کافی نداری",noHint:"راهنمایی پیدا نشد",perfect:"🔥 بی‌نقص! +20",speedBonus:"⚡ جایزه سرعت! +15",freeCoinsToast:"+5 سکه 💰",doubleRewardToast:"+20 سکه 💰",copied:"لینک کپی شد!",premium:"نسخه ویژه",support:"حمایت از سازنده",rate:"امتیاز به برنامه"}
};

const RANKS = {
    en:[{min:1,label:"Beginner"},{min:21,label:"Skilled"},{min:101,label:"Pro"},{min:301,label:"Master"},{min:701,label:"Legend"}],
    ar:[{min:1,label:"مبتدئ"},{min:21,label:"ماهر"},{min:101,label:"محترف"},{min:301,label:"خبير"},{min:701,label:"أسطورة"}],
    fa:[{min:1,label:"مبتدی"},{min:21,label:"ماهر"},{min:101,label:"حرفه‌ای"},{min:301,label:"استاد"},{min:701,label:"افسانه‌ای"}]
};

function setText(id, text) { const el = document.getElementById(id); if (el) el.innerText = text; }
function getRank(lvl) {
    const list = RANKS[currentLang] || RANKS.en;
    let rank = list[0].label;
    list.forEach(item => { if (lvl >= item.min) rank = item.label; });
    return rank;
}
function updateStartRank() {
    setText('txt-start-level', getRank(level));
    setText('start-level', `${LANGS[currentLang].level} ${level}`);
    setText('top-rank', getRank(level));
}

function changeLang(lang) {
    currentLang = lang;
    localStorage.setItem('neon_lang', lang);
    const t = LANGS[lang];
    setText('txt-level', t.level); setText('txt-settings', t.settings); setText('txt-top-settings', t.settings);
    setText('txt-sound', t.sound); setText('txt-vibrate', t.vibrate); setText('txt-contact', '✉️ ' + t.contact);
    setText('txt-share', '📤 ' + t.share); setText('txt-win', t.win); setText('txt-next', t.next);
    setText('txt-reward', t.reward); setText('txt-double-reward', t.doubleReward); setText('txt-free-coins', t.freeCoins);
    setText('txt-skip-btn', t.skip); setText('txt-hint-btn', t.hintBtn); setText('txt-add-tube-btn', t.addTube);
    setText('txt-home', t.home); setText('txt-restart', t.restart); setText('txt-undo', t.undo);
    setText('txt-rank-label', t.rank); setText('txt-advertisement', t.advertisement);
    setText('txt-premium', t.premium); setText('txt-support', t.support); setText('txt-rate', t.rate);
    ['en','ar','fa'].forEach(l => document.getElementById('btn-' + l)?.classList.toggle('active', l === lang));
    updateStartRank();
    document.body.dir = (lang === 'fa' || lang === 'ar') ? 'rtl' : 'ltr';
}

function playSnd(f = 600, d = 0.1) {
    if (!soundEnabled) return;
    try {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const o = audioCtx.createOscillator(), g = audioCtx.createGain();
        o.connect(g); g.connect(audioCtx.destination); o.frequency.value = f;
        g.gain.setValueAtTime(0.1, audioCtx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + d);
        o.start(); o.stop(audioCtx.currentTime + d);
    } catch(e) {}
}

function showToast(msg, duration = 1800) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.innerText = msg; toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), duration);
}

document.addEventListener('DOMContentLoaded', init);
function init() {
    level = parseInt(localStorage.getItem('neon_lvl')) || 1;
    soundEnabled = localStorage.getItem('neon_snd') !== 'false';
    vibrateEnabled = localStorage.getItem('neon_vib') !== 'false';
    currentLang = localStorage.getItem('neon_lang') || 'en';
    changeLang(currentLang); updateCoinsUI();
    document.getElementById('sound-toggle')?.classList.toggle('active', soundEnabled);
    document.getElementById('vibrate-toggle')?.classList.toggle('active', vibrateEnabled);
    showMainMenu();
}
function showMainMenu() { updateStartRank(); document.getElementById('start-menu').style.display = 'flex'; }
function startGame() { document.getElementById('start-menu').style.display = 'none'; loadLevel(); }

function loadLevel() {
    setText('level-num', level); updateStartRank(); startTime = Date.now();
    document.getElementById('win-overlay').style.display = 'none'; closeCoinPopup();
    rewardUsed = false;
    const drBtn = document.getElementById('txt-double-reward');
    if (drBtn) { drBtn.style.opacity = ''; drBtn.style.pointerEvents = ''; }
    selected = null; history = []; hintFrom = null; hintTo = null;
    undoUsed = false; hintUsed = false; skipUsed = false; addTubeUsed = false; addTubeCount = 0;
    const config = getLevelConfig(level);
    tubes = generateLevel(config.colors, config.emptyTubes);
    initialTubes = JSON.stringify(tubes);
    render();
}

function render() {
    const board = document.getElementById('board');
    if (!board) return;
    board.innerHTML = '';
    board.classList.toggle('board-8', tubes.length >= 15);
    const ballStyles = {
        '#ffb3c6':'radial-gradient(circle at 30% 25%,#fff 0 12%,transparent 13%),linear-gradient(135deg,#ffe5ec,#ffb3c6,#ff758f)',
        '#00f2fe':'radial-gradient(circle at 30% 25%,#fff 0 12%,transparent 13%),linear-gradient(135deg,#7fffff,#00f2fe,#00838f)',
        '#fff000':'radial-gradient(circle at 30% 25%,#fff 0 12%,transparent 13%),linear-gradient(135deg,#ffff80,#fff000,#999000)',
        '#70e000':'radial-gradient(circle at 30% 25%,#fff 0 12%,transparent 13%),linear-gradient(135deg,#b7ff7a,#70e000,#228b22)',
        '#9b59b6':'radial-gradient(circle at 30% 25%,#fff 0 12%,transparent 13%),linear-gradient(135deg,#d0a8ff,#9b59b6,#5a189a)',
        '#ff8c00':'radial-gradient(circle at 30% 25%,#fff 0 12%,transparent 13%),linear-gradient(135deg,#ffc266,#ff8c00,#b35a00)',
        '#ffffff':'radial-gradient(circle at 30% 25%,#fff 0 12%,transparent 13%),linear-gradient(135deg,#ffffff,#e8e8e8,#bdbdbd)',
        '#4facfe':'radial-gradient(circle at 30% 25%,#fff 0 12%,transparent 13%),linear-gradient(135deg,#8fd3ff,#4facfe,#0047ab)',
        '#95a5a6':'radial-gradient(circle at 30% 25%,#fff 0 12%,transparent 13%),linear-gradient(135deg,#bdc3c7,#95a5a6,#7f8c8d)',
        '#3d2314':'radial-gradient(circle at 30% 25%,#fff 0 12%,transparent 13%),linear-gradient(135deg,#5c3a21,#3d2314,#1a0f08)',
        '#009688':'radial-gradient(circle at 30% 25%,#fff 0 12%,transparent 13%),linear-gradient(135deg,#5df2dd,#009688,#005b52)',
        '#e6004c':'radial-gradient(circle at 30% 25%,#fff 0 12%,transparent 13%),linear-gradient(135deg,#ff4d6d,#e6004c,#7a0028)'
    };
    tubes.forEach((t, i) => {
        const div = document.createElement('div');
        const classes = ['tube'];
        if (selected === i) classes.push('active');
        if (hintFrom === i) classes.push('hint-from');
        if (hintTo === i) classes.push('hint-to');
        if (t.length === 4 && t.every(b => b === t[0])) classes.push('complete');
        div.className = classes.join(' '); div.onclick = () => tap(i);
        t.forEach(color => {
            const b = document.createElement('div'); b.className = 'ball';
            b.style.background = ballStyles[color] || color;
            b.style.boxShadow = `inset -3px -3px 6px rgba(0,0,0,.45), inset 2px 2px 5px rgba(255,255,255,.30), 0 0 10px ${color}`;
            div.appendChild(b);
        });
        board.appendChild(div);
    });
    setText('undo-count', history.length); updateCoinsUI();
}

function tap(i) {
    if (selected === null) {
        if (tubes[i].length > 0 && !isTubeComplete(tubes[i])) { selected = i; playSnd(400, 0.05); }
    } else {
        if (selected !== i) moveLogic(selected, i);
        selected = null;
    }
    render();
}
function isTubeComplete(tube) { return tube.length === 4 && tube.every(b => b === tube[0]); }
function moveLogic(from, to) {
    const f = tubes[from], t = tubes[to];
    if (f.length === 0) return false;
    const color = f[f.length - 1];
    if (t.length < 4 && (t.length === 0 || t[t.length - 1] === color)) {
        history.push(JSON.stringify(tubes));
        while (f.length > 0 && f[f.length - 1] === color && t.length < 4) t.push(f.pop());
        hintFrom = null; hintTo = null; playSnd(600, 0.1);
        if (vibrateEnabled && navigator.vibrate) navigator.vibrate(30);
        if (isSolved(tubes)) handleWin();
        return true;
    }
    return false;
}

function launchConfetti() {
    const canvas = document.createElement('canvas');
    canvas.id = 'confetti-canvas';
    canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:20000';
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    const colors = ['#ff0055','#00f2fe','#fadb14','#70e000','#9b59b6','#ff8c00','#4facfe','#ff6b6b','#00d4aa'];
    const particles = [];
    for (let i = 0; i < 120; i++) particles.push({x:Math.random()*canvas.width,y:-20,r:Math.random()*8+4,color:colors[Math.floor(Math.random()*colors.length)],vx:(Math.random()-.5)*6,vy:Math.random()*4+2,alpha:1});
    let frame = 0;
    function draw() {
        ctx.clearRect(0,0,canvas.width,canvas.height);
        particles.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += .1; p.alpha -= .012; ctx.globalAlpha = Math.max(0,p.alpha); ctx.fillStyle=p.color; ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill(); });
        frame++;
        if (frame < 120) requestAnimationFrame(draw); else canvas.remove();
    }
    draw();
}

function handleWin() {
    render(); coins += COSTS.win;
    if (!undoUsed && !hintUsed && !skipUsed && !addTubeUsed) { coins += 20; setTimeout(() => showToast(LANGS[currentLang].perfect), 350); }
    const time = (Date.now() - startTime) / 1000;
    if (time < 20) { coins += 15; setTimeout(() => showToast(LANGS[currentLang].speedBonus), 900); }
    saveCoins(); updateCoinsUI();
    setTimeout(() => {
        const winOverlay = document.getElementById('win-overlay');
        if (winOverlay) { winOverlay.style.display = 'flex'; winOverlay.style.zIndex = '10000'; }
        playWinSound(); launchConfetti();
        if (vibrateEnabled && navigator.vibrate) navigator.vibrate([100,50,100,50,200]);
    }, 400);
}

function nextLevel(e) {
    if (e) e.stopPropagation();
    level++; localStorage.setItem('neon_lvl', level);
    const winOverlay = document.getElementById('win-overlay'); if (winOverlay) winOverlay.style.display = 'none';
    const confetti = document.getElementById('confetti-canvas'); if (confetti) confetti.remove();
    updateStartRank(); loadLevel();
}
function reset() {
    if (!initialTubes) { loadLevel(); return; }
    tubes = JSON.parse(initialTubes); selected = null; history = []; hintFrom = null; hintTo = null;
    undoUsed = false; hintUsed = false; skipUsed = false; addTubeUsed = false; addTubeCount = 0;
    startTime = Date.now(); closeCoinPopup(); render();
}
function undo() {
    if (history.length === 0) return;
    if (!spendCoins(COSTS.undo)) return;
    tubes = JSON.parse(history.pop()); hintFrom = null; hintTo = null; undoUsed = true; render();
}
function addTube() {
    const maxTubes = level > 300 ? 16 : 14;
    if (tubes.length >= maxTubes) return;
    const cost = COSTS.addTube * (addTubeCount + 1);
    if (!spendCoins(cost)) return;
    addTubeUsed = true; addTubeCount++; tubes.push([]); render();
}
function skipLevel() { if (!spendCoins(COSTS.skip)) return; skipUsed = true; nextLevel(); }
function toggleSettings(show) { document.getElementById('settings-panel').style.display = show ? 'flex' : 'none'; }
function toggleOption(type) {
    if (type === 'sound') { soundEnabled = !soundEnabled; localStorage.setItem('neon_snd', soundEnabled); document.getElementById('sound-toggle')?.classList.toggle('active', soundEnabled); if (soundEnabled) playSnd(700,.1); }
    if (type === 'vibrate') { vibrateEnabled = !vibrateEnabled; localStorage.setItem('neon_vib', vibrateEnabled); document.getElementById('vibrate-toggle')?.classList.toggle('active', vibrateEnabled); if (vibrateEnabled && navigator.vibrate) navigator.vibrate(50); }
}
function spendCoins(amount) {
    if (coins < amount) { showCoinPopup(); return false; }
    coins -= amount; saveCoins(); updateCoinsUI(); return true;
}
function findHintMove() {
    for (let from = 0; from < tubes.length; from++) {
        const f = tubes[from]; if (f.length === 0 || isTubeComplete(f)) continue;
        const color = f[f.length - 1];
        for (let to = 0; to < tubes.length; to++) {
            if (from === to) continue;
            const t = tubes[to];
            if (t.length < 4 && (t.length === 0 || t[t.length - 1] === color)) return {from,to};
        }
    }
    return null;
}
function useHint() {
    const hint = findHintMove();
    if (!hint) { showToast(LANGS[currentLang].noHint); return; }
    if (!spendCoins(COSTS.hint)) return;
    hintUsed = true; hintFrom = hint.from; hintTo = hint.to; render();
    setTimeout(() => { hintFrom = null; hintTo = null; render(); }, 1400);
}
function watchCoinsReward() {
    const btn = document.getElementById('txt-free-coins');
    if (btn && (btn.style.opacity === '0.5' || btn.style.pointerEvents === 'none')) return;
    coins += COSTS.freeCoins; saveCoins(); updateCoinsUI();
    if (btn) { btn.style.opacity = '0.5'; btn.style.pointerEvents = 'none'; setTimeout(() => { btn.style.opacity = '1'; btn.style.pointerEvents = 'auto'; }, 60000); }
    showToast(LANGS[currentLang].freeCoinsToast); closeCoinPopup();
}
function watchAdReward() {
    if (rewardUsed) return;
    rewardUsed = true; coins += COSTS.win * 2; saveCoins(); updateCoinsUI();
    const btn = document.getElementById('txt-double-reward');
    if (btn) { btn.style.opacity = '0.5'; btn.style.pointerEvents = 'none'; }
    showToast(LANGS[currentLang].doubleRewardToast); setTimeout(() => nextLevel(), 700);
}
function showCoinPopup() { const text = document.getElementById('popup-text'); if (text) text.innerText = LANGS[currentLang].noCoins; document.getElementById('coin-popup').style.display = 'flex'; }
function closeCoinPopup() { document.getElementById('coin-popup').style.display = 'none'; }

async function shareGame() {
    const text = {en:"Try this puzzle!",ar:"جرب اللعبة!",fa:"این بازی رو امتحان کن!"};
    try {
        if (navigator.share) await navigator.share({title:"Neon Ball Sort",text:text[currentLang],url:PLAY_STORE_URL});
        else { await navigator.clipboard.writeText(PLAY_STORE_URL); showToast(LANGS[currentLang].copied); }
    } catch(e) {}
}

const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.aliapps1.neonballsort";
function openPremiumMenu() { document.getElementById("premium-popup").classList.add("active"); }
function closePremiumMenu() { document.getElementById("premium-popup").classList.remove("active"); }
function selectPremiumPlan(plan) {
    closePremiumMenu();
    showToast(currentLang === "fa" ? "به‌زودی در Google Play فعال می‌شود." : currentLang === "ar" ? "سيتوفر قريباً على Google Play." : "Coming soon on Google Play.");
}
function openSupportMenu() { document.getElementById("support-popup").classList.add("active"); }
function closeSupportMenu() { document.getElementById("support-popup").classList.remove("active"); }
function selectSupportProduct(productId) {
    closeSupportMenu(); console.log("Support:", productId);
    showToast(currentLang === "fa" ? "پرداخت در نسخه Google Play فعال خواهد شد." : currentLang === "ar" ? "سيتم تفعيل الدفع في نسخة Google Play." : "Payment will be available on Google Play.");
}
function rateGame() { window.open(PLAY_STORE_URL, "_blank"); }
function openPrivacyPolicy() { window.location.href = 'privacy-policy.html'; }
