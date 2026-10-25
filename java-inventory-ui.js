/* MineWorld 6.6 - inventory presentation and interactions.
 * Desktop: left/right/shift-click, drag/drop, number keys, offhand.
 * Touch: tap pickup/place, long-press/contextmenu split, button controls.
 * Creative: searchable list of all 169 block IDs, no paid assets.
 */
(()=>{
'use strict';
function install(api){
 const doc=document,panel=doc.getElementById('gear-panel'),shell=panel?.querySelector('.inventory-shell');
 if(!shell)return null;
 const model=api.model;
 shell.classList.add('mw-java-shell');
 const root=doc.createElement('div');root.className='mw-java-ui';shell.appendChild(root);
 const craftWorkspace=doc.getElementById('craft-workspace');
 let page=0,selected=null,focus=null,creativeOpen=false,touchSplit=false;
 let creativePage=0,creativeTab='all';
 function node(parent,tag,cls,text){
  const el=doc.createElement(tag);
  if(cls)el.className=cls;
  if(text!==undefined)el.textContent=text;
  if(parent)parent.appendChild(el);
  return el;
 }
 function blockImage(id,parent){
  if(window.MineWorldLocalTextures?.active){
   const canvas=node(parent,'canvas','mw-java-item');canvas.width=canvas.height=16;
   const ctx=canvas.getContext('2d');if(ctx&&window.MineWorldLocalTextures.drawFace(ctx,id,0))return;
   canvas.remove();
  }
  const block=node(parent,'span','mw-java-item');
  const atlas=window.MineWorldAtlas?.dataURL;
  if(atlas){
   const tile=id*3;
   block.style.backgroundImage='url('+atlas+')';
   block.style.backgroundPosition=((tile%16)/15*100).toFixed(2)+'% '+(Math.floor(tile/16)/31*100).toFixed(2)+'%';
  }else block.textContent='▦';
 }
 function itemView(key,where){
  if(!key)return;
  if(key.startsWith('block:'))blockImage(Number(key.slice(6)),where);
  else node(where,'span','mw-java-emoji',api.icon(key));
 }
 function slot(parent,pos,hint){
  const s=model.stackAt(pos),button=node(parent,'button','mw-java-slot'+(focus===pos?' mw-focused':''));
  button.type='button';
  button.title=(s?api.label(s.key)+' ×'+s.qty:hint+' · empty')+' | Left: move; Right: split/one; Shift: quick move';
  button.setAttribute('aria-label',button.title);
  if(s){itemView(s.key,button);if(s.qty>1)node(button,'small','mw-java-count',String(s.qty))}
  else if(hint==='Offhand')node(button,'span','mw-java-placeholder','🛡');
  button.addEventListener('click',e=>{
   selected=pos;focus=pos;
   const piece=s&&api.armorType(s.key);
   if(e.shiftKey&&piece&&!api.armor(piece))api.equip(s.id);
   else model.click(pos,touchSplit&&!e.shiftKey,e.shiftKey);
   render();
  });
  button.addEventListener('dblclick',e=>{e.preventDefault();selected=pos;focus=pos;model.collect(pos);render();});
  button.addEventListener('contextmenu',e=>{e.preventDefault();selected=pos;focus=pos;model.click(pos,true,false);render();});
  button.draggable=!!s;
  button.addEventListener('dragstart',e=>{if(!s)return;e.dataTransfer?.setData('text/plain',String(pos));});
  button.addEventListener('dragover',e=>e.preventDefault());
  button.addEventListener('drop',e=>{
   e.preventDefault();const source=e.dataTransfer?.getData('text/plain');
   if(source===undefined)return;
   const from=source==='offhand'?'offhand':Number(source);
   if(from==='offhand'||Number.isInteger(from)&&from>=0){model.drag(from,pos);render();}
  });
  button.addEventListener('mouseenter',()=>{focus=pos});
  return button;
 }
 function render(){
  // Keep the existing active crafting DOM/events alive while rebuilding the slot grid.
  if(craftWorkspace&&root.contains(craftWorkspace))panel.appendChild(craftWorkspace);
  model.normalize();root.replaceChildren();
  const heading=node(root,'div','mw-java-head');
  node(heading,'strong','mw-java-title','Inventory · 27 + 9 slots');
  if(touchSplit)node(heading,'span','mw-java-held','Split / one-item tap mode');
  const importButton=node(heading,'button','mw-java-pack-button','Import Java textures');
  importButton.type='button';importButton.addEventListener('click',pickPack);
  const held=model.cursorStack();
  node(heading,'span','mw-java-held',held?'Holding '+api.label(held.key)+' ×'+held.qty:'');
  const top=node(root,'div','mw-java-top');
  const equip=node(top,'div','mw-java-equipment');
  for(const [kind,icon] of [['head','◉'],['chest','▣'],['legs','▥'],['feet','♧']]){
   const key=api.armor(kind);
   const b=node(equip,'button','mw-java-slot');
   b.type='button';
   b.title=key?api.label(key):'Empty '+kind+' armor slot';
   b.setAttribute('aria-label',b.title);
   if(key)itemView(key,b);else node(b,'span','mw-java-placeholder',icon);
   b.addEventListener('click',()=>{
    if(key)api.unequip(kind);
    else{
     const item=model.stackAt(selected)||model.cursorStack();
     if(item&&api.armorType(item.key)===kind){model.putAway();api.equip(item.id);}
    }
    render();
   });
  }
  node(top,'div','mw-java-player','🧍');
  const util=node(top,'div','mw-java-equipment');
  slot(util,'offhand','Offhand');
  const dock=node(top,'div','mw-java-craft');
  if(craftWorkspace)dock.appendChild(craftWorkspace);
  else node(dock,'div','mw-java-top-label','Crafting grid unavailable');
  const nav=node(root,'div','mw-java-nav');
  node(nav,'strong','mw-java-title','Inventory · 3 rows of 9');
  const controls=node(nav,'div','mw-java-nav');
  const previous=node(controls,'button','', '◀'),label=node(controls,'span','mw-java-title',(page+1)+' / '+model.pages()),next=node(controls,'button','','▶');
  previous.type=next.type='button';previous.disabled=page===0;next.disabled=page>=model.pages()-1;
  previous.addEventListener('click',()=>{page=Math.max(0,page-1);render();});
  next.addEventListener('click',()=>{page=Math.min(model.pages()-1,page+1);render();});
  const grid=node(root,'div','mw-java-grid');
  for(let i=0;i<27;i++)slot(grid,page===0?i:36+(page-1)*27+i,'Backpack');
  node(root,'strong','mw-java-title','Hotbar · keys 1–9');
  const hotbar=node(root,'div','mw-java-grid');
  for(let i=0;i<9;i++)slot(hotbar,27+i,'Hotbar');
  const actions=node(root,'div','mw-java-actions');
  function action(text,cb){const b=node(actions,'button','',text);b.type='button';b.addEventListener('click',()=>{cb();render();});}
  action('Equip',()=>{const s=model.stackAt(selected);if(s)api.equip(s.id)});
  action('Offhand (F)',()=>{if(selected!==null)model.moveOffhand(selected)});
  action('Use / Eat',()=>{const s=model.stackAt(selected);if(s)api.consume(s.id)});
  action(touchSplit?'Tap mode: split/one ✓':'Tap mode: whole stack',()=>{touchSplit=!touchSplit});
  action('Split (right-click)',()=>{if(selected!==null)model.click(selected,true)});
  action('Collect matching',()=>{if(selected!==null)model.collect(selected)});
  action('Shift-move',()=>{if(selected!==null)model.quickMove(selected)});
  action('Drop 1',()=>{const s=model.stackAt(selected);if(s)api.drop(s.id,false)});
  action('Drop stack',()=>{const s=model.stackAt(selected);if(s)api.drop(s.id,true)});
  const details=model.stackAt(selected);
  node(root,'div','mw-java-item-detail',details?api.label(details.key)+' · '+details.qty+'/'+(details.qty===1?'1':'64')+' · '+(selected==='offhand'?'Offhand':selected>=27&&selected<36?'Hotbar '+(selected-26):'Inventory'):'Select a slot to see its contents');
  node(root,'div','mw-java-help','Left click/tap moves stacks. Right click or Split tap mode takes half or places one. Shift+click moves stacks and equips armor. Double-click collects matching stacks up to 64. Drag to swap/merge. Hover and press 1–9 to swap hotbar positions, or F for offhand. E/Esc closes. Overflow pages retain older world inventories.');
 }
 const overlay=node(doc.getElementById('game-wrap')||doc.body,'div');
 overlay.id='mw-java-creative';overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');
 const modal=node(overlay,'section','mw-java-creative-panel');
 const title=node(modal,'div','mw-java-nav');
 node(title,'strong','','Creative Inventory · All Blocks');
 const close=node(title,'button','mw-java-close','✕ Close');
 close.addEventListener('click',closeCreative);
 const search=node(modal,'input');search.type='search';search.placeholder='Search all 169 blocks';
 search.setAttribute('aria-label','Search creative blocks');
 const status=node(modal,'p','mw-java-help','Click a block to assign it to your selected hotbar slot; keys 1–9 change selection.');
 const packButton=node(modal,'button','mw-java-close','Import your own Java Edition texture pack (ZIP/JAR)');packButton.type='button';packButton.addEventListener('click',pickPack);
 const collection=node(modal,'div','mw-java-creative-grid');
 function renderCreative(){
  const query=search.value.trim().toLowerCase();
  collection.replaceChildren();let results=0;
  for(let id=1;id<=169;id++){
   const name=api.blockName(id);
   if(query&&!name.toLowerCase().includes(query))continue;
   results++;
   const b=node(collection,'button');b.type='button';b.title=name;
   b.setAttribute('aria-label','Add '+name+' to selected hotbar slot');
   const canvas=node(b,'canvas');canvas.width=canvas.height=16;
   const ctx=canvas.getContext('2d');
   const imported=ctx&&window.MineWorldLocalTextures?.active&&window.MineWorldLocalTextures.drawFace(ctx,id,0);
   if(!imported&&ctx&&window.MineWorldPixelMaterials){
    const image=ctx.createImageData(16,16);
    for(let y=0;y<16;y++)for(let x=0;x<16;x++)
     image.data.set(window.MineWorldPixelMaterials.paint(id,0,x,y),(y*16+x)*4);
    ctx.putImageData(image,0,0);
   }else if(!imported&&!ctx)b.textContent='▦';
   b.addEventListener('click',()=>{api.assignCreative(id);status.textContent=name+' assigned. Select another block or close inventory.';});
  }
  if(!results)node(collection,'div','','No blocks found');
 }
 const packFile=node(modal,'input');packFile.type='file';packFile.accept='.zip,.jar,application/zip,application/java-archive';packFile.style.display='none';packFile.setAttribute('aria-label','Choose a local Java Edition resource pack');
 function pickPack(){if(!window.MineWorldLocalTextures){status.textContent='Start a world to enable local resource pack textures.';return;}packFile.click();}
 packFile.addEventListener('change',async()=>{
   const file=packFile.files?.[0];if(!file)return;
   status.textContent='Applying textures locally from '+file.name+'…';
   try{const r=await window.MineWorldLocalTextures.loadFile(file);
     status.textContent='Local pack active · matched '+r.faces+' of '+r.totalFaces+' block faces across '+r.blocks+' blocks. Unmatched faces retain MineWorld art.';
     renderCreative();if(!panel.classList.contains('hidden'))render();api.refreshGame?.();
   }catch(error){status.textContent='Could not import pack: '+error.message;}
   finally{packFile.value='';}
 });
 search.addEventListener('input',renderCreative);
 function openCreative(){creativeOpen=true;overlay.classList.add('mw-open');renderCreative();search.focus();}
 function closeCreative(){creativeOpen=false;overlay.classList.remove('mw-open');search.blur();api.onCreativeClose?.();}
 function keydown(e){
  if(creativeOpen){
   if(e.code==='Escape'||e.code==='KeyE'&&e.target!==search){
    e.preventDefault();e.stopImmediatePropagation();closeCreative();return;
   }
   if(e.target===search)return;
   if(/^Digit[1-9]$/.test(e.code)){
    e.preventDefault();e.stopImmediatePropagation();api.selectCreative(Number(e.code.slice(-1))-1);
   }
   return;
  }
  if(panel.classList.contains('hidden'))return;
  if(e.code==='Escape'||e.code==='KeyE'){
   e.preventDefault();e.stopImmediatePropagation();model.putAway();api.closeSurvival();return;
  }
  if(['INPUT','SELECT','TEXTAREA'].includes(e.target?.tagName))return;
  if(focus!==null&&/^Digit[1-9]$/.test(e.code)){
   e.preventDefault();e.stopImmediatePropagation();model.hotkey(focus,Number(e.code.slice(-1))-1);render();
  }else if(focus!==null&&e.code==='KeyF'){
   e.preventDefault();e.stopImmediatePropagation();model.moveOffhand(focus);render();
  }
 }
 doc.addEventListener('keydown',keydown,true);
 return {render,openCreative,closeCreative,isCreativeOpen:()=>creativeOpen,putAway:()=>model.putAway(),model};
}
window.MineWorldJavaInventoryUI=Object.freeze({install});
})();