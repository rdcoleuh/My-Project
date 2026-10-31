/* MineWorld original accessible furnace UI. Uses the existing Survival inventory. */
(()=>{'use strict';

/* Inventory and furnace mutations are a single logical transfer. Reserve the
 * source first: a failed inventory debit must never manufacture furnace items,
 * and a failed inventory credit must never destroy smelted output. */
function deposit(engine,api,position,which,item,limit){
 if(!position||!['input','fuel'].includes(which)||typeof item!=='string'||
    !Number.isInteger(limit)||limit<1)return 0;
 const existing=engine.get(position)?.[which];
 if(existing&&existing.key!==item)return 0;
 const owned=api.count(item);
 if(!Number.isInteger(owned)||owned<1)return 0;
 const quantity=Math.min(limit,owned,64-(existing?.qty||0));
 if(quantity<1)return 0;
 const debit=api.change(item,-quantity);
 // An inventory adapter can misreport its delta while still changing stock.
 // Verify the observed balance before adding anything to the furnace.
 const afterDebit=api.count(item),removed=owned-afterDebit;
 if(debit!==-quantity||removed!==quantity){
  if(Number.isInteger(removed)&&removed>0)api.change(item,removed);
  return 0;
 }
 // Reconcile the actual slot delta, not the adapter's reported return.
 // A misreported insert previously refunded items that were already inside
 // the furnace (duplication), or failed to refund items that never arrived.
 // A partially mutating insert that throws must refund only what was NOT
 // transferred; refunding the whole debit would duplicate the partial stack.
 let insertError=null;
 try{engine.insert(position,which,item,quantity);}
 catch(error){insertError=error;}
 const after=engine.get(position)?.[which];
 const beforeQty=existing?.qty||0;
 const observed=after?.key===item?after.qty-beforeQty:
  after?NaN:-beforeQty;
 if(!Number.isInteger(observed)||observed<0||observed>quantity)
  throw new Error('Invalid furnace deposit state');
 if(observed<quantity)api.change(item,quantity-observed);
 if(insertError)throw insertError;
 return observed;
}
function withdraw(engine,api,position,which,limit=64){
 if(!position||!['input','fuel','output'].includes(which)||!Number.isSafeInteger(limit)||limit<1)return {moved:0,full:false};
 const existing=engine.get(position)?.[which];
 if(!existing)return {moved:0,full:false};
 const owned=api.count(existing.key);
 const room=Number.isInteger(owned)?Math.max(0,65535-owned):0;
 if(room<1)return {moved:0,full:true};
 const quantity=Math.min(limit,room,existing.qty);
 const credit=api.change(existing.key,quantity);
 const afterCredit=api.count(existing.key),added=afterCredit-owned;
 // Reject and roll back a misreported credit rather than granting free items
 // or taking more than the player requested from the furnace.
 if(!Number.isInteger(credit)||credit<=0||credit>quantity||added!==credit){
  if(Number.isInteger(added)&&added>0)api.change(existing.key,-added);
  return {moved:0,full:false};
 }
 let out;
 try{out=engine.take(position,which,credit);}
 catch(error){api.change(existing.key,-credit);throw error;}
 const moved=out?.key===existing.key&&Number.isInteger(out.qty)?
  Math.max(0,Math.min(credit,out.qty)):0;
 if(moved<credit)api.change(existing.key,moved-credit);
 return {moved,full:false};
}
// Avoid rebuilding native <select> option nodes every 250 ms: this used to
// close mobile fuel/input pickers while the player was making a choice.
function syncSelect(select,keys,totals,label,doc){
 const previous=select.value,existing=Array.from(select.options);
 const changed=existing.length!==keys.length||existing.some((o,i)=>o.value!==keys[i]);
 if(changed){
  const options=keys.map(key=>{
   const o=doc.createElement('option');o.value=key;
   o.textContent=label(key)+' ('+(totals[key]||0)+')';return o;
  });
  select.replaceChildren(...options);
  if(keys.includes(previous))select.value=previous;
 }else for(let i=0;i<keys.length;i++){
  const caption=label(keys[i])+' ('+(totals[keys[i]]||0)+')';
  if(existing[i].textContent!==caption)existing[i].textContent=caption;
 }
 return changed;
}
// Only player-imported PNGs or independently generated MineWorld block art.
async function resolveSlotIcon(key,pack,doc){
 if(typeof key!=='string')return null;
 const block=/^block:([1-9]\d*)$/.exec(key),id=block?Number(block[1]):null;
 try{
  const imported=block?await pack?.blockItemIcon?.(id):await pack?.itemIcon?.(key);
  if(typeof imported==='string'&&imported.startsWith('data:image/png;base64,'))return imported;
 }catch{ /* Invalid optional artwork falls back to original MineWorld art. */ }
 if(block&&id<=169&&typeof window.MineWorldBlockItemIcons?.paint==='function'){
  try{
   const canvas=doc.createElement('canvas');
   if(window.MineWorldBlockItemIcons.paint(canvas,id))return canvas.toDataURL('image/png');
  }catch{ /* Keep the accessible text fallback. */ }
 }
 return null;
}
function create(api){
 const engine=api.engine;let current=null,panel=null,drawClock=0;
 const iconCache=new Map();let iconPack=null,iconGeneration=null,iconEpoch=0;
 function slotArt(node,item){
  const pack=window.MineWorldLocalTextures||null,generation=pack?.generation??0;
  if(iconPack!==pack||iconGeneration!==generation){
   iconPack=pack;iconGeneration=generation;iconEpoch++;iconCache.clear();
  }
  const key=item?.key||'',stamp=key+'@'+iconEpoch;
  if(node.dataset.artStamp===stamp)return;
  node.dataset.artStamp=stamp;
  const img=node.querySelector('img'),letters=node.querySelector('span');
  img.hidden=true;letters.hidden=false;
  if(!key)return;
  if(!iconCache.has(key))iconCache.set(key,resolveSlotIcon(key,pack,document));
  iconCache.get(key).then(src=>{
   // Ignore late images for a previous item or previous resource-pack generation.
   if(node.dataset.artStamp!==stamp||!src)return;
   img.src=src;img.hidden=false;letters.hidden=true;
  }).catch(()=>{});
 }
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
   '.mw-furnace-slot.occupied{background:#384633;border-color:#a5b68b}.mw-furnace-slot span{font-family:monospace;font-size:20px;font-weight:900;line-height:1;white-space:nowrap}.mw-furnace-slot img{width:32px;height:32px;object-fit:contain;image-rendering:pixelated;image-rendering:crisp-edges}.mw-furnace-slot img[hidden]{display:none}.mw-furnace-slot small{font-size:11px;line-height:1.15;overflow-wrap:anywhere}.mw-furnace-meters{display:flex;flex-direction:column;gap:12px;min-width:0}.mw-furnace-meters label{font-size:12px;font-weight:700}.mw-furnace-meters progress{display:block;width:100%;height:14px;accent-color:#f3a33d;margin-top:5px}'+
   '@media(max-width:390px){.mw-furnace-workspace{grid-template-columns:64px minmax(70px,1fr) 64px;gap:7px;padding:8px}.mw-furnace-slot{width:62px;min-height:62px}.mw-furnace-modal{padding:12px}}';
  document.head.appendChild(style);
  panel=document.createElement('div');panel.id='mw-furnace-panel';panel.className='modal-backdrop hidden';
  panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-label','Furnace');
  panel.innerHTML='<section class="modal mw-furnace-modal"><h2 id="mw-furnace-title">🔥 Furnace</h2>'+
   '<p id="mw-furnace-help">Put an ingredient in the input slot and add fuel. One item takes 10 seconds to smelt.</p>'+
   '<div class="mw-furnace-workspace" role="group" aria-label="Furnace input, fuel and output slots">'+
   '<div class="mw-furnace-stack"><div id="mw-furnace-slot-input" class="mw-furnace-slot" role="img" aria-label="Input slot empty"><img alt="" aria-hidden="true" hidden><span aria-hidden="true">—</span><small>Input</small></div>'+
   '<div id="mw-furnace-slot-fuel" class="mw-furnace-slot" role="img" aria-label="Fuel slot empty"><img alt="" aria-hidden="true" hidden><span aria-hidden="true">—</span><small>Fuel</small></div></div>'+
   '<div class="mw-furnace-meters"><label for="mw-furnace-flame">Fuel burning<progress id="mw-furnace-flame" max="100" value="0"></progress></label>'+
   '<label for="mw-furnace-cook">Smelting<progress id="mw-furnace-cook" max="100" value="0"></progress></label></div>'+
   '<div id="mw-furnace-slot-output" class="mw-furnace-slot" role="img" aria-label="Output slot empty"><img alt="" aria-hidden="true" hidden><span aria-hidden="true">—</span><small>Output</small></div></div>'+
   '<div class="mw-furnace-row"><label>Input<select id="mw-furnace-input" aria-label="Furnace input"></select></label>'+
   '<button id="mw-furnace-put-input" type="button">Add 1</button><button id="mw-furnace-put-input-stack" type="button">Add stack</button><button id="mw-furnace-return-input-one" type="button">Take 1</button><button id="mw-furnace-return-input" type="button">Take input</button></div>'+
   '<div class="mw-furnace-row"><label>Fuel<select id="mw-furnace-fuel" aria-label="Furnace fuel"></select></label>'+
   '<button id="mw-furnace-put-fuel" type="button">Add 1</button><button id="mw-furnace-put-fuel-stack" type="button">Add stack</button><button id="mw-furnace-return-fuel-one" type="button">Take 1</button><button id="mw-furnace-return-fuel" type="button">Take fuel</button></div>'+
   '<div id="mw-furnace-status" role="status" aria-live="polite"></div>'+
   '<button id="mw-furnace-output-one" type="button" aria-label="Collect one smelted item">Collect 1</button>'+
   '<button id="mw-furnace-output" type="button">Collect output</button>'+
   '<button id="mw-furnace-close" type="button">Return to World</button></section>';
  document.body.appendChild(panel);
  el('mw-furnace-close').addEventListener('click',close);
  for(const which of ['input','fuel']){
   for(const [suffix,limit] of [['',1],['-stack',64]]){
    el('mw-furnace-put-'+which+suffix).addEventListener('click',()=>{
     if(!current)return;const item=el('mw-furnace-'+which).value;
     const moved=deposit(engine,api,current,which,item,limit);
     if(moved){api.onChange();render();}
    });
   }
   el('mw-furnace-'+which).addEventListener('change',render);
   el('mw-furnace-return-'+which+'-one').addEventListener('click',()=>take(which,1));
   el('mw-furnace-return-'+which).addEventListener('click',()=>take(which));
  }
  el('mw-furnace-output-one').addEventListener('click',()=>take('output',1));
  el('mw-furnace-output').addEventListener('click',()=>take('output'));
  document.addEventListener('keydown',e=>{
   if(current&&e.code==='Escape'){e.preventDefault();e.stopImmediatePropagation();close();}
  },true);
 }
 function take(which,limit=64){
  if(!current)return;
  const result=withdraw(engine,api,current,which,limit);
  if(result.full){api.toast('Inventory full');return;}
  if(result.moved){api.onChange();render();}
 }
 function render(){
  if(!current||!panel)return;
  const m=engine.ensure(current),totals=api.totals();
  for(const which of ['input','fuel']){
   const select=el('mw-furnace-'+which);
   const options=which==='input'?window.MineWorldFurnace.RECIPES:window.MineWorldFurnace.FUEL;
   const keys=Object.keys(options).filter(key=>(which==='fuel'||engine.canSmelt(m.kind,key))&&(totals[key]||m[which]?.key===key));
   syncSelect(select,keys,totals,key=>api.label(key),document);
   const selected=select.value;
   const canAdd=!!selected&&!!totals[selected]&&
    (!m[which]||(m[which].key===selected&&m[which].qty<64));
   el('mw-furnace-put-'+which).disabled=!canAdd;
   el('mw-furnace-put-'+which+'-stack').disabled=!canAdd;
   el('mw-furnace-return-'+which+'-one').disabled=!m[which];
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
   slotArt(node,item);
  }
  el('mw-furnace-flame').value=m.burnTotal>0?Math.max(0,Math.min(100,Math.round(m.burn/m.burnTotal*100))):0;
  el('mw-furnace-cook').value=Math.max(0,Math.min(100,Math.round(m.progress/window.MineWorldFurnace.KINDS[m.kind].cook*100)));
  el('mw-furnace-status').textContent='Input: '+fmt(m.input)+' · Fuel: '+fmt(m.fuel)+
   ' · Output: '+fmt(m.output)+' · Flame: '+Math.ceil(m.burn)+'s · Smelted: '+Math.round(m.progress/window.MineWorldFurnace.KINDS[m.kind].cook*100)+'%';
  el('mw-furnace-output-one').disabled=!m.output;
  el('mw-furnace-output').textContent='Collect output: '+fmt(m.output);
  el('mw-furnace-output').disabled=!m.output;
 }
 function open(position,kind='furnace'){ensurePanel();current={...position};engine.ensure(current,kind);
  const station=engine.get(current)?.kind||'furnace';
  el('mw-furnace-title').textContent=station==='smoker'?'🍖 Smoker':station==='blast'?'⚒ Blast Furnace':'🔥 Furnace';
  el('mw-furnace-help').textContent='Add an ingredient and fuel. '+(station==='smoker'?'Food only':station==='blast'?'Ores and metals only':'All supported recipes')+'; one item takes '+window.MineWorldFurnace.KINDS[station].cook+' seconds.';

  panel.classList.remove('hidden');api.onPause();render();el('mw-furnace-close').focus();}
 function close(){if(!current)return;current=null;panel?.classList.add('hidden');api.onResume();}
 function tick(dt){if(!current)return;drawClock+=dt;if(drawClock>=.25){drawClock=0;render();}}
 return {open,close,tick,get isOpen(){return !!current;}};
}
window.MineWorldFurnaceUI=Object.freeze({create,syncSelect,resolveSlotIcon,transfers:Object.freeze({deposit,withdraw})});
})();