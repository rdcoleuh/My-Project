'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const begin=html.indexOf('let hotbarArtGeneration=-1,hotbarArtTask=null,hotbarArtSource=null;');
const end=html.indexOf("window.addEventListener('mineworld-pack-hud-changed',()=>{refreshPackHotbarArt();});",begin);
assert.ok(begin>=0&&end>begin,'extract real production hotbar renderer');
const code=html.slice(begin,end);
function render(art){
 const pack={generation:7,hudIcon:async(kind,fill)=>kind==='hotbar'?art[fill]||null:null};
 const rootClasses=new Set(),rootStyles={};
 const items=Array.from({length:9},(_,i)=>{
  const classes=new Set(i===2?['active']:[]),styles={};
  return {classes,styles,classList:{
   contains:name=>classes.has(name),
   toggle:(name,enabled)=>enabled?classes.add(name):classes.delete(name)
  },style:{setProperty:(name,value)=>{styles[name]=value;}}};
 });
 const root={classList:{toggle:(name,enabled)=>enabled?rootClasses.add(name):rootClasses.delete(name)},
  style:{setProperty:(name,value)=>{rootStyles[name]=value;}},
  querySelectorAll:selector=>selector==='.hot-item'?items:[]};
 const window={MineWorldLocalTextures:pack};
 const refresh=new Function('window','$',code+'\nreturn refreshPackHotbarArt;')(window,()=>root);
 return {refresh,rootClasses,rootStyles,items};
}
test('partial imported nine-cell bar stays visible behind one authored slot override',async()=>{
 const hud=render({background:'data:bar',slot0:'data:override'});
 await hud.refresh();
 assert.equal(hud.rootClasses.has('mw-pack-bar-image'),true);
 assert.equal(hud.rootClasses.has('mw-pack-hotbar-slots'),false);
 assert.equal(hud.rootStyles['--mw-pack-hotbar-bg'],'url("data:bar")');
 assert.equal(hud.items[0].classes.has('mw-pack-slot'),true);
 assert.equal(hud.items[0].styles['--mw-pack-slot-bg'],'url("data:override")');
 for(const item of hud.items.slice(1))assert.equal(item.classes.has('mw-pack-slot'),false);
 assert.match(html,/#hotbar\.mw-pack-bar-image \.hot-item:not\(\.mw-pack-slot\)/);
});
test('generic imported slot suppresses background sheet to avoid doubled borders',async()=>{
 const hud=render({background:'data:bar',slot:'data:generic'});
 await hud.refresh();
 assert.equal(hud.rootClasses.has('mw-pack-bar-image'),false);
 assert.equal(hud.rootStyles['--mw-pack-hotbar-bg'],'none');
 assert.ok(hud.items.every(item=>item.classes.has('mw-pack-slot')));
});
test('complete nine-slot artwork keeps per-cell pixel mode',async()=>{
 const art={background:'data:bar'};
 for(let i=0;i<9;i++)art['slot'+i]='data:'+i;
 const hud=render(art);await hud.refresh();
 assert.equal(hud.rootClasses.has('mw-pack-hotbar-slots'),true);
 assert.equal(hud.rootClasses.has('mw-pack-bar-image'),false);
 assert.ok(hud.items.every(item=>item.classes.has('mw-pack-slot')));
});
test('missing imported art preserves procedural fallback and accessible selection',async()=>{
 const hud=render({});await hud.refresh();
 assert.equal(hud.rootClasses.has('mw-pack-bar-image'),false);
 assert.equal(hud.rootClasses.has('mw-pack-hotbar'),false);
 assert.equal(hud.items[2].classes.has('active'),true);
 assert.equal(hud.items[2].classes.has('mw-pack-slot'),false);
 assert.match(html,/#hotbar:not\(\.mw-pack-bar-image\) \.hot-item:not\(\.mw-pack-slot\)::before/);
});
test('desktop and mobile smoke test a partial imported sheet with screenshot evidence',()=>{
 const smoke=fs.readFileSync(path.join(__dirname,'..','scripts','browser-smoke.cjs'),'utf8');
 assert.match(smoke,/mineworldPartialSheetOriginal/);
 assert.match(smoke,/desktop-partial-sheet-slot-synthetic\.png/);
 assert.match(smoke,/mobile-partial-sheet-slot-synthetic\.png/);
});
