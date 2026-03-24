let level = 1, tubes = [], selected = null, history = [], audioCtx = null;
let soundEnabled = true, vibrateEnabled = true, currentLang = 'en';
let coins = parseInt(localStorage.getItem("coins")) || 100;

const COLORS = ['#ff0055','#00f2fe','#4facfe','#fadb14','#70e000','#9b59b6','#ff8c00'];

const LANGS = {
    en:{level:"Level",settings:"Settings",sound:"Sound",vibrate:"Vibrate",contact:"Contact",share:"Share",next:"NEXT",win:"FANTASTIC"},
    ar:{level:"مستوى",settings:"الإعدادات",sound:"الصوت",vibrate:"اهتزاز",contact:"تواصل",share:"مشاركة",next:"التالي",win:"رائع"},
    fa:{level:"مرحله",settings:"تنظیمات",sound:"صدا",vibrate:"لرزش",contact:"تماس",share:"اشتراک",next:"بعدی",win:"عالی"}
};

function init(){
    changeLang(localStorage.getItem("lang")||'en');
    updateCoins();
    showMainMenu();
}

function updateCoins(){
    document.getElementById("coins").innerText=coins;
}

function changeLang(lang){
    currentLang=lang;
    localStorage.setItem("lang",lang);

    let t=LANGS[lang];
    document.getElementById('txt-level').innerText=t.level;
    document.getElementById('txt-start-level').innerText=t.level;
    document.getElementById('txt-settings').innerText=t.settings;
    document.getElementById('txt-sound').innerText=t.sound;
    document.getElementById('txt-vibrate').innerText=t.vibrate;
    document.getElementById('txt-contact').innerText=t.contact;
    document.getElementById('txt-share').innerText=t.share;
    document.getElementById('txt-win').innerText=t.win;
    document.getElementById('txt-next').innerText=t.next;

    document.body.dir=(lang==='fa'||lang==='ar')?'rtl':'ltr';
}

function showMainMenu(){
    document.getElementById('start-menu').style.display='flex';
}

function startGame(){
    document.getElementById('start-menu').style.display='none';
    loadLevel();
}

function loadLevel(){
    let colorCount=Math.min(3+Math.floor(level/3),7);
    let balls=[];

    for(let i=0;i<colorCount;i++){
        for(let j=0;j<4;j++) balls.push(COLORS[i]);
    }

    balls.sort(()=>Math.random()-0.5);

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
        div.className='tube'+(selected===i?' active':'');
        div.onclick=()=>tap(i);

        t.forEach(color=>{
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
        if(tubes[i].length>0) selected=i;
    }else{
        if(selected!==i) move(selected,i);
        selected=null;
    }
    render();
}

function move(a,b){
    let f=tubes[a], t=tubes[b];
    if(f.length===0) return;

    let color=f[f.length-1];

    if(t.length<4 && (t.length===0 || t[t.length-1]===color)){
        while(f.length && f[f.length-1]===color && t.length<4){
            t.push(f.pop());
        }

        if(checkWin()){
            coins+=10;
            localStorage.setItem("coins",coins);
            updateCoins();
            document.getElementById('win-overlay').style.display='flex';
        }
    }
}

function checkWin(){
    return tubes.filter(t=>t.length>0)
        .every(t=>t.length===4 && t.every(x=>x===t[0]));
}

function nextLevel(){
    level++;
    loadLevel();
    document.getElementById('win-overlay').style.display='none';
}

function toggleSettings(x){
    document.getElementById('settings-panel').style.display=x?'flex':'none';
}

function toggleOption(type){
    if(type==='sound'){
        soundEnabled=!soundEnabled;
        document.getElementById('sound-toggle').classList.toggle('active',soundEnabled);
    }
    if(type==='vibrate'){
        vibrateEnabled=!vibrateEnabled;
        document.getElementById('vibrate-toggle').classList.toggle('active',vibrateEnabled);
    }
}

async function shareGame(){
    try{
        if(navigator.share){
            await navigator.share({
                title:"Neon Ball Sort",
                text:"Try this game!",
                url:window.location.href
            });
        }else{
            await navigator.clipboard.writeText(window.location.href);
            alert("Link copied");
        }
    }catch(e){}
}

function reset(){loadLevel();}
function undo(){}
function addTube(){}
function skipLevel(){nextLevel();}
