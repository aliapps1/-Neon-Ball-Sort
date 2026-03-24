let level = 1, tubes = [], selected = null, history = [], audioCtx = null;
let soundEnabled = true, vibrateEnabled = true, currentLang = 'en';
let coins = parseInt(localStorage.getItem("neon_coins")) || 100;

function saveCoins(){ localStorage.setItem("neon_coins", coins); }
function updateCoinsUI(){ let el=document.getElementById("coins"); if(el) el.innerText=coins; }

const COLORS = ['#ff0055','#00f2fe','#4facfe','#fadb14','#70e000','#9b59b6','#ff8c00','#ffffff'];

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
        resetQ:"Restart?"
    },
    ar:{
        level:"مستوى",
        settings:"الإعدادات",
        sound:"الصوت",
        vibrate:"اهتزاز",
        contact:"اتصل بنا",   // 🔥 اصلاح شد
        share:"مشاركة",       // 🔥 اصلاح شد
        next:"التالي",
        win:"رائع",
        resetQ:"إعادة؟"
    },
    fa:{
        level:"مرحله",
        settings:"تنظیمات",
        sound:"صدا",
        vibrate:"لرزش",
        contact:"تماس با ما", // 🔥 اصلاح شد
        share:"اشتراک‌گذاری", // 🔥 اصلاح شد
        next:"بعدی",
        win:"عالی",
        resetQ:"شروع مجدد؟"
    }
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

    document.getElementById('sound-toggle')?.classList.toggle('active',soundEnabled);
    document.getElementById('vibrate-toggle')?.classList.toggle('active',vibrateEnabled);

    showMainMenu();
}

function showMainMenu(){
    document.getElementById('start-menu').style.display='flex';
}

function startGame(){
    document.getElementById('start-menu').style.display='none';
    loadLevel();
}

function loadLevel(){
    setText('level-num',level);
    document.getElementById('win-overlay').style.display='none';

    selected=null;
    history=[];

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

    if(f.length===0) return;

    let color=f[f.length-1];

    if(t.length<4 && (t.length===0 || t[t.length-1]===color)){

        history.push(JSON.stringify(tubes));

        while(f.length>0 && f[f.length-1]===color && t.length<4){
            t.push(f.pop());
        }

        playSnd(600,0.1);

        if(vibrateEnabled && navigator.vibrate){
            navigator.vibrate(30);
        }

        if(checkWin()){
            coins+=10;
            saveCoins();

            setTimeout(()=>{
                document.getElementById('win-overlay').style.display='flex';
                playSnd(800,0.3);
            },300);
        }
    }
}

function checkWin(){
    return tubes.filter(t=>t.length>0)
        .every(t=>t.length===4 && t.every(b=>b===t[0]));
}

function nextLevel(){
    level++;
    localStorage.setItem('neon_lvl',level);
    loadLevel();
}

function reset(){
    if(confirm(LANGS[currentLang].resetQ)) loadLevel();
}

function undo(){
    if(history.length>0){
        tubes=JSON.parse(history.pop());
        render();
    }
}

function addTube(){
    if(tubes.length<12){
        tubes.push([]);
        render();
    }
}

function skipLevel(){
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
