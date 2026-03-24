// فقط بخش‌های اصلاح شده مهم 👇 (بقیه کدت دست نخورده)

function init(){
    level=parseInt(localStorage.getItem('neon_lvl'))||1;
    soundEnabled=localStorage.getItem('neon_snd')!=='false';
    vibrateEnabled=localStorage.getItem('neon_vib')!=='false';
    currentLang=localStorage.getItem('neon_lang')||'en';

    changeLang(currentLang);
    updateCoinsUI();

    // ✅ sync دکمه‌ها
    let s=document.getElementById('sound-toggle');
    if(s) s.classList.toggle('active',soundEnabled);

    let v=document.getElementById('vibrate-toggle');
    if(v) v.classList.toggle('active',vibrateEnabled);

    showMainMenu();
}
