'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');

function node(){
  const element={
    dataset:{},children:[],isConnected:true,classList:{toggle(){},add(){}},
    setAttribute(name,value){this[name]=value;},
    appendChild(child){child.isConnected=true;this.children.push(child);return child;},
    replaceChildren(...children){
      for(const old of this.children)old.isConnected=false;
      this.children=children;
      for(const child of children)child.isConnected=true;
    }
  };
  return element;
}
function harness(){
  const start=html.indexOf('let statArtGeneration=-1;');
  const end=html.indexOf('function setGameMode(next){',start);
  assert.ok(start>=0&&end>start,'HUD update must be integrated');
  const elements=new Map(['survival-hud','health-text','hunger-text','eat-btn','weapon-readout'].map(id=>[id,node()]));
  const window={MineWorldLocalTextures:null,MineWorldHudArt:{
    points:value=>Math.max(0,Math.min(20,Math.floor(value))),
    slots:value=>Array.from({length:10},(_,i)=>value>=2*i+2?'full':value===2*i+1?'half':'empty'),
    description:(kind,value)=>kind+': '+value+' of 20',
    paint:()=>null
  }};
  const update=new Function('window','document','$','updateExperienceHUD','gameMode',
    'health','hunger','hungerSaturation','hungerDrain','bag','inventory','equipped','tools',
    'Promise','Map','return (function(){'+html.slice(start,end)+';return updateSurvivalHUD;})()')(
    window,{createElement:()=>node()},id=>elements.get(id),()=>{},'survival',
    19,1,0,0,{},Array(30).fill(0),'none',{none:'none'},Promise,Map);
  return {window,elements,update};
}
const settle=()=>new Promise(resolve=>setImmediate(resolve));
test('same-generation pack replacement repaints all twenty unchanged HUD icons',async()=>{
  const h=harness();
  const pack=id=>({generation:3,hudIcon:async(kind,fill)=>id+':'+kind+':'+fill});
  const first=pack('old'),second=pack('new');
  h.window.MineWorldLocalTextures=first;
  h.update();await settle();
  assert.equal(h.elements.get('health-text').children.length,10);
  assert.equal(h.elements.get('hunger-text').children.length,10);
  assert.equal(h.elements.get('health-text').children[0].children[0].src,'old:heart:full');
  h.window.MineWorldLocalTextures=second;
  h.update();await settle();
  assert.equal(h.elements.get('health-text').children[0].children[0].src,'new:heart:full');
  assert.equal(h.elements.get('hunger-text').children[0].children[0].src,'new:food:half');
  assert.equal(h.elements.get('health-text')['aria-label'],'Health: 19 of 20');
  assert.equal(h.elements.get('hunger-text')['aria-label'],'Hunger: 1 of 20');
});
test('late artwork from a replaced pack cannot overwrite the new HUD',async()=>{
  const h=harness(),waiting=[];
  h.window.MineWorldLocalTextures={generation:5,hudIcon:()=>new Promise(resolve=>waiting.push(resolve))};
  h.update();await settle();
  const stale=h.elements.get('health-text').children[0];
  h.window.MineWorldLocalTextures={generation:5,hudIcon:async()=> 'current.png'};
  h.update();await settle();
  assert.equal(stale.isConnected,false);
  for(const resolve of waiting)resolve('stale.png');
  await settle();
  assert.equal(h.elements.get('health-text').children[0].children[0].src,'current.png');
  assert.equal(h.elements.get('hunger-text').children[0].children[0].src,'current.png');
});
test('repeated HUD updates with unchanged pack and stats reuse DOM nodes',async()=>{
  const h=harness();let calls=0;
  h.window.MineWorldLocalTextures={generation:2,hudIcon:async()=>{calls++;return 'icon.png';}};
  h.update();await settle();
  const first=h.elements.get('health-text').children[0],initialCalls=calls;
  h.update();await settle();
  assert.equal(h.elements.get('health-text').children[0],first);
  assert.equal(calls,initialCalls);
});
