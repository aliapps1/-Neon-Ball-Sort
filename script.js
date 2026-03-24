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

function setText(id,text){
    let el=document.getElementById(id);
    if(el) el.innerText=text;
}

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

function init(){
    changeLang(localStorage.getItem('neon_lang')||'en');
    updateCoinsUI();

    // 🔥 sync دکمه‌ها
    document.getElementById('sound-toggle')?.classList.toggle('active',soundEnabled);
    document.getElementById('vibrate-toggle')?.classList.toggle('active',vibrateEnabled);

    showMainMenu();
}

/* 🔥 اصلاح اصلی */
function showMainMenu(){
    document.getElementById('settings-panel').style.display='none';
    document.getElementById('win-overlay').style.display='none';
    document.getElementById('start-menu').style.display='flex';
}

function startGame(){
    document.getElementById('start-menu').style.display='none';
    loadLevel();
}

/* بقیه کدت دست نخورده */
function loadLevel(){
    let colorCount=Math.min(3+Math.floor(level/4),8);
    let balls=[];

    for(let i=0;i<colorCount;i++){
        for(let j=0;j<4;j++) balls.push(COLORS[i]);
    }

    for(let i=balls.length-1;i>0;i--){
        let j=Math.floor(Math.random()*(i+1));
        [balls[i],balls[j]]=[balls[j],balls[i]];
    }

    tubes=[];
    for(let i=0;i<colorCount;i++){
        tubes.push(balls.splice(0,4));
    }

    tubes.push([]);
    tubes.push([]);

    render();
}

function render(){
    let board=document.getElementById('board');
    board.innerHTML='';

    tubes.forEach((t,i)=>{
        let div=document.createElement('div');
        div.className='tube '+(selected===i?'active':'');
        div.onclick=()=>tap(i);

        t.forEach(color=>{
            let b=document.createElement('div');
            b.className='ball';
            b.style.backgroundColor=color;
            div.appendChild(b);
        });

        board.appendChild(div);
    });
}

function tap(i){
    if(selected===null){
        if(tubes[i].length>0) selected=i;
    }else{
        moveLogic(selected,i);
        selected=null;
    }
    render();
}

function moveLogic(from,to){
    let f=tubes[from], t=tubes[to];
    if(f.length===0) return;

    let color=f[f.length-1];

    if(t.length<4 && (t.length===0 || t[t.length-1]===color)){
        while(f.length>0 && f[f.length-1]===color && t.length<4){
            t.push(f.pop());
        }

        if(checkWin()){
            coins+=10;
            saveCoins();
            updateCoinsUI();
            document.getElementById('win-overlay').style.display='flex';
        }
    }
}

function checkWin(){
    return tubes.filter(t=>t.length>0)
        .every(t=>t.length===4 && t.every(b=>b===t[0]));
}

function nextLevel(){
    level++;
    loadLevel();
    document.getElementById('win-overlay').style.display='none';
}

function toggleSettings(show){
    document.getElementById('settings-panel').style.display=show?'flex':'none';
}
