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
   '#mw-furnace-status{padding:14px;background:#13251c;border:1px solid #6c8965;line-height:1.6}'+
   '.mw-furnace-workspace{display:grid;grid-template-columns:74px minmax(90px,1fr) 74px;align-items:center;justify-content:center;gap:14px;padding:14px;margin:12px 0;background:#18281c;border:2px solid #728365;border-radius:7px}'+
   '.mw-furnace-stack{display:flex;flex-direction:column;gap:12px}.mw-furnace-slot{box-sizing:border-box;width:70px;min-height:70px;padding:6px 3px;display:flex;flex-direction:column;justify-content:center;align-items:center;gap:4px;background:#2a3029;border:3px solid #0d1b13;box-shadow:inset 2px 2px #131b14,inset -2px -2px #65715e;color:#e5e8dc;text-align:center;overflow:hidden}'+
   '.mw-furnace-slot.occupied{background:#384633;border-color:#a5b68b}.mw-furnace-slot span{font-family:monospace;font-size:20px;font-weight:900;line-height:1;white-space:nowrap}.mw-furnace-slot small{font-size:11px;line-height:1.15;overflow-wrap:anywhere}.mw-furnace-meters{display:flex;flex-direction:column;gap:12px;min-width:0}.mw-furnace-meters label{font-size:12px;font-weight:700}.mw-furnace-meters progress{display:block;width:100%;height:14px;accent-color:#f3a33d;margin-top:5px}'+
   '@media(max-width:390px){.mw-furnace-workspace{grid-template-columns:64px minmax(70px,1fr) 64px;gap:7px;padding:8px}.mw-furnace-slot{width:62px;min-height:62px}.mw-furnace-modal{padding:12px}}';
  document.head.appendChild(style);
  panel=document.createElement('div');panel.id='mw-furnace-panel';panel.className='modal-backdrop hidden';
  panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-label','Furnace');
  panel.innerHTML='<section class="modal mw-furnace-modal"><h2>🔥 Furnace</h2>'+
   '<p>Put an ingredient in the input slot and add fuel. One item takes 10 seconds to smelt.</p>'+
   '<div class="mw-furnace-workspace" role="group" aria-label="Furnace input, fuel and output slots">'+
   '<div class="mw-furnace-stack"><div id="mw-furnace-slot-input" class="mw-furnace-slot" role="img" aria-label="Input slot empty"><span aria-hidden="true">—</span><small>Input</small></div>'+
   '<div id="mw-furnace-slot-fuel" class="mw-furnace-slot" role="img" aria-label="Fuel slot empty"><span aria-hidden="true">—</span><small>Fuel</small></div></div>'+
   '<div class="mw-furnace-meters"><label for="mw-furnace-flame">Fuel burning<progress id="mw-furnace-flame" max="100" value="0"></progress></label>'+
   '<label for="mw-furnace-cook">Smelting<progress id="mw-furnace-cook" max="100" value="0"></progress></label></div>'+
   '<div id="mw-furnace-slot-output" class="mw-furnace-slot" role="img" aria-label="Output slot empty"><span aria-hidden="true">—</span><small>Output</small></div></div>'+
   '<div class="mw-furnace-row"><label>Input<select id="mw-furnace-input" aria-label="Furnace input"></select></label>'+
   '<button id="mw-furnace-put-input" type="button">Add 1</button><button id="mw-furnace-put-input-stack" type="button">Add stack</button><button id="mw-furnace-return-input" type="button">Take input</button></div>'+
   '<div class="mw-furnace-row"><label>Fuel<select id="mw-furnace-fuel" aria-label="Furnace fuel"></select></label>'+
   '<button id="mw-furnace-put-fuel" type="button">Add 1</button><button id="mw-furnace-put-fuel-stack" type="button">Add stack</button><button id="mw-furnace-return-fuel" type="button">Take fuel</button></div>'+
   '<div id="mw-furnace-status" role="status" aria-live="polite"></div>'+
   '<button id="mw-furnace-output" type="button">Collect output</button>'+
   '<button id="mw-furnace-close" type="button">Return to World</button></section>';
  document.body.appendChild(panel);
  el('mw-furnace-close').addEventListener('click',close);
  for(const which of ['input','fuel']){
   for(const [suffix,limit] of [['',1],['-stack',64]]){
    el('mw-furnace-put-'+which+suffix).addEventListener('click',()=>{
     if(!current)return;const item=el('mw-furnace-'+which).value;
     const owned=api.count(item);if(!item||owned<1)return;
     const moved=engine.insert(current,which,item,Math.min(limit,owned));
     if(moved){api.change(item,-moved);api.onChange();render();}
    });
   }
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
   const canAdd=!!selected&&!!totals[selected]&&
    (!m[which]||(m[which].key===selected&&m[which].qty<64));
   el('mw-furnace-put-'+which).disabled=!canAdd;
   el('mw-furnace-put-'+which+'-stack').disabled=!canAdd;
   el('mw-furnace-return-'+which).disabled=!m[which];
  }
  const fmt=s=>s?s.qty+' × '+api.label(s.key):'Empty';
  for(const which of ['input','fuel','output']){
   const node=el('mw-furnace-slot-'+which),item=m[which];
   const name=which[0].toUpperCase()+which.slice(1);
   node.setAttribute('aria-label',name+' slot: '+fmt(item));
   node.querySelector('span').textContent=item?api.label(item.key).slice(0,2).toUpperCase():'—';
   node.querySelector('small').textContent=item?name+' ×'+item.qty:name;
   node.classList.toggle('occupied',!!item);
  }
  el('mw-furnace-flame').value=m.burnTotal>0?Math.max(0,Math.min(100,Math.round(m.burn/m.burnTotal*100))):0;
  el('mw-furnace-cook').value=Math.max(0,Math.min(100,Math.round(m.progress*10)));
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