// ================== STATE ==================
let level = 1, tubes = [], selected = null, history = [], audioCtx = null;
let soundEnabled = true, vibrateEnabled = true, currentLang = 'en';

// ================== COINS ==================
let coins = parseInt(localStorage.getItem("neon_coins")) || 100;

function saveCoins() {
    localStorage.setItem("neon_coins", coins);
}

function updateCoinsUI() {
    const el = document.getElementById("coins");
    if (el) el.innerText = coins;
}

// ================== COLORS ==================
const COLORS = ['#ff0055','#00f2fe','#4facfe','#fadb14','#70e000','#9b59b6','#ff8c00','#ffffff'];

// ================== LANG ==================
const LANGS = {
    en: {
        level:"Level", settings:"Settings", sound:"Sound", vibrate:"Vibrate",
        contact:"Contact", share:"Share", next:"NEXT LEVEL",
        win:"FANTASTIC!", resetQ:"Restart level?"
    },
    ar: {
        level:"مستوى", settings:"الإعدادات", sound:"الصوت", vibrate:"اهتزاز",
        contact:"تواصل", share:"مشاركة", next:"التالي",
        win:"رائع!", resetQ:"إعادة؟"
    },
    fa: {
        level:"مرحله", settings:"تنظیمات", sound:"صدا", vibrate:"لرزش",
        contact:"تماس", share:"اشتراک", next:"مرحله بعد",
        win:"عالی!", resetQ:"شروع مجدد؟"
    }
};

// جلوگیری از ارور
function setText(id, text) {
    let el = document.getElementById(id);
    if (el) el.innerText = text;
}

// تغییر زبان
function changeLang(lang) {
    currentLang = lang;
    localStorage.setItem('neon_lang', lang);

    const t = LANGS[lang];

    setText('txt-level', t.level);
    setText('txt-start-level', t.level);
    setText('txt-settings', t.settings);
    setText('txt-sound', t.sound);
    setText('txt-vibrate', t.vibrate);
    setText('txt-contact', t.contact);
    setText('txt-share', t.share);
    setText('txt-win', t.win);
    setText('txt-next', t.next);

    document.body.className = (lang === 'fa' || lang === 'ar') ? 'rtl' : '';

    document.querySelectorAll('.lang-switch button').forEach(b => b.classList.remove('active'));
    let btn = document.getElementById('btn-' + lang);
    if (btn) btn.classList.add('active');
}

// ================== SOUND ==================
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
    } catch(e){}
}

// ================== INIT ==================
function init() {
    level = parseInt(localStorage.getItem('neon_lvl')) || 1;
    soundEnabled = localStorage.getItem('neon_snd') !== 'false';
    vibrateEnabled = localStorage.getItem('neon_vib') !== 'false';

    currentLang = localStorage.getItem('neon_lang') || 'en';
    changeLang(currentLang);

    updateCoinsUI();
    showMainMenu();
}

// ================== MENU ==================
function showMainMenu() {
    document.getElementById('start-menu').style.display = 'flex';
    setText('start-level', level);
}

function startGame() {
    document.getElementById('start-menu').style.display = 'none';
    loadLevel();
}

// ================== LEVEL ==================
function loadLevel() {
    setText('level-num', level);

    let win = document.getElementById('win-overlay');
    if(win) win.style.display = 'none';

    selected = null;
    history = [];

    let colorCount = Math.min(3 + Math.floor(level / 4), 8);

    let balls = [];
    for (let i=0;i<colorCount;i++) {
        for (let j=0;j<4;j++) balls.push(COLORS[i]);
    }

    // shuffle استاندارد
    for (let i = balls.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        [balls[i], balls[j]] = [balls[j], balls[i]];
    }

    tubes = [];
    for (let i=0;i<colorCount;i++) {
        tubes.push(balls.splice(0,4));
    }

    tubes.push([]);
    tubes.push([]);

    render();
}

// ================== RENDER ==================
function render() {
    const board = document.getElementById('board');
    if (!board) return;

    board.innerHTML = '';

    tubes.forEach((t,i)=>{
        const div = document.createElement('div');
        div.className = `tube ${selected===i?'active':''}`;
        div.onclick = ()=>tap(i);

        t.forEach(color=>{
            const b = document.createElement('div');
            b.className = 'ball';
            b.style.backgroundColor = color;
            div.appendChild(b);
        });

        board.appendChild(div);
    });

    let undoEl = document.getElementById('undo-count');
    if (undoEl) undoEl.innerText = history.length;

    updateCoinsUI();
}

// ================== GAME ==================
function tap(i) {
    if(selected===null){
        if(tubes[i].length>0){
            selected=i;
            playSnd(400,0.05);
        }
    } else {
        if(selected!==i) moveLogic(selected,i);
        selected=null;
    }
    render();
}

function moveLogic(from,to){
    let f=tubes[from], t=tubes[to];
    if(f.length===0) return;

    let color=f[f.length-1];

    if(t.length<4 && (t.length===0 || t[t.length-1]===color)){
        history.push(JSON.stringify(tubes));

        while(f.length>0 && f[f.length-1]===color && t.length<4){
            t.push(f.pop());
        }

        playSnd(600,0.1);

        if(checkWin()){
            setTimeout(()=>{
                coins+=10;
                saveCoins();
                updateCoinsUI();

                let win=document.getElementById('win-overlay');
                if(win) win.style.display='flex';

                playSnd(800,0.3);
            },300);
        }
    }
}

function checkWin(){
    return tubes.filter(t=>t.length>0)
        .every(t=>t.length===4 && t.every(b=>b===t[0]));
}

// ================== ACTIONS ==================
function nextLevel(){
    level++;
    localStorage.setItem('neon_lvl',level);
    loadLevel();
}

function reset(){
    if(confirm(LANGS[currentLang].resetQ)) loadLevel();
}

function undo(){
    if(coins<20) return alert("No coins");
    coins-=20;
    saveCoins();

    if(history.length>0){
        tubes=JSON.parse(history.pop());
    }

    render();
}

function addTube(){
    if(coins<50) return alert("No coins");
    coins-=50;
    saveCoins();

    if(tubes.length<12) tubes.push([]);
    render();
}

function skipLevel(){
    if(coins<100) return alert("No coins");
    coins-=100;
    saveCoins();
    nextLevel();
}

// ================== SETTINGS ==================
function toggleSettings(show){
    let p=document.getElementById('settings-panel');
    if(p) p.style.display=show?'flex':'none';
}

function toggleOption(type){
    if(type==='sound'){
        soundEnabled=!soundEnabled;
        localStorage.setItem('neon_snd',soundEnabled);

        let el=document.getElementById('sound-toggle');
        if(el) el.classList.toggle('active');

    } else if(type==='vibrate'){
        vibrateEnabled=!vibrateEnabled;
        localStorage.setItem('neon_vib',vibrateEnabled);

        let el=document.getElementById('vibrate-toggle');
        if(el) el.classList.toggle('active');

        if(vibrateEnabled && navigator.vibrate) navigator.vibrate(50);
    }
}

// ================== SHARE ==================
async function shareGame(){
    const text={
        en:"Try this puzzle!",
        ar:"جرب اللعبة!",
        fa:"این بازی رو امتحان کن!"
    };

    try{
        if(navigator.share){
            await navigator.share({
                title:"Neon Sort",
                text:text[currentLang],
                url:window.location.href
            });
        }
    }catch(e){}
}

// ================== FAKE AD ==================
function watchAdReward(){
    alert("Ad...");
    setTimeout(()=>{
        coins+=30;
        saveCoins();
        updateCoinsUI();
        alert("+30 coins");
    },1500);
}
