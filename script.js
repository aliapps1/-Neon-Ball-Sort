let startTime = 0;
let level = 1, tubes = [], selected = null, history = [], audioCtx = null;
let soundEnabled = true, vibrateEnabled = true, currentLang = 'en';
let coins = parseInt(localStorage.getItem("neon_coins")) || 100;
let rewardUsed = false;
let hintFrom = null;
let hintTo = null;

const COSTS = {
    undo: 5,
    hint: 8,
    addTube: 15,
    skip: 25,
    freeCoins: 5,
    win: 10,
    doubleReward: 10
};

function saveCoins(){ localStorage.setItem("neon_coins", coins); }
function updateCoinsUI(){ let el=document.getElementById("coins"); if(el) el.innerText=coins; }

const COLORS = ['#ff0055','#00f2fe','#4facfe','#fadb14','#70e000','#9b59b6','#ff8c00','#ffffff'];

function getLevelConfig(level) {
    if (level < 20) {
        return { colors: 3, moves: 15 };
    } else if (level < 50) {
        return { colors: 4, moves: 25 };
    } else if (level < 100) {
        return { colors: 5, moves: 35 };
    } else if (level < 200) {
        return { colors: 6, moves: 45 };
    } else {
        return { colors: 7, moves: 60 };
    }
}

