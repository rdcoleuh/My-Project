/* MineWorld 6.39 — local display density preferences; screen sampling stays pixelated. */
(()=>{
 'use strict';
 const KEY='mineworld-visual-polish-v2',state={cleanScaling:true,focusHud:false},labels=[];
 try{
   const saved=JSON.parse(localStorage.getItem(KEY)||'null');
   const old=JSON.parse(localStorage.getItem('mineworld-visual-polish-v1')||'null');
   if(saved&&typeof saved==='object'){
     if(typeof saved.cleanScaling==='boolean')state.cleanScaling=saved.cleanScaling;
     if(typeof saved.focusHud==='boolean')state.focusHud=saved.focusHud;
   }else if(old&&typeof old.focusHud==='boolean')state.focusHud=old.focusHud;
 }catch(_){}
 function apply(){
   document.documentElement.classList.toggle('mw-quiet-hud',state.focusHud);
   const canvas=document.getElementById?.('world');
   if(canvas)canvas.style.imageRendering='pixelated';
   for(const item of labels){
     item.input.checked=state[item.key];
     item.description.textContent=item.key==='cleanScaling'?
       (state.cleanScaling?'Higher-resolution sharp pixels; automatically balances frame rate.':
         'Faster 1× pixels. Never blends adjacent pixels.') :
       (state.focusHud?'Coordinates and keyboard hints are hidden.':
         'Show coordinates and keyboard hints during play.');
   }
 }
 function set(key,val){
   if(!Object.hasOwn(state,key))return false;
   state[key]=!!val;apply();
   try{localStorage.setItem(KEY,JSON.stringify(state));}catch(_){}
   return state[key];
 }
 function mount(){
   for(const [scope,panel] of [...document.querySelectorAll('#pause .mw-render-panel, #mw-options-screen .mw-render-panel')].entries()){
     if(panel.querySelector('[data-mw-polish]'))continue;
     for(const [key,title] of [['cleanScaling','High-resolution sharp pixels'],['focusHud','Focus HUD: less clutter']]){
       const label=document.createElement('label');label.className='mw-polish-option';
       label.setAttribute('data-mw-polish',key);label.setAttribute('data-mw-polish-scope',String(scope));
       const input=document.createElement('input');input.type='checkbox';input.setAttribute('aria-label',title);
       const span=document.createElement('span');span.append(document.createTextNode(title));
       const description=document.createElement('small');span.appendChild(description);label.append(input,span);
       input.addEventListener('change',()=>set(key,input.checked));panel.appendChild(label);
       labels.push({key,input,description});
     }
   }
   apply();
 }
 window.MineWorldVisualPolish=Object.freeze({
   get:()=>({...state}),setCleanScaling:v=>set('cleanScaling',v),setFocusHud:v=>set('focusHud',v),mount
 });
 apply();mount();
})();