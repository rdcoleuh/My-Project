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
 const capacity=typeof window.MineWorldFurnace?.slotCapacity==='function'
  ?window.MineWorldFurnace.slotCapacity(which,item):64;
 const quantity=Math.min(limit,owned,capacity-(existing?.qty||0));
 if(quantity<1)return 0;
 // Some inventory adapters throw *after* mutating their inventory.
 // Reconcile the observed debit before propagating the error, otherwise
 // an interrupted deposit silently destroys the reserved player items.
 let debit,debitError=null;
 try{debit=api.change(item,-quantity);}catch(error){debitError=error;}
 const afterDebit=api.count(item),removed=owned-afterDebit;
 if(debitError||debit!==-quantity||removed!==quantity){
  // Undo both unexpected debits and unexpected credits, if measurable.
  if(Number.isInteger(removed)&&removed!==0)api.change(item,removed);
  if(debitError)throw debitError;
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
  after?NaN:beforeQty?-beforeQty:0;
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
 // A credit may throw after granting items. Undo the *observed* credit
 // before rethrowing, so the unchanged furnace output cannot be duplicated.
 let credit,creditError=null;
 try{credit=api.change(existing.key,quantity);}catch(error){creditError=error;}
 const afterCredit=api.count(existing.key),added=afterCredit-owned;
 if(creditError||!Number.isInteger(credit)||credit<=0||credit>quantity||added!==credit){
  if(Number.isInteger(added)&&added!==0)api.change(existing.key,-added);
  if(creditError)throw creditError;
  return {moved:0,full:false};
 }
 // Reconcile the actual furnace stack delta. A misreporting take adapter
 // must not duplicate smelted items, and a partially mutating adapter that
 // throws must refund only the amount still inside the furnace.
 const beforeQty=existing.qty;
 let takeError=null;
 try{engine.take(position,which,credit);}
 catch(error){takeError=error;}
 const after=engine.get(position)?.[which];
 const remaining=after?.key===existing.key?after.qty:after?NaN:0;
 const moved=beforeQty-remaining;
 if(!Number.isInteger(moved)||moved<0||moved>credit)
  throw new Error('Invalid furnace withdrawal state');
 if(moved<credit)api.change(existing.key,moved-credit);
 if(takeError)throw takeError;
 return {moved,full:false};
}
// A transfer adapter can throw *after* moving items. The underlying
// deposit/withdraw routines reconcile the amounts before rethrowing, but the
// UI must still persist that partial transfer. Otherwise a reload may restore
// old furnace contents while retaining the newly credited player inventory.
function commitTransfer(api,work,changed,refresh,beforeSave){
 let result;
 try{result=work();}
 catch(_error){
  // Conservatively persist even if the adapter rolled everything back:
  // it is safer to save an unchanged state than lose a partial transfer.
  api.onChange();
  refresh();
  api.toast?.('Furnace transfer interrupted; check inventory');
  return null;
 }
 if(changed(result)){
  // A collected smelt's XP belongs to the same saved transaction as its
  // inventory credit and output debit. Award it before the save callback:
  // otherwise a snapshot taken by onChange can contain the items but no XP.
  // An optional reward callback cannot prevent persisting a completed transfer.
  if(typeof beforeSave==='function'){
   try{beforeSave(result);}
   catch(_error){api.toast?.('Furnace reward interrupted; check experience');}
  }
  api.onChange();refresh();
 }
 return result;
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
// Opening or replacing a station changes persisted machine state even when
// the player never transfers an item. Save those transitions immediately so
// closing the world cannot restore an outdated furnace kind or fuel timer.
function ensureStation(engine,api,position,kind='furnace'){
 const previous=engine.get(position),previousKind=previous?.kind;
 const machine=engine.ensure(position,kind);
 if(!machine)return null;
 if(!previous||previousKind!==machine.kind)api.onChange();
 return machine;
}
// Plan a native button tap without mutating either inventory. Mouse modifiers
// offer quick stack handling; touch and keyboard clicks use the same safe path.
function planSlotGesture(which,slot,selected,owned,modifiers={}){
 if(!['input','fuel','output'].includes(which))return null;
 const shift=!!modifiers.shiftKey;
 if(which==='output')return slot?{action:'take',limit:shift?1:64}:null;
 if(modifiers.altKey||modifiers.ctrlKey||modifiers.metaKey)
  return slot?{action:'take',limit:shift?64:1}:null;
 // The gesture must obey the same capacity as the engine and Add buttons.
 // In particular, a full one-bucket fuel slot must withdraw on touch even
 // when the selected fuel is another lava bucket owned by the player.
 const capacity=typeof window.MineWorldFurnace?.slotCapacity==='function'
  ?window.MineWorldFurnace.slotCapacity(which,selected):64;
 if(typeof selected==='string'&&selected&&Number.isSafeInteger(owned)&&owned>0&&
    (!slot||(slot.key===selected&&Number.isSafeInteger(slot.qty)&&slot.qty<capacity)))
  return {action:'deposit',item:selected,limit:shift?64:1};
 return slot?{action:'take',limit:shift?64:1}:null;
}
// Experience is earned when a successfully smelted stack is actually
// collected, never when fuel is inserted or an output merely finishes.
// MineWorld currently tracks whole XP points: standard outputs grant one
// point each; ancient debris is a rarer two-point product. This is original
// MineWorld progression balancing, not an exact Java/Bedrock XP table.
const SMELT_PRODUCTS=new Set(Object.values(window.MineWorldFurnace?.RECIPES||{}));
function smeltingReward(key,quantity){
 if(!SMELT_PRODUCTS.has(key)||!Number.isSafeInteger(quantity)||quantity<1||quantity>64)return 0;
 return quantity*(key==='netheriteScrap'?2:1);
}
function awardCollectedOutput(api,which,key,result){
 if(which!=='output'||!result||!Number.isSafeInteger(result.moved)||
    result.moved<1||typeof api?.gainExperience!=='function')return 0;
 const points=smeltingReward(key,result.moved);
 if(points)api.gainExperience(points);
 return points;
}
// Frequent timer redraws must not flood assistive technology.
function furnaceAnnouncement(previous,machine){
 if(!previous||!machine)return null;
 const output=machine.output,qty=output?.qty||0,key=output?.key||null;
 const exhausted=previous.burn>0&&machine.burn<=0;
 if(qty>0&&(key!==previous.outputKey||qty>previous.outputQty))
  return {kind:exhausted?'ready-and-fuel-out':'ready',key,quantity:qty};
 if(exhausted)return {kind:'fuel-out'};
 if(previous.burn<=0&&machine.burn>0)return {kind:'burning'};
 return null;
}
function furnaceAnnouncementState(machine){
 return {burn:machine.burn,outputKey:machine.output?.key||null,
  outputQty:machine.output?.qty||0};
}
// Explain actual furnace blocking conditions without spamming the live region.
function furnaceWorkState(machine){
 if(!machine)return 'Furnace unavailable.';
 if(!machine.input)return 'Add an ingredient to begin smelting.';
 const api=window.MineWorldFurnace;
 // Corrupt or older saves may carry an unknown station kind. Avoid a
 // missing KINDS lookup crashing the status panel during recovery.
 if(!api?.KINDS||!Object.prototype.hasOwnProperty.call(api.KINDS,machine.kind))
  return 'Unknown furnace type. Reopen or replace this station to repair it.';
 // Recipe identifiers can originate in saved worlds. Never resolve inherited
 // Object keys (constructor, toString, etc.) as smelting products.
 const key=machine.input.key;
 const product=api&&Object.prototype.hasOwnProperty.call(api.RECIPES||{},key)?api.RECIPES[key]:null;
 if(!product||!api.canSmelt(machine.kind,key))
  return 'This ingredient cannot be smelted here. Take the input to change it.';
 if(machine.output&&(machine.output.key!==product||machine.output.qty>=64))
  return 'Output blocked. Collect the output before smelting can continue.';
 if(machine.burn<=0&&!machine.fuel)
  return 'Add usable fuel to begin or resume smelting.';
 if(machine.burn<=0&&!Object.prototype.hasOwnProperty.call(api.FUEL||{},machine.fuel.key))
  return Object.prototype.hasOwnProperty.call(Object.prototype,machine.fuel.key)
   ?'Add usable fuel to begin or resume smelting.'
   :'Unknown fuel item. Take it from the fuel slot and add supported fuel.';
 if(machine.burn<=0&&(typeof api.slotCapacity==='function'?api.slotCapacity('fuel',machine.fuel.key):64)===1&&machine.fuel.qty!==1)
  return machine.fuel.key==='lavaBucket'?'Take excess lava buckets out of the fuel slot before ignition; only one nonstackable fuel item fits.':'Take excess nonstackable fuel out of the fuel slot before ignition.';
 const seconds=Math.max(0,Math.ceil(api.KINDS[machine.kind].cook-machine.progress));
 return 'Smelting '+product+'. About '+seconds+' seconds until the next item.';
}
// Accessible progress must describe a stopped furnace accurately. A numeric
// cook timer is not an ETA when input, output or fuel blocks progress.
function furnaceProgressDescriptions(machine,status){
 const remaining=Math.max(0,Math.ceil((window.MineWorldFurnace?.KINDS?.[machine.kind]?.cook||10)-machine.progress));
 const fuel=machine.burn>0?Math.ceil(machine.burn)+' seconds of burning fuel remaining':'Fuel is not burning';
 const reasons={
  no_input:'Smelting stopped: input slot empty',
  no_recipe:'Smelting stopped: unsupported ingredient',
  output_blocked:'Smelting stopped: output slot blocked',
  invalid_fuel_stack:'Smelting stopped: invalid nonstackable fuel stack',
  invalid_fuel:'Smelting stopped: unsupported fuel',
  no_fuel:'Smelting stopped: add fuel'
 };
 const reason=status?.idleReason;
 const cook=reason&&Object.prototype.hasOwnProperty.call(reasons,reason)?reasons[reason]:
  machine.burn<=0&&status?.readyToSmelt?'Ready to ignite: fuel and ingredient available':
  machine.burn<=0?'Smelting stopped: fuel is not burning':
  remaining+' seconds of cooking remaining';
 return {fuel,cook};
}
// A modal must not let keyboard users Tab into controls behind its backdrop.
function containFurnaceTab(event,panel,active){
 if(!panel||!(event?.key==='Tab'||event?.code==='Tab'))return false;
 const controls=Array.from(panel.querySelectorAll('button:not([disabled]),select:not([disabled])'))
  .filter(node=>!node.hidden);
 if(!controls.length)return false;
 const first=controls[0],last=controls[controls.length-1];
 const target=!panel.contains(active)?(event.shiftKey?last:first):
  event.shiftKey&&active===first?last:!event.shiftKey&&active===last?first:null;
 if(!target)return false;
 event.preventDefault();target.focus();return true;
}
function create(api){
 const engine=api.engine;let current=null,panel=null,drawClock=0;
 let announceState=null,returnFocus=null;
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
   // A syntactically valid data URI can still contain corrupt PNG bytes.
   // Keep the original text icon visible until the browser decodes it.
   img.onload=()=>{
    if(node.dataset.artStamp!==stamp)return;
    img.hidden=false;letters.hidden=true;
   };
   img.onerror=()=>{
    if(node.dataset.artStamp!==stamp)return;
    img.hidden=true;letters.hidden=false;
   };
   img.src=src;
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
   '.mw-furnace-stack{display:flex;flex-direction:column;gap:12px}.mw-furnace-slot{box-sizing:border-box;width:70px;min-height:70px;margin:0;padding:6px 3px;cursor:pointer;touch-action:manipulation;font:inherit;display:flex;flex-direction:column;justify-content:center;align-items:center;gap:4px;background:#2a3029;border:3px solid #0d1b13;box-shadow:inset 2px 2px #131b14,inset -2px -2px #65715e;color:#e5e8dc;text-align:center;overflow:hidden}'+
   '.mw-furnace-slot:focus-visible{outline:3px solid #f7d56c;outline-offset:3px}.mw-furnace-slot.occupied{background:#384633;border-color:#a5b68b}.mw-furnace-slot span{font-family:monospace;font-size:20px;font-weight:900;line-height:1;white-space:nowrap}.mw-furnace-slot img{width:32px;height:32px;object-fit:contain;image-rendering:pixelated;image-rendering:crisp-edges}.mw-furnace-slot img[hidden]{display:none}.mw-furnace-slot small{font-size:11px;line-height:1.15;overflow-wrap:anywhere}.mw-furnace-meters{display:flex;flex-direction:column;gap:12px;min-width:0}.mw-furnace-meters label{font-size:12px;font-weight:700}.mw-furnace-meters progress{display:block;width:100%;height:14px;accent-color:#f3a33d;margin-top:5px}'+
   '.mw-furnace-sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap;border:0}'+
   '@media(max-width:390px){.mw-furnace-workspace{grid-template-columns:64px minmax(70px,1fr) 64px;gap:7px;padding:8px}.mw-furnace-slot{width:62px;min-height:62px}.mw-furnace-modal{padding:12px}}';
  document.head.appendChild(style);
  panel=document.createElement('div');panel.id='mw-furnace-panel';panel.className='modal-backdrop hidden';
  panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-label','Furnace');
  panel.innerHTML='<section class="modal mw-furnace-modal"><h2 id="mw-furnace-title">🔥 Furnace</h2>'+
   '<p id="mw-furnace-help">Put an ingredient in the input slot and add fuel. One item takes 10 seconds to smelt.</p>'+
   '<div class="mw-furnace-workspace" role="group" aria-label="Furnace input, fuel and output slots">'+
   '<div class="mw-furnace-stack"><button id="mw-furnace-slot-input" type="button" class="mw-furnace-slot" aria-label="Input slot empty" title="Tap to add selected ingredient; Shift adds stack; Alt takes one"><img alt="" aria-hidden="true" hidden><span aria-hidden="true">—</span><small>Input</small></button>'+
   '<button id="mw-furnace-slot-fuel" type="button" class="mw-furnace-slot" aria-label="Fuel slot empty" title="Tap to add selected fuel; Shift adds stack; Alt takes one"><img alt="" aria-hidden="true" hidden><span aria-hidden="true">—</span><small>Fuel</small></button></div>'+
   '<div class="mw-furnace-meters"><label for="mw-furnace-flame">Fuel burning<progress id="mw-furnace-flame" max="100" value="0"></progress></label>'+
   '<label for="mw-furnace-cook">Smelting<progress id="mw-furnace-cook" max="100" value="0"></progress></label></div>'+
   '<button id="mw-furnace-slot-output" type="button" class="mw-furnace-slot" aria-label="Output slot empty" title="Tap to collect output; Shift collects one"><img alt="" aria-hidden="true" hidden><span aria-hidden="true">—</span><small>Output</small></button></div>'+
   '<div class="mw-furnace-row"><label>Input<select id="mw-furnace-input" aria-label="Furnace input"></select></label>'+
   '<button id="mw-furnace-put-input" type="button">Add 1</button><button id="mw-furnace-put-input-stack" type="button">Add stack</button><button id="mw-furnace-return-input-one" type="button">Take 1</button><button id="mw-furnace-return-input" type="button">Take input</button></div>'+
   '<div class="mw-furnace-row"><label>Fuel<select id="mw-furnace-fuel" aria-label="Furnace fuel"></select></label>'+
   '<button id="mw-furnace-put-fuel" type="button">Add 1</button><button id="mw-furnace-put-fuel-stack" type="button">Add stack</button><button id="mw-furnace-return-fuel-one" type="button">Take 1</button><button id="mw-furnace-return-fuel" type="button">Take fuel</button></div>'+
   '<div id="mw-furnace-status" aria-live="off"></div>'+
   '<p id="mw-furnace-hint" aria-live="off"></p>'+
   '<div id="mw-furnace-announcement" class="mw-furnace-sr-only" role="status" aria-live="polite" aria-atomic="true"></div>'+
   '<button id="mw-furnace-output-one" type="button" aria-label="Collect one smelted item">Collect 1</button>'+
   '<button id="mw-furnace-output" type="button">Collect output</button>'+
   '<button id="mw-furnace-close" type="button">Return to World</button></section>';
  document.body.appendChild(panel);
  // Native buttons support touch, mouse, Enter and Space without custom
  // key handlers. All mutations use the existing reconciled transfer path.
  for(const which of ['input','fuel','output']){
   el('mw-furnace-slot-'+which).addEventListener('click',event=>{
    if(!current)return;
    const stack=engine.get(current)?.[which]||null;
    const selected=which==='output'?'':el('mw-furnace-'+which).value;
    const gesture=planSlotGesture(which,stack,selected,selected?api.count(selected):0,event);
    if(!gesture)return;
    if(gesture.action==='take')take(which,gesture.limit);
    else commitTransfer(api,()=>deposit(engine,api,current,which,gesture.item,gesture.limit),
      moved=>moved>0,render);
   });
  }
  el('mw-furnace-close').addEventListener('click',close);
  for(const which of ['input','fuel']){
   for(const [suffix,limit] of [['',1],['-stack',64]]){
    el('mw-furnace-put-'+which+suffix).addEventListener('click',()=>{
     if(!current)return;const item=el('mw-furnace-'+which).value;
     commitTransfer(api,()=>{
      const moved=deposit(engine,api,current,which,item,limit);
      return moved;
     },moved=>moved>0,render);
    });
   }
   el('mw-furnace-'+which).addEventListener('change',render);
   el('mw-furnace-return-'+which+'-one').addEventListener('click',()=>take(which,1));
   el('mw-furnace-return-'+which).addEventListener('click',()=>take(which));
  }
  el('mw-furnace-output-one').addEventListener('click',()=>take('output',1));
  el('mw-furnace-output').addEventListener('click',()=>take('output'));
  document.addEventListener('keydown',e=>{
   if(current&&e.code==='Tab')containFurnaceTab(e,panel,document.activeElement);
   if(current&&e.code==='Escape'){e.preventDefault();e.stopImmediatePropagation();close();}
  },true);
 }
 function take(which,limit=64){
  if(!current)return;
  const outputKey=which==='output'?engine.get(current)?.output?.key:null;
  const result=commitTransfer(api,()=>withdraw(engine,api,current,which,limit),
   value=>!!value?.moved,render,
   result=>awardCollectedOutput(api,which,outputKey,result));
  if(result?.full){api.toast('Inventory full');return;}
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
   const capacity=typeof window.MineWorldFurnace?.slotCapacity==='function'
    ?window.MineWorldFurnace.slotCapacity(which,selected):64;
   const canAdd=!!selected&&!!totals[selected]&&
    (!m[which]||(m[which].key===selected&&m[which].qty<capacity));
   el('mw-furnace-put-'+which).disabled=!canAdd;
   // A nonstackable fuel container can be added only once per slot.
   el('mw-furnace-put-'+which+'-stack').disabled=!canAdd||capacity<=1;
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
  // Specialized stations cook in five seconds, not ten. Keep the help and
  // native progress controls meaningful for screen-reader and touch users.
  const station=window.MineWorldFurnace.KINDS?.[m.kind];
  // Older/custom worlds may contain an unknown station kind. Keep the modal
  // usable so players can withdraw items instead of crashing each redraw.
  const cookDuration=Number.isFinite(station?.cook)&&station.cook>0?station.cook:10;
  el('mw-furnace-help').textContent='Add an ingredient and fuel. '+(m.kind==='smoker'?'Food only':m.kind==='blast'?'Ores and metals only':'All supported recipes')+'; one item takes '+cookDuration+' seconds. Tap a slot to add the selected item or collect output. Shift adds a stack; Alt takes one. Collect output for experience.';
  const descriptions=furnaceProgressDescriptions(m,engine.status?.(current));
  el('mw-furnace-flame').setAttribute('aria-valuetext',descriptions.fuel);
  el('mw-furnace-cook').setAttribute('aria-valuetext',descriptions.cook);
  el('mw-furnace-flame').value=m.burnTotal>0?Math.max(0,Math.min(100,Math.round(m.burn/m.burnTotal*100))):0;
  el('mw-furnace-cook').value=Math.max(0,Math.min(100,Math.round(m.progress/cookDuration*100)));
  el('mw-furnace-status').textContent='Input: '+fmt(m.input)+' · Fuel: '+fmt(m.fuel)+
   ' · Output: '+fmt(m.output)+' · Flame: '+Math.ceil(m.burn)+'s · Smelted: '+Math.round(m.progress/cookDuration*100)+'%';
  // Use the engine's authoritative read-only diagnostics. A UI timer must
  // never advance cooking or mutate saved slots just to explain a stall.
  const state=engine.status?.(current);
  const reasonText={
   no_input:'Add an ingredient to begin smelting.',
   no_recipe:'This ingredient cannot be smelted here. Take the input to change it.',
   output_blocked:'Output blocked. Collect the output before smelting can continue.',
   invalid_fuel_stack:'Take excess nonstackable fuel out of the fuel slot before ignition.',
   invalid_fuel:'Unknown fuel item. Take it from the fuel slot and add supported fuel.',
   no_fuel:'Add usable fuel to begin or resume smelting.'
  };
  const hint=state?.idleReason?reasonText[state.idleReason]:
   state?.readyToSmelt?'Smelting '+state.product+'. About '+Math.ceil(state.cookSecondsRemaining)+' seconds until the next item.':null;
  // The generic status code intentionally stays stable for programmatic clients,
  // but the visible hint must distinguish legacy stacked lava buckets from
  // other invalid nonstackable fuels so players know how to recover them.
  el('mw-furnace-hint').textContent=state?.idleReason==='invalid_fuel_stack'?
   furnaceWorkState(m):hint||furnaceWorkState(m);
  const event=furnaceAnnouncement(announceState,m);
  announceState=furnaceAnnouncementState(m);
  if(event){
   el('mw-furnace-announcement').textContent=event.kind==='ready'||event.kind==='ready-and-fuel-out'?
    'Smelting complete. '+fmt(m.output)+' ready in output slot.'+
     (event.kind==='ready-and-fuel-out'?' Fuel exhausted.':''):
    event.kind==='burning'?'Furnace fuel ignited.':'Furnace fuel exhausted.';
  }
  el('mw-furnace-output-one').disabled=!m.output;
  el('mw-furnace-output').textContent='Collect output: '+fmt(m.output);
  el('mw-furnace-output').disabled=!m.output;
 }
 function open(position,kind='furnace'){
  const machine=ensureStation(engine,api,position,kind);
  if(!machine)return false;
  ensurePanel();returnFocus=document.activeElement;announceState=null;drawClock=0;
  el('mw-furnace-announcement').textContent='';current={...position};
  const station=machine.kind;
  el('mw-furnace-title').textContent=station==='smoker'?'🍖 Smoker':station==='blast'?'⚒ Blast Furnace':'🔥 Furnace';
  el('mw-furnace-help').textContent='Add an ingredient and fuel. '+(station==='smoker'?'Food only':station==='blast'?'Ores and metals only':'All supported recipes')+'; one item takes '+(Number.isFinite(window.MineWorldFurnace.KINDS?.[station]?.cook)&&window.MineWorldFurnace.KINDS[station].cook>0?window.MineWorldFurnace.KINDS[station].cook:10)+' seconds. Tap a slot to add the selected item or collect output. Collect smelted output for experience. Take buttons return ingredients and fuel.';

  panel.classList.remove('hidden');api.onPause();render();el('mw-furnace-close').focus();return true;}
 function close(){
  if(!current)return;
  current=null;announceState=null;panel?.classList.add('hidden');api.onResume();
  const target=returnFocus;returnFocus=null;
  if(target?.isConnected&&typeof target.focus==='function')
   target.focus({preventScroll:true});
 }
 function tick(dt){
  if(!current||typeof dt!=='number'||!Number.isFinite(dt)||dt<=0)return;
  drawClock+=Math.min(dt,1);
  if(drawClock>=.25){drawClock%=.25;render();}
 }
 return {open,close,tick,get isOpen(){return !!current;}};
}
window.MineWorldFurnaceUI=Object.freeze({create,ensureStation,syncSelect,resolveSlotIcon,planSlotGesture,smeltingReward,awardCollectedOutput,furnaceAnnouncement,furnaceAnnouncementState,furnaceWorkState,furnaceProgressDescriptions,containFurnaceTab,transfers:Object.freeze({deposit,withdraw,commitTransfer})});
})();