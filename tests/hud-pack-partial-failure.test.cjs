'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');

function hotbarHarness(){
  const start=html.indexOf('let hotbarArtGeneration=-1,hotbarArtTask=null');
  const end=html.indexOf("window.addEventListener('mineworld-pack-hud-changed',()=>{refreshPackHotbarArt();});",start);
  assert.ok(start>=0&&end>start,'hotbar refresh must be present');
  const styles=new Map(),classes=new Map();
  const slots=Array.from({length:9},()=>({
    classList:{contains:()=>false,toggle(){}},
    style:{setProperty(name,value){this[name]=value;}}
  }));
  const root={
    classList:{toggle(name,value){classes.set(name,value);}},
    style:{setProperty(name,value){styles.set(name,value);}},
    querySelectorAll(){return slots;}
  };
  const window={MineWorldLocalTextures:null};
  const code=html.slice(start,end);
  const refresh=new Function('window','$','Promise','Array',
    'return (function(){'+code+';return refreshPackHotbarArt;})()')(
    window,id=>id==='hotbar'?root:null,Promise,Array);
  return {window,refresh,styles,classes,slots};
}
function statCache(){
  const start=html.indexOf('let statArtGeneration=-1;');
  const end=html.indexOf('function updateSurvivalHUD(){',start);
  assert.ok(start>=0&&end>start,'stat cache must be present');
  return new Function('Promise','Map','return (function(){'+html.slice(start,end)+
    ';return cachedStatArt;})()')(Promise,Map);
}
test('a rejected imported hotbar sprite preserves other valid GUI sprites',async()=>{
  const h=hotbarHarness();
  h.window.MineWorldLocalTextures={generation:7,hudIcon:async(kind,fill)=>{
    if(fill==='slot2')throw Error('damaged PNG');
    if(fill==='selected')return 'selection.png';
    if(fill==='slot')return 'slot.png';
    return null;
  }};
  await h.refresh();
  assert.equal(h.styles.get('--mw-pack-hotbar-selected'),'url("selection.png")');
  assert.equal(h.slots[2].style['--mw-pack-slot-bg'],'url("slot.png")');
  assert.equal(h.classes.get('mw-pack-hotbar'),true);
});
test('synchronous pack sprite errors are isolated as well',async()=>{
  const h=hotbarHarness();
  h.window.MineWorldLocalTextures={generation:1,hudIcon(kind,fill){
    if(fill==='background')throw Error('invalid background');
    return fill==='slot0'?'first.png':null;
  }};
  await h.refresh();
  assert.equal(h.slots[0].style['--mw-pack-slot-bg'],'url("first.png")');
  assert.equal(h.slots[1].style['--mw-pack-slot-bg'],'none');
});
test('replacing a pack with the same generation refreshes hotbar and HUD caches',async()=>{
  const h=hotbarHarness();
  const a={generation:4,hudIcon:async()=> 'old.png'};
  const b={generation:4,hudIcon:async()=> 'new.png'};
  h.window.MineWorldLocalTextures=a;
  await h.refresh();
  h.window.MineWorldLocalTextures=b;
  await h.refresh();
  assert.equal(h.styles.get('--mw-pack-hotbar-selected'),'url("new.png")');
  const get=statCache();
  assert.equal(await get(a,'heart','full'),'old.png');
  assert.equal(await get(b,'heart','full'),'new.png');
});
test('late results from a replaced pack never overwrite the current hotbar',async()=>{
  const h=hotbarHarness();
  const waiting=[];
  h.window.MineWorldLocalTextures={generation:5,hudIcon:()=>new Promise(resolve=>waiting.push(resolve))};
  const oldRefresh=h.refresh();
  await Promise.resolve();
  assert.equal(waiting.length,12);
  h.window.MineWorldLocalTextures={generation:5,hudIcon:async(kind,fill)=>fill==='selected'?'fresh.png':null};
  await h.refresh();
  for(const resolve of waiting)resolve('stale.png');
  await oldRefresh;
  assert.equal(h.styles.get('--mw-pack-hotbar-selected'),'url("fresh.png")');
});
