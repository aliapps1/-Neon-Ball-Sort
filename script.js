let level = 1, tubes = [], selected = null, history = [], audioCtx = null;
let soundEnabled = true, vibrateEnabled = true, currentLang = 'en';
let coins = parseInt(localStorage.getItem("neon_coins")) || 100;

function saveCoins(){ localStorage.setItem("neon_coins", coins); }
function updateCoinsUI(){ let el=document.getElementById("coins"); if(el) el.innerText=coins; }

const COLORS = ['#ff0055','#00f2fe','#4facfe','#fadb14','#70e000','#9b59b6','#ff8c00','#ffffff'];

const LANGS = {
    en:{level:"Level",settings:"Settings",sound:"Sound",vibrate:"Vibrate",contact:"Contact",share:"Share",next:"NEXT",win:"FANTASTIC",resetQ:"Restart?"},
    ar:{level:"مستوى",settings:"الإعدادات",sound:"الصوت",vibrate:"اهتزاز",contact:"تواصل",share:"مشاركة",next:"التالي",win:"رائع",resetQ:"إعادة؟"},
    fa:{level:"مرحله",settings:"تنظیمات",sound:"صدا",vibrate:"لرزش",contact:"تماس",share:"اشتراک",next:"بعدی",win:"عالی",resetQ:"شروع مجدد؟"}
};

function setText(id,text){ let el=document.getElementById(id); if(el) el.innerText=text; }

function changeLang(lang){
    currentLang=lang;
    localStorage.setItem('neon_lang',lang);
    let t=LANGS[lang];

    setText('txt-level',t.level);
    setText('txt-start-level',t.level);
    setText('txt-settings',t.settings);
    setText('txt-sound',t.sound);
    setText('txt-vibrate',t.vibrate);
    setText('txt-contact',t.contact);
    setText('txt-share',t.share);
    setText('txt-win',t.win);
    setText('txt-next',t.next);

    document.body.dir=(lang==='fa'||lang==='ar')?'rtl':'ltr';
}

function playSnd(f,d){
    if(!soundEnabled) return;
    try{
        if(!audioCtx) audioCtx=new (window.AudioContext||window.webkitAudioContext)();
        if(audioCtx.state==='suspended') audioCtx.resume();

        let o=audioCtx.createOscillator();
        let g=audioCtx.createGain();
        o.connect(g); g.connect(audioCtx.destination);

        o.frequency.value=f;
        g.gain.setValueAtTime(0.15,audioCtx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.01,audioCtx.currentTime+d);

        o.start(); o.stop(audioCtx.currentTime+d);
    }catch(e){}
}

function init(){
    level=parseInt(localStorage.getItem('neon_lvl'))||1;
    soundEnabled=localStorage.getItem('neon_snd')!=='false';
    vibrateEnabled=localStorage.getItem('neon_vib')!=='false';

    currentLang=localStorage.getItem('neon_lang')||'en';
    changeLang(currentLang);

    updateCoinsUI();
    showMainMenu();
}

function showMainMenu(){
    document.getElementById('start-menu').style.display='flex';
    setText('start-level',level);
}

function startGame(){
    document.getElementById('start-menu').style.display='none';
    loadLevel();
}

function loadLevel(){
    setText('level-num',level);
    document.getElementById('win-overlay').style.display='none';

    selected=null; history=[];

    let colorCount=Math.min(3+Math.floor(level/4),8);
    let balls=[];

    for(let i=0;i<colorCount;i++)
        for(let j=0;j<4;j++)
            balls.push(COLORS[i]);

    for(let i=balls.length-1;i>0;i--){
        let j=Math.floor(Math.random()*(i+1));
        [balls[i],balls[j]]=[balls[j],balls[i]];
    }

    tubes=[];
    for(let i=0;i<colorCount;i++) tubes.push(balls.splice(0,4));
    tubes.push([]); tubes.push([]);

    render();
}

function render(){
    let board=document.getElementById('board');
    board.innerHTML='';

    tubes.forEach((t,i)=>{
        let d=document.createElement('div');
        d.className='tube';
        d.onclick=()=>tap(i);

        t.forEach(c=>{
            let b=document.createElement('div');
            b.className='ball';
            b.style.background=c;
            d.appendChild(b);
        });

        board.appendChild(d);
    });

    document.getElementById('undo-count').innerText=history.length;
    updateCoinsUI();
}

function tap(i){
    if(selected===null){
        if(tubes[i].length>0) selected=i;
    }else{
        if(selected!==i) moveLogic(selected,i);
        selected=null;
    }
    render();
}

function moveLogic(f,t){
    let a=tubes[f], b=tubes[t];
    if(a.length===0) return;

    let color=a[a.length-1];
    if(b.length<4 && (b.length===0||b[b.length-1]===color)){
        history.push(JSON.stringify(tubes));
        while(a.length && a[a.length-1]===color && b.length<4) b.push(a.pop());

        playSnd(600,0.1);

        if(checkWin()){
            coins+=10; saveCoins();
            setTimeout(()=>document.getElementById('win-overlay').style.display='flex',300);
        }
    }
}

function checkWin(){
    return tubes.filter(t=>t.length>0)
        .every(t=>t.length===4 && t.every(b=>b===t[0]));
}

function nextLevel(){ level++; localStorage.setItem('neon_lvl',level); loadLevel(); }
function reset(){ if(confirm(LANGS[currentLang].resetQ)) loadLevel(); }

function undo(){
    if(coins<20) return alert("No coins");
    coins-=20; saveCoins();
    if(history.length>0) tubes=JSON.parse(history.pop());
    render();
}

function addTube(){
    if(coins<50) return alert("No coins");
    coins-=50; saveCoins();
    if(tubes.length<12) tubes.push([]);
    render();
}

function skipLevel(){
    if(coins<100) return alert("No coins");
    coins-=100; saveCoins();
    nextLevel();
}

function toggleSettings(show){
    document.getElementById('settings-panel').style.display=show?'flex':'none';
}

function toggleOption(type){
    if(type==='sound'){
        soundEnabled=!soundEnabled;
        localStorage.setItem('neon_snd',soundEnabled);
        if(soundEnabled) playSnd(700,0.1);
    }
    if(type==='vibrate'){
        vibrateEnabled=!vibrateEnabled;
        localStorage.setItem('neon_vib',vibrateEnabled);
        if(vibrateEnabled && navigator.vibrate) navigator.vibrate(50);
    }
}

async function shareGame(){
    try{
        if(navigator.share){
            await navigator.share({
                title:"Neon Sort",
                text:"Play this game",
                url:location.href
            });
        }
    }catch(e){}
}

function watchAdReward(){
    setTimeout(()=>{
        coins+=30;
        saveCoins();
        updateCoinsUI();
    },1500);
}
