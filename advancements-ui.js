/* MineWorld 5.9 — original advancement browser, five tabs and pop-up notifications.
 * The 126 titles are game references; all iconography and UI are original.
 */
(()=>{
'use strict';
const api=window.MineWorldAdvancements;
if(!api||!document.body)return;
const doc=document;
const css=doc.createElement('style');
css.textContent=[
 '#mw-adv-screen{position:fixed;inset:0;z-index:6400;display:none;align-items:center;justify-content:center;background:#08120ddd;color:#edf7e7;padding:12px;box-sizing:border-box}',
 '#mw-adv-screen.open{display:flex}',
 '#mw-adv-panel{width:min(940px,100%);height:min(690px,calc(100dvh - 24px));background:#1f3025;border:2px solid #8eae80;box-shadow:0 25px 60px #050a05d9;border-radius:9px;display:flex;flex-direction:column;overflow:hidden;font:14px/1.45 system-ui}',
 '#mw-adv-header{padding:13px 16px;border-bottom:1px solid #647f5f;display:flex;gap:12px;align-items:center;justify-content:space-between}',
 '#mw-adv-header strong{font-size:19px}',
 '#mw-adv-header small{color:#bcd3b6;display:block;font-size:11px}',
 '#mw-adv-tabs{display:flex;gap:5px;overflow-x:auto;padding:8px 12px;background:#15281e;flex:0 0 auto}',
 '#mw-adv-tabs button{flex:0 0 auto;min-width:100px;border:1px solid #526d53;border-radius:5px;background:#2a4331;color:#d8e9d4;padding:9px 10px;font-weight:800;font-size:12px}',
 '#mw-adv-tabs button.active{border-color:#d5f29a;background:#4c6543;color:#fff}',
 '#mw-adv-toolbar{display:flex;gap:9px;flex-wrap:wrap;align-items:center;padding:10px 14px;border-bottom:1px solid #405745}',
 '#mw-adv-toolbar input,#mw-adv-toolbar select{border:1px solid #708671;color:#eef7e9;background:#16281c;border-radius:5px;padding:8px;min-height:36px;font-size:14px}',
 '#mw-adv-toolbar input{flex:1;min-width:130px}',
 '#mw-adv-scroller{overflow-y:auto;flex:1;overscroll-behavior:contain;padding:12px 15px}',
 '.mw-adv-card{border:1px solid #45604a;background:#253d2c;border-radius:6px;margin-bottom:8px;padding:11px;display:flex;gap:10px;align-items:flex-start}',
 '.mw-adv-card.complete{border-color:#abd877;background:#2e4931}',
 '.mw-adv-card.unavailable{opacity:.72;background:#27302c}',
 '.mw-adv-emblem{width:37px;height:37px;flex:0 0 37px;display:grid;place-items:center;border:2px solid #789071;background:#17291c;color:#d5f0b1;font-size:20px;border-radius:5px}',
 '.mw-adv-card.complete .mw-adv-emblem{border-color:#e5f3a4;color:#e6ffaa;background:#416a3d}',
 '.mw-adv-card .mw-adv-content{min-width:0;flex:1}',
 '.mw-adv-card strong{display:block;font-size:14px;color:#f0f7e9}',
 '.mw-adv-card small{display:block;margin:3px 0;color:#bed1bb;font-size:12px;line-height:1.4}',
 '.mw-adv-status{font-size:10px;color:#e6d99c;text-transform:uppercase;letter-spacing:.08em;font-weight:900}',
 '.mw-adv-card.complete .mw-adv-status{color:#bdf4a4}',
 '.mw-adv-card.unavailable .mw-adv-status{color:#aeb6aa}',
 '#mw-adv-footer{padding:9px 14px;font-size:11px;color:#bdcfb9;border-top:1px solid #45614c;background:#15261c}',
 '#mw-adv-notification{position:fixed;right:max(12px,env(safe-area-inset-right));top:calc(75px + env(safe-area-inset-top));z-index:6500;max-width:min(340px,90vw);display:none;align-items:center;gap:12px;padding:12px 14px;border-radius:7px;border:2px solid #d4e7a7;background:#20352beF;color:#f1ffdb;box-shadow:0 9px 40px #0008;font:13px system-ui;pointer-events:none}',
 '#mw-adv-notification.show{display:flex}',
 '#mw-adv-notification .mw-adv-popup-icon{font-size:27px}',
 '#mw-adv-notification strong{display:block;color:#e7f6a3}',
 '#mw-adv-notification small{display:block;color:#d4e8d0;margin-top:3px}',
 '#mw-adv-open,#mw-adv-pause{white-space:nowrap}',
 '@media(max-width:600px){#mw-adv-panel{height:calc(100dvh - 18px)}#mw-adv-header{padding:9px 12px}#mw-adv-tabs button{min-width:88px;font-size:10px;padding:7px}#mw-adv-scroller{padding:8px}#mw-adv-open{font-size:11px!important;padding:7px 8px!important}#mw-adv-notification{top:auto;bottom:calc(205px + env(safe-area-inset-bottom))}}'
].join('\n');
doc.head.appendChild(css);
const root=doc.createElement('div');root.id='mw-adv-screen';root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-label','Advancements');
root.innerHTML='<section id="mw-adv-panel"><header id="mw-adv-header"><div><strong>✦ Advancements</strong><small id="mw-adv-count">0 of 126 completed</small></div><button id="mw-adv-close" type="button" class="ui-button">✕ Close</button></header><nav id="mw-adv-tabs" aria-label="Advancement categories"></nav><div id="mw-adv-toolbar"><input type="search" id="mw-adv-search" placeholder="Search all advancements…" aria-label="Search advancements"><select id="mw-adv-filter" aria-label="Filter advancement status"><option value="all">All goals</option><option value="available">Playable in MineWorld</option><option value="complete">Completed</option><option value="locked">Not completed</option></select></div><section id="mw-adv-scroller" aria-label="Advancement goals"></section><footer id="mw-adv-footer">The complete Java-style catalogue is displayed. Goals requiring mechanics MineWorld does not yet have are labeled unavailable and cannot be falsely earned.</footer></section>';
doc.body.appendChild(root);
const $=id=>doc.getElementById(id);
const notify=doc.createElement('aside');notify.id='mw-adv-notification';notify.setAttribute('role','status');notify.setAttribute('aria-live','polite');
notify.innerHTML='<div class="mw-adv-popup-icon" aria-hidden="true">✦</div><div><strong id="mw-adv-popup-title">Advancement made!</strong><small id="mw-adv-popup-description">New goal complete</small></div>';
doc.body.appendChild(notify);
const openBtn=doc.createElement('button');openBtn.id='mw-adv-open';openBtn.type='button';openBtn.className='ui-button small';openBtn.textContent='✦ Advances';openBtn.title='Advancements (L)';
doc.querySelector('#top-ui .top-buttons')?.appendChild(openBtn)||
 doc.querySelector('#top-ui')?.appendChild(openBtn);
const pauseBtn=doc.createElement('button');pauseBtn.id='mw-adv-pause';pauseBtn.type='button';pauseBtn.className='ui-button mw-pause-full';pauseBtn.textContent='✦ Advancements · 126 Goals';
doc.querySelector('#pause .mw-render-panel')?.parentNode?.appendChild(pauseBtn);
let tab='story',wasPlaying=false,noticeTimer=0;
const current=()=>window.MineWorldBridge?.getAdvancementState?.();
function redraw(){
 const st=current();if(!st)return;
 $('mw-adv-count').textContent=st.count+' of '+api.DATA.length+' completed · '+st.tabCount(tab)+' in this tab';
 const nav=$('mw-adv-tabs');nav.replaceChildren();
 for(const t of api.TABS){
  const button=doc.createElement('button');button.type='button';button.className=t.id===tab?'active':'';
  button.textContent=t.symbol+' '+t.title+' · '+st.tabCount(t.id);button.setAttribute('aria-pressed',String(t.id===tab));
  button.addEventListener('click',()=>{tab=t.id;redraw();$('mw-adv-scroller').scrollTop=0});
  nav.appendChild(button);
 }
 const view=$('mw-adv-scroller');view.replaceChildren();
 const search=$('mw-adv-search').value.trim().toLowerCase(),filter=$('mw-adv-filter').value;
 const data=api.DATA.filter(d=>(search?true:d.tab===tab)&&(!search||d.name.toLowerCase().includes(search)||d.description.toLowerCase().includes(search))&&
   (filter==='all'||filter==='available'&&!!d.event||filter==='complete'&&st.has(d.name)||filter==='locked'&&!st.has(d.name)));
 for(const d of data){
  const done=st.has(d.name),unavailable=!d.event;
  const card=doc.createElement('article');card.className='mw-adv-card'+(done?' complete':unavailable?' unavailable':'');
  const symbol=doc.createElement('div');symbol.className='mw-adv-emblem';symbol.textContent=done?'✓':d.tab==='nether'?'🔥':d.tab==='end'?'✦':d.tab==='husbandry'?'🌿':d.tab==='adventure'?'⚔':'⛏';
  const content=doc.createElement('div');content.className='mw-adv-content';
  const name=doc.createElement('strong');name.textContent=d.name;
  const desc=doc.createElement('small');desc.textContent=d.description;
  const status=doc.createElement('span');status.className='mw-adv-status';
  const statusText=done?'✓ Completed':unavailable?'Not yet playable':d.kind==='challenge'?'Challenge · Available':'Available';
  status.textContent=statusText;
  const progress=st.progress?.(d.name);
  if(progress&&progress[0])status.textContent+=' · '+progress[0]+(progress[1]?'/'+progress[1]:'')+' tracked';
  content.append(name,desc,status);card.append(symbol,content);view.appendChild(card);
 }
 if(!data.length){const p=doc.createElement('p');p.textContent='No advancements match these filters.';view.appendChild(p)}
}
function open(){
 const st=current();if(!st)return;
 const welcome=doc.getElementById('welcome'),pause=doc.getElementById('pause');
 wasPlaying=!!(welcome?.classList.contains('hidden')&&pause?.classList.contains('hidden'));
 window.MineWorldBridge?.pauseForAdvancements?.();
 root.classList.add('open');redraw();
}
function close(){
 if(!root.classList.contains('open'))return;
 root.classList.remove('open');
 if(wasPlaying)window.MineWorldBridge?.resumeAfterAdvancements?.();
 wasPlaying=false;
}
function onUnlock(def){
 if(!def)return;
 $('mw-adv-popup-title').textContent=def.kind==='challenge'?'Challenge Complete!':'Advancement Made!';
 $('mw-adv-popup-description').textContent=def.name;
 notify.classList.add('show');
 clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>notify.classList.remove('show'),4600);
 if(root.classList.contains('open'))redraw();
}
$('mw-adv-close').addEventListener('click',close);
root.addEventListener('pointerdown',e=>{if(e.target===root)close()});
openBtn.addEventListener('click',open);
pauseBtn.addEventListener('click',open);
$('mw-adv-search').addEventListener('input',redraw);
$('mw-adv-filter').addEventListener('change',redraw);
doc.addEventListener('keydown',e=>{
 if(e.code==='Escape'&&root.classList.contains('open')){e.preventDefault();e.stopImmediatePropagation();close();}
},true);
window.MineWorldAdvancementsUI=Object.freeze({open,close,notify:onUnlock,refresh:redraw});
})();