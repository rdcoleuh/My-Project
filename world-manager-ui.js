/* MineWorld 5.6 — named save browser.
 * Uses MineWorldBridge for game actions and the safe world-library store. */
(()=>{
'use strict';
const d=document;
const style=d.createElement('style');
style.textContent=[
 '#mw-world-modal{position:absolute;inset:0;z-index:6100;display:none;align-items:center;justify-content:center;padding:12px;box-sizing:border-box;background:#07130de9;color:#f2f9ef;font:14px/1.5 system-ui}',
 '#mw-world-modal.open{display:flex}',
 '#mw-world-panel{width:min(750px,100%);max-height:calc(100dvh - 24px);overflow:auto;background:#23332a;border:2px solid #a4c69d;border-radius:8px;padding:16px;box-sizing:border-box}',
 '#mw-world-panel h2{margin:0 0 7px;font-size:21px}',
 '#mw-world-panel p{margin:5px 0 14px;font-size:12px;color:#d0e0d0}',
 '#mw-world-panel input,#mw-world-panel select,#mw-world-panel button{border:1px solid #96b59d;border-radius:5px;background:#31503a;color:#fff;padding:9px;min-height:38px;font:inherit}',
 '#mw-world-panel button{cursor:pointer}',
 '#mw-world-header{display:flex;justify-content:space-between;align-items:center;gap:10px}',
 '#mw-world-panel label{display:flex;gap:4px;flex-direction:column;font-size:12px;color:#e6f4dd}',
 '#mw-world-list{display:grid;gap:9px;margin:13px 0}',
 '.mw-world-card{border:1px solid #526e54;background:#2d4033;padding:11px;border-radius:5px}',
 '.mw-world-card.active{border-color:#d8e59c}',
 '.mw-world-card strong{display:block;font-size:15px}',
 '.mw-world-card small{display:block;color:#ccddc1;margin:3px 0 8px}',
 '.mw-world-buttons{display:flex;gap:6px;flex-wrap:wrap}',
 '.mw-world-buttons button{padding:7px 10px;min-height:34px}',
 '#mw-world-new{padding:11px;border-top:1px solid #7c967b;margin-top:8px}',
 '#mw-world-fields{display:flex;gap:9px;flex-wrap:wrap}',
 '#mw-world-fields label{flex:1 1 125px}',
 '#mw-world-fields input{min-width:0;width:100%;box-sizing:border-box}',
 '#mw-world-message{min-height:20px;color:#d7edbd;font-size:12px;display:block;margin-top:8px}',
 '@media(max-width:550px){#mw-world-panel{padding:10px}.mw-world-buttons button{font-size:12px;padding:6px 8px}}'
].join('\n');
d.head.appendChild(style);
const outer=d.createElement('div');outer.id='mw-world-modal';outer.setAttribute('role','dialog');outer.setAttribute('aria-modal','true');outer.setAttribute('aria-label','Manage saved worlds');
outer.innerHTML=[
 '<section id="mw-world-panel">',
 '<header id="mw-world-header"><h2>🌍 My Worlds</h2><button id="mw-world-close" type="button">✕ Close</button></header>',
 '<p>Each world keeps its own map, Creative/Survival inventory, seed, and progress in this browser. Your two Original worlds are never deleted automatically.</p>',
 '<label style="max-width:220px">Show game mode<select id="mw-world-mode"><option value="creative">✦ Creative worlds</option><option value="survival">♥ Survival worlds</option></select></label>',
 '<div id="mw-world-list" aria-live="polite"></div>',
 '<section id="mw-world-new"><strong>＋ Create another world</strong>',
 '<div id="mw-world-fields">',
 '<label>World name<input id="mw-world-name" maxlength="36" placeholder="My New World" autocomplete="off"></label>',
 '<label>Seed (optional)<input id="mw-world-seed" maxlength="64" placeholder="Random seed" autocomplete="off"></label></div>',
 '<button id="mw-world-create" type="button">＋ Create & Play</button>',
 '<small id="mw-world-message" role="status"></small></section></section>'
].join('');
d.body.appendChild(outer);
const $=id=>d.getElementById(id),bridge=()=>window.MineWorldBridge;
const message=text=>$('mw-world-message').textContent=text;
function draw(){
 const api=bridge();if(!api?.getWorlds)return;
 const mode=$('mw-world-mode').value,list=$('mw-world-list');
 list.replaceChildren();
 const worlds=api.getWorlds(mode);
 for(const item of worlds){
  const card=d.createElement('article');card.className='mw-world-card'+(item.active?' active':'');
  const title=d.createElement('strong');title.textContent=item.name+(item.active?' · SELECTED':'');
  const desc=d.createElement('small');
  desc.textContent=(mode==='creative'?'✦ Creative':'♥ Survival')+
   (item.hasSave?' · Saved map available':' · New / no save yet')+
   (item.created?' · Created '+new Date(item.created).toLocaleDateString():' · Original world');
  const actions=d.createElement('div');actions.className='mw-world-buttons';
  function btn(label,callback,disabled=false){
   const b=d.createElement('button');b.type='button';b.textContent=label;b.disabled=disabled;b.addEventListener('click',callback);actions.appendChild(b);
  }
  btn(item.active&&api.getMode()===mode?'▶ Continue':'▶ Play',()=>{
    if(api.openWorld(mode,item.id,true)){outer.classList.remove('open');message('');}
    else message('Could not load this world. Check storage or multiplayer.');
  });
  btn('✎ Rename',()=>{
    const name=window.prompt('Rename this world:',item.name);
    if(name===null)return;
    if(api.renameWorld(mode,item.id,name)){message('Renamed '+name.trim());draw();}
    else message('Could not rename the world. Check its name.');
  });
  btn('⧉ Copy',()=>{
    if(api.duplicateWorld(mode,item.id)){message('Copied '+item.name+' as a separate saved world.');draw();}
    else message('Could not copy world. Check browser storage.');
  },!item.hasSave);
  if(item.id!=='original')btn('✕ Delete',()=>{
    if(!window.confirm('Delete "'+item.name+'"? This permanently deletes its local save and cannot be undone.'))return;
    if(api.deleteWorld(mode,item.id)){message('Deleted '+item.name);draw();}
    else message('World could not be deleted.');
  });
  card.append(title,desc,actions);list.appendChild(card);
 }
 if(!worlds.length){const note=d.createElement('p');note.textContent='No worlds saved for this mode.';list.appendChild(note);}
}
function open(view){
 if(!bridge()?.getWorlds)return;
 $('mw-world-mode').value=bridge().getMode()||'creative';
 outer.classList.add('open');draw();message('');
 if(view==='create'){$('mw-world-name').focus();$('mw-world-new').scrollIntoView?.({block:'nearest'});}
}
$('mw-world-mode').addEventListener('change',draw);
$('mw-world-close').addEventListener('click',()=>outer.classList.remove('open'));
$('mw-world-create').addEventListener('click',()=>{
 const api=bridge(),mode=$('mw-world-mode').value,seed=$('mw-world-seed').value.trim();
 const name=$('mw-world-name').value.trim()||'World '+(api.getWorlds(mode).length+1);
 const result=api.createWorld(mode,name,seed,true);
 if(result){outer.classList.remove('open');$('mw-world-name').value='';$('mw-world-seed').value='';}
 else message('Could not create world. Check available browser storage and maximum slots.');
});
outer.addEventListener('pointerdown',e=>{if(e.target===outer)outer.classList.remove('open')});
d.addEventListener('keydown',e=>{if(e.code==='Escape'&&outer.classList.contains('open')){
 e.preventDefault();e.stopImmediatePropagation();outer.classList.remove('open');
}},true);
window.MineWorldWorldManager=Object.freeze({open,close(){outer.classList.remove('open')},refresh:draw});
})();