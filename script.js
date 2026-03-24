let tubes=[], selected=null, history=[];
let level=1, coins=100;

let soundEnabled=true, vibrateEnabled=true;

const COLORS=['red','blue','green','yellow'];

function init(){
    updateCoins();
    showMainMenu();
}

function updateCoins(){
    document.getElementById("coins").innerText=coins;
}

function showMainMenu(){
    document.getElementById('start-menu').style.display='flex';
}

function startGame(){
    document.getElementById('start-menu').style.display='none';
    loadLevel();
}

function loadLevel(){
    tubes=[
        ['red','blue','red','blue'],
        ['green','yellow','green','yellow'],
        [],
        []
    ];
    render();
}

function render(){
    let board=document.getElementById('board');
    board.innerHTML='';

    tubes.forEach((t,i)=>{
        let d=document.createElement('div');
        d.className='tube';
        if(selected===i) d.classList.add('active');

        d.onclick=()=>tap(i);

        t.forEach(c=>{
            let b=document.createElement('div');
            b.className='ball';
            b.style.background=c;
            d.appendChild(b);
        });

        board.appendChild(d);
    });
}

function tap(i){
    if(selected===null){
        selected=i;
    }else{
        move(selected,i);
        selected=null;
    }
    render();
}

function move(a,b){
    if(tubes[a].length===0) return;

    let color=tubes[a][tubes[a].length-1];

    while(tubes[a].length && tubes[a][tubes[a].length-1]===color){
        tubes[b].push(tubes[a].pop());
    }

    if(checkWin()){
        coins+=10;
        updateCoins();
        document.getElementById('win-overlay').style.display='flex';
    }
}

function checkWin(){
    return tubes.every(t=>t.length===0 || t.every(x=>x===t[0]));
}

function nextLevel(){
    document.getElementById('win-overlay').style.display='none';
    loadLevel();
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

function shareGame(){
    alert("Share");
}

function reset(){loadLevel();}
function undo(){}
function addTube(){}
function skipLevel(){}
