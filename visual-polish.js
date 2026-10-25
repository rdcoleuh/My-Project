/* MineWorld 6.37: reversible local-only display preferences. Never touches saved worlds. */
(()=>{
 'use strict';
 const KEY='mineworld-visual-polish-v1';
 const defaults={cleanScaling:true,focusHud:false};
 const state={...defaults};
 try{
   const saved=JSON.parse(localStorage.getItem(KEY)||'null');
   if(saved&&typeof saved==='object'){
     if(typeof saved.cleanScaling==='boolean')state.cleanScaling=saved.cleanScaling;
     if(typeof saved.focusHud==='boolean')state.focusHud=saved.focusHud;
   }
 }catch(_){}
 const labels=[];
 const root=document.documentElement;
 const apply=()=>{
   root.classList.toggle('mw-retro-screen',!state.cleanScaling);
   root.classList.toggle('mw-quiet-hud',state.focusHud);
   for(const item of labels){
     item.input.checked=state[item.key];
     item.description.textContent=item.key==='cleanScaling'?
       (state.cleanScaling?'Clean edges at high screen resolution; source block pixels stay sharp.':
        'Retro nearest-neighbor screen scaling; block pixels stay sharp.') :
       (state.focusHud?'Coordinates and long keyboard hints are hidden; gameplay controls stay available.':
        'Show coordinates and keyboard hints during play.');
   }
 };
 const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(state));}catch(_){}};
 const set=(key,value)=>{
   if(!(key in defaults))return false;
   state[key]=!!value;apply();save();return state[key];
 };
 function mount(){
   for(const [scope,panel] of [...document.querySelectorAll('#pause .mw-render-panel, #mw-options-screen .mw-render-panel')].entries()){
     if(panel.querySelector('[data-mw-polish]'))continue;
     for(const [key,title] of [['cleanScaling','Clean screen edges'],['focusHud','Focus HUD: less clutter']]){
       const label=document.createElement('label');label.className='mw-polish-option';
       label.setAttribute('data-mw-polish',key);label.setAttribute('data-mw-polish-scope',String(scope));
       const input=document.createElement('input');input.type='checkbox';
       input.setAttribute('aria-label',title);
       const span=document.createElement('span');span.append(document.createTextNode(title));
       const description=document.createElement('small');
       span.appendChild(description);label.append(input,span);
       input.addEventListener('change',()=>set(key,input.checked));
       panel.appendChild(label);labels.push({key,input,description});
     }
   }
   apply();
 }
 window.MineWorldVisualPolish=Object.freeze({
   get:()=>({...state}),
   setCleanScaling:value=>set('cleanScaling',value),
   setFocusHud:value=>set('focusHud',value),
   mount
 });
 apply();
 mount();
})();