function generateLevel(colors, emptyTubes = 2, moves = 30) {
    let tubes = [];

    for (let i = 0; i < colors; i++) {
        tubes.push([COLORS[i], COLORS[i], COLORS[i], COLORS[i]]);
    }

    for (let i = 0; i < emptyTubes; i++) {
        tubes.push([]);
    }

    for (let m = 0; m < moves; m++) {
        let from = Math.floor(Math.random() * tubes.length);
        let to = Math.floor(Math.random() * tubes.length);

        if (from === to) continue;
        if (tubes[from].length === 0) continue;
        if (tubes[to].length >= 4) continue;

        let ball = tubes[from].pop();
        tubes[to].push(ball);
    }

    return tubes;
}
const LANGS = {
    en:{
        level:"Level",
        settings:"Settings",
        sound:"Sound",
        vibrate:"Vibrate",
        contact:"Contact",
        share:"Share",
        next:"NEXT",
        win:"FANTASTIC",
        reward:"+10 Coins",
        doubleReward:"🎥 Double Reward",
        freeCoins:"🎥 Get Coins",
        hintBtn:"💡 Hint (8)",
        noCoins:"Not enough coins",
        noHint:"No hint available",
        resetQ:"Restart?"
    },
    ar:{
        level:"مستوى",
        settings:"الإعدادات",
        sound:"الصوت",
        vibrate:"اهتزاز",
        contact:"اتصل بنا",
        share:"مشاركة",
        next:"التالي",
        win:"رائع",
        reward:"+10 عملات",
        doubleReward:"🎥 مضاعفة الجائزة",
        freeCoins:"🎥 احصل على عملات",
        hintBtn:"💡 تلميح (8)",
        noCoins:"لا توجد عملات كافية",
        noHint:"لا يوجد تلميح متاح",
        resetQ:"إعادة؟"
    },
    fa:{
        level:"مرحله",
        settings:"تنظیمات",
        sound:"صدا",
        vibrate:"لرزش",
        contact:"تماس با ما",
        share:"اشتراک‌گذاری",
        next:"بعدی",
        win:"عالی",
        reward:"+10 سکه",
        doubleReward:"🎥 دوبرابر کردن جایزه",
        freeCoins:"🎥 دریافت سکه",
        hintBtn:"💡 راهنما (8)",
        noCoins:"سکه کافی نداری",
        noHint:"راهنمایی پیدا نشد",
        resetQ:"شروع مجدد؟"
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

function setText(id,text){
    let el=document.getElementById(id);
    if(el) el.innerText=text;
}

function getRank(lvl){
    const rankList = RANKS[currentLang] || RANKS.en;
    let current = rankList[0].label;

    for(let i=0;i<rankList.length;i++){
        if(lvl >= rankList[i].min){
            current = rankList[i].label;
        }
    }

    return current;
}

function updateStartRank(){
    setText('txt-start-level', getRank(level));
    setText('start-level', `${LANGS[currentLang].level} ${level}`);
}

function changeLang(lang){
    currentLang=lang;
    localStorage.setItem('neon_lang',lang);
    let t=LANGS[lang];

    setText('txt-level',t.level);
    setText('txt-settings',t.settings);
    setText('txt-sound',t.sound);
    setText('txt-vibrate',t.vibrate);
    setText('txt-contact',t.contact);
    setText('txt-share',t.share);
    setText('txt-win',t.win);
    setText('txt-next',t.next);
    setText('txt-reward',t.reward);
    setText('txt-double-reward',t.doubleReward);
    setText('txt-free-coins',t.freeCoins);
    setText('txt-hint-btn',t.hintBtn);

    updateStartRank();

    document.body.dir=(lang==='fa'||lang==='ar')?'rtl':'ltr';
}

function playSnd(f=600,d=0.1){
    if(!soundEnabled) return;

    try{
        if(!audioCtx){
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }

        if(audioCtx.state === 'suspended'){
            audioCtx.resume();
        }

        let o = audioCtx.createOscillator();
        let g = audioCtx.createGain();

        o.connect(g);
        g.connect(audioCtx.destination);

        o.frequency.value = f;
        g.gain.setValueAtTime(0.1, audioCtx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + d);

        o.start();
        o.stop(audioCtx.currentTime + d);
    }catch(e){}
}

function init(){
    level=parseInt(localStorage.getItem('neon_lvl'))||1;
    soundEnabled=localStorage.getItem('neon_snd')!=='false';
    vibrateEnabled=localStorage.getItem('neon_vib')!=='false';
    currentLang=localStorage.getItem('neon_lang')||'en';

    changeLang(currentLang);
    updateCoinsUI();

    let s=document.getElementById('sound-toggle');
    if(s) s.classList.toggle('active',soundEnabled);

    let v=document.getElementById('vibrate-toggle');
    if(v) v.classList.toggle('active',vibrateEnabled);

    showMainMenu();
}

function showMainMenu(){
    updateStartRank();
    document.getElementById('start-menu').style.display='flex';
}

function startGame(){
    document.getElementById('start-menu').style.display='none';
    loadLevel();
}

function loadLevel(){
    setText('level-num',level);
    startTime = Date.now();

    let winOverlay = document.getElementById('win-overlay');
    if(winOverlay) winOverlay.style.display='none';

    selected=null;
    history=[];
    hintFrom=null;
    hintTo=null;
    rewardUsed=false;

    let colorCount=Math.min(3+Math.floor(level/4),8);

    let config = getLevelConfig(level);
tubes = generateLevel(config.colors, 2, config.moves);

    render();
}

function render(){
    let board=document.getElementById('board');
    board.innerHTML='';

    tubes.forEach((t,i)=>{
        let div=document.createElement('div');
        let classes = ['tube'];
        if(selected===i) classes.push('active');
        if(hintFrom===i || hintTo===i) classes.push('hint');
        div.className=classes.join(' ');
        div.onclick=()=>tap(i);

        t.forEach(color=>{
            let b=document.createElement('div');
            b.className='ball';
            b.style.backgroundColor=color;
            div.appendChild(b);
        });

        board.appendChild(div);
    });

    let undoEl=document.getElementById('undo-count');
    if(undoEl) undoEl.innerText=history.length;

    updateCoinsUI();
}

function tap(i){
    if(selected===null){
        if(tubes[i].length>0){
            selected=i;
            playSnd(400,0.05);
        }
    }else{
        if(selected!==i){
            moveLogic(selected,i);
        }
        selected=null;
    }
    render();
}

function moveLogic(from,to){
    let f=tubes[from];
    let t=tubes[to];

    if(f.length===0) return false;

    let color=f[f.length-1];

    if(t.length<4 && (t.length===0 || t[t.length-1]===color)){

        history.push(JSON.stringify(tubes));

        while(f.length>0 && f[f.length-1]===color && t.length<4){
            t.push(f.pop());
        }

        hintFrom=null;
        hintTo=null;

        playSnd(600,0.1);

        if(vibrateEnabled && navigator.vibrate){
            navigator.vibrate(30);
        }

        if(checkWin()){

    // پاداش پایه
    coins += COSTS.win;

    // PERFECT (بدون Undo)
    let perfect = history.length === 0;
    if(perfect){
        coins += 20;
        alert("🔥 PERFECT! +20");
    }

    // Speed Bonus
    let time = (Date.now() - startTime) / 1000;
    if(time < 20){
        coins += 15;
    }

    saveCoins();
    updateCoinsUI();

    setTimeout(()=>{
        document.getElementById('win-overlay').style.display='flex';
        playSnd(800,0.3);
    },300);
        }
    

        return true;
    }

    return false;
}

function checkWin(){
    return tubes.every(t => {
        return t.length === 0 || (t.length === 4 && t.every(b => b === t[0]));
    });
}

function nextLevel(){
    level++;
    localStorage.setItem('neon_lvl',level);
    updateStartRank();
    loadLevel();
}

function reset(){
    if(confirm(LANGS[currentLang].resetQ)) loadLevel();
}

function undo(){
    if(history.length===0) return;
    if(!spendCoins(COSTS.undo)) return;

    tubes=JSON.parse(history.pop());
    hintFrom=null;
    hintTo=null;
    render();
}

function addTube(){
    if(tubes.length>=12) return;
    if(!spendCoins(COSTS.addTube)) return;

    tubes.push([]);
    render();
}

function skipLevel(){
    if(!spendCoins(COSTS.skip)) return;
    nextLevel();
}

function toggleSettings(show){
    document.getElementById('settings-panel').style.display=show?'flex':'none';
}

function toggleOption(type){

    if(type==='sound'){
        soundEnabled=!soundEnabled;
        localStorage.setItem('neon_snd',soundEnabled);

        let el=document.getElementById('sound-toggle');
        if(el) el.classList.toggle('active',soundEnabled);

        if(soundEnabled) playSnd(700,0.1);
    }

    if(type==='vibrate'){
        vibrateEnabled=!vibrateEnabled;
        localStorage.setItem('neon_vib',vibrateEnabled);

        let el=document.getElementById('vibrate-toggle');
        if(el) el.classList.toggle('active',vibrateEnabled);

        if(vibrateEnabled && navigator.vibrate){
            navigator.vibrate(50);
        }
    }
}

function spendCoins(amount){
    if(coins < amount){
        alert(LANGS[currentLang].noCoins);
        return false;
    }
    coins -= amount;
    saveCoins();
    updateCoinsUI();
    return true;
}

function findHintMove(){
    for(let from=0; from<tubes.length; from++){
        let f=tubes[from];
        if(f.length===0) continue;

        let color=f[f.length-1];

        for(let to=0; to<tubes.length; to++){
            if(from===to) continue;

            let t=tubes[to];
            if(t.length<4 && (t.length===0 || t[t.length-1]===color)){
                return { from, to };
            }
        }
    }
    return null;
}

function useHint(){
    if(!spendCoins(COSTS.hint)) return;

    const hint = findHintMove();
    if(!hint){
        alert(LANGS[currentLang].noHint);
        return;
    }

    moveLogic(hint.from, hint.to);
render();

    setTimeout(()=>{
        hintFrom = null;
        hintTo = null;
        render();
    }, 1200);
}

function watchCoinsReward(){
    coins += COSTS.freeCoins;
    saveCoins();
    updateCoinsUI();
}

function watchAdReward(){
    if(rewardUsed) return;
    rewardUsed = true;

    coins += COSTS.win * 2;
    saveCoins();
    updateCoinsUI();

    let btn = document.getElementById('txt-double-reward');
    if(btn){
        btn.style.opacity = '0.6';
        btn.style.pointerEvents = 'none';
    }

    nextLevel();

    setTimeout(()=>{
        if(btn){
            btn.style.opacity = '1';
            btn.style.pointerEvents = 'auto';
        }
    }, 50);
}

async function shareGame(){
    const text={
        en:"Try this puzzle!",
        ar:"جرب اللعبة!",
        fa:"این بازی رو امتحان کن!"
    };

    try{
        if(navigator.share){
            await navigator.share({
                title:"Neon Ball Sort",
                text:text[currentLang],
                url:window.location.href
            });
        }else{
            await navigator.clipboard.writeText(window.location.href);
            alert("Link copied");
        }
    }catch(e){}
}
