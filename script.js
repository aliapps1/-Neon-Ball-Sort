let level = 1;
let tubes = [];
let selected = null;
let history = [];
let audioCtx = null;

let soundEnabled = true;
let vibrateEnabled = true;
let currentLang = 'en';

const COLORS = ['#ff0055','#00f2fe','#4facfe','#fadb14','#70e000','#9b59b6','#ff8c00','#ffffff'];

const LANGS = {
    en:{level:"Level",settings:"Settings",sound:"Sound",vibrate:"Vibrate",contact:"Contact",share:"Share",next:"NEXT",win:"FANTASTIC"},
    ar:{level:"مستوى",settings:"الإعدادات",sound:"الصوت",vibrate:"اهتزاز",contact:"تواصل",share:"مشاركة",next:"التالي",win:"رائع"},
    fa:{level:"مرحله",settings:"تنظیمات",sound:"صدا",vibrate:"لرزش",contact:"تماس",share:"اشتراک",next:"بعدی",win:"عالی"}
};

function setText(id,text){
    let el=document.getElementById(id);
    if(el) el.innerText=text;
}

function changeLang(lang){
    currentLang=lang;
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

function playSnd(){
    if(!soundEnabled) return;
    try{
        if(!audioCtx) audioCtx=new (window.AudioContext||window.webkitAudioContext)();
        let o=audioCtx.createOscillator();
        let g=audioCtx.createGain();
        o.connect(g); g.connect(audioCtx.destination);
        o.frequency.value=600;
        g.gain.setValueAtTime(0.1,audioCtx.currentTime);
        o.start();
        o.stop(audioCtx.currentTime+0.1);
    }catch(e){}
}

function init(){
    changeLang('en');
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
    selected=null;
    history=[];

    let balls=[];
    for(let i=0;i<4;i++){
        for(let j=0;j<4;j++) balls.push(COLORS[i]);
    }

    balls.sort(()=>Math.random()-0.5);

    tubes=[];
    for(let i=0;i<4;i++){
        tubes.push(balls.splice(0,4));
    }

    tubes.push([]);
    tubes.push([]);

    render();
}

function render(){
    let board=document.getElementById('board');
    board.innerHTML='';

    tubes.forEach((tube,i)=>{
        let div=document.createElement('div');
        div.className='tube';
        if(selected===i) div.style.borderColor='#00f2fe';

        div.onclick=()=>tap(i);

        tube.forEach(color=>{
            let b=document.createElement('div');
            b.className='ball';
            b.style.background=color;
            div.appendChild(b);
        });

        board.appendChild(div);
    });
}

function tap(i){
    if(selected===null){
        if(tubes[i].length>0){
            selected=i;
        }
    }else{
        if(selected!==i){
            move(selected,i);
        }
        selected=null;
    }
    render();
}

function move(from,to){
    let a=tubes[from];
    let b=tubes[to];

    if(a.length===0) return;

    let color=a[a.length-1];

    if(b.length<4 && (b.length===0 || b[b.length-1]===color)){
        b.push(a.pop());
        playSnd();

        if(vibrateEnabled && navigator.vibrate){
            navigator.vibrate(30);
        }
    }
}

function toggleSettings(show){
    document.getElementById('settings-panel').style.display=show?'flex':'none';
}

function toggleOption(type){
    if(type==='sound'){
        soundEnabled=!soundEnabled;
        let btn=document.getElementById('sound-toggle');
        btn.classList.toggle('active',soundEnabled);
        if(soundEnabled) playSnd();
    }

    if(type==='vibrate'){
        vibrateEnabled=!vibrateEnabled;
        let btn=document.getElementById('vibrate-toggle');
        btn.classList.toggle('active',vibrateEnabled);
        if(vibrateEnabled && navigator.vibrate){
            navigator.vibrate(50);
        }
    }
}

function nextLevel(){
    loadLevel();
}

function reset(){
    loadLevel();
}

function undo(){}
function addTube(){}
function skipLevel(){}

async function shareGame(){
    alert("Share link copied!");
}
