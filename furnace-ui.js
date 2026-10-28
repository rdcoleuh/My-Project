/* MineWorld original accessible furnace UI. Uses the existing Survival inventory. */
(()=>{'use strict';
function create(api){
 const engine=api.engine;let current=null,panel=null,drawClock=0;
 function el(id){return panel.querySelector('#'+id);}
 function ensurePanel(){
  if(panel)return;
  const style=document.createElement('style');style.textContent=
   '#mw-furnace-panel{z-index:140}.mw-furnace-modal{max-width:530px;width:calc(100vw - 24px);padding:22px;max-height:85dvh;overflow:auto}'+
   '.mw-furnace-row{display:flex;align-items:end;gap:8px;flex-wrap:wrap;margin:14px 0}'+
   '.mw-furnace-row label{flex:1;min-width:140px;font-weight:700}.mw-furnace-row select{display:block;width:100%;min-height:44px;background:#15251a;color:#fff;border:1px solid #a4ba88;border-radius:5px;padding:8px}'+
   '.mw-furnace-modal button{min-height:44px;padding:9px 12px;margin:4px;border:2px solid #839d72;background:#233b27;color:#fff;border-radius:5px}.mw-furnace-modal button:disabled{opacity:.5}'+
   '#mw-furnace-status{padding:14px;background:#13251c;border:1px solid #6c8965;line-height:1.6}';
  document.head.appendChild(style);
  panel=document.createElement('div');panel.id='mw-furnace-panel';panel.className='modal-backdrop hidden';
  panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-label','Furnace');
  panel.innerHTML='<section class="modal mw-furnace-modal"><h2>🔥 Furnace</h2>'+
   '<p>Put an ingredient in the input slot and add fuel. One item takes 10 seconds to smelt.</p>'+
   '<div class="mw-furnace-row"><label>Input<select id="mw-furnace-input" aria-label="Furnace input"></select></label>'+
   '<button id="mw-furnace-put-input" type="button">Add 1</button><button id="mw-furnace-return-input" type="button">Take input</button></div>'+
   '<div class="mw-furnace-row"><label>Fuel<select id="mw-furnace-fuel" aria-label="Furnace fuel"></select></label>'+
   '<button id="mw-furnace-put-fuel" type="button">Add 1</button><button id="mw-furnace-return-fuel" type="button">Take fuel</button></div>'+
   '<div id="mw-furnace-status" role="status" aria-live="polite"></div>'+
   '<button id="mw-furnace-output" type="button">Collect output</button>'+
   '<button id="mw-furnace-close" type="button">Return to World</button></section>';
  document.body.appendChild(panel);
  el('mw-furnace-close').addEventListener('click',close);
  for(const which of ['input','fuel']){
   el('mw-furnace-put-'+which).addEventListener('click',()=>{
    if(!current)return;const item=el('mw-furnace-'+which).value;
    if(!item||api.count(item)<1)return;
    const moved=engine.insert(current,which,item,1);
    if(moved){api.change(item,-moved);api.onChange();render();}
   });
   el('mw-furnace-return-'+which).addEventListener('click',()=>take(which));
  }
  el('mw-furnace-output').addEventListener('click',()=>take('output'));
  document.addEventListener('keydown',e=>{
   if(current&&e.code==='Escape'){e.preventDefault();e.stopImmediatePropagation();close();}
  },true);
 }
 function take(which){
  if(!current)return;const s=engine.get(current)?.[which];if(!s)return;
  const room=65535-api.count(s.key);if(room<1){api.toast('Inventory full');return;}
  const out=engine.take(current,which,Math.min(room,s.qty));
  if(out){api.change(out.key,out.qty);api.onChange();render();}
 }
 function render(){
  if(!current||!panel)return;
  const m=engine.ensure(current),totals=api.totals();
  for(const which of ['input','fuel']){
   const select=el('mw-furnace-'+which),previous=select.value;
   select.replaceChildren();
   const options=which==='input'?window.MineWorldFurnace.RECIPES:window.MineWorldFurnace.FUEL;
   for(const key of Object.keys(options)){
    if(!totals[key]&&m[which]?.key!==key)continue;
    const option=document.createElement('option');option.value=key;
    option.textContent=api.label(key)+' ('+(totals[key]||0)+')';select.appendChild(option);
   }
   if([...select.options].some(o=>o.value===previous))select.value=previous;
   const selected=select.value;
   el('mw-furnace-put-'+which).disabled=!selected||!totals[selected]||
    (m[which]&&(m[which].key!==selected||m[which].qty>=64));
   el('mw-furnace-return-'+which).disabled=!m[which];
  }
  const fmt=s=>s?s.qty+' × '+api.label(s.key):'Empty';
  el('mw-furnace-status').textContent='Input: '+fmt(m.input)+' · Fuel: '+fmt(m.fuel)+
   ' · Output: '+fmt(m.output)+' · Flame: '+Math.ceil(m.burn)+'s · Smelted: '+Math.round(m.progress*10)+'%';
  el('mw-furnace-output').textContent='Collect output: '+fmt(m.output);
  el('mw-furnace-output').disabled=!m.output;
 }
 function open(position){ensurePanel();current={...position};engine.ensure(current);
  panel.classList.remove('hidden');api.onPause();render();el('mw-furnace-close').focus();}
 function close(){if(!current)return;current=null;panel?.classList.add('hidden');api.onResume();}
 function tick(dt){if(!current)return;drawClock+=dt;if(drawClock>=.25){drawClock=0;render();}}
 return {open,close,tick,get isOpen(){return !!current;}};
}
window.MineWorldFurnaceUI=Object.freeze({create});
})();