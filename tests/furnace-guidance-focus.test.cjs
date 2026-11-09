/* Furnace UI guidance, focus containment, and safe progress redraw. */
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const uiSource=fs.readFileSync(path.join(root,'furnace-ui.js'),'utf8');
const ctx=vm.createContext({window:{}});
for(const file of ['furnace-engine.js','furnace-ui.js'])
 vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),ctx);
const engine=ctx.window.MineWorldFurnace;
const {furnaceWorkState,containFurnaceTab}=ctx.window.MineWorldFurnaceUI;
const p={dimension:'overworld',x:62,y:-30,z:63};

test('empty, loaded, and burning furnace displays actionable state',()=>{
 const f=engine.create();f.ensure(p);
 assert.match(furnaceWorkState(f.get(p)),/Add an ingredient/);
 f.insert(p,'input','rawIron',1);
 assert.match(furnaceWorkState(f.get(p)),/Add usable fuel/);
 f.insert(p,'fuel','coal',1);
 assert.match(furnaceWorkState(f.get(p)),/Smelting iron.*10 seconds/);
 f.tick(2);
 assert.match(furnaceWorkState(f.get(p)),/Smelting iron.*8 seconds/);
});
test('blocked outputs report the stall without consuming fuel',()=>{
 const f=engine.create();f.insert(p,'input','rawIron',2);f.insert(p,'fuel','coal',1);
 f.get(p).output={key:'gold',qty:1};
 assert.match(furnaceWorkState(f.get(p)),/Output blocked/);
 assert.equal(f.tick(10).completed,0);
 f.get(p).output={key:'iron',qty:64};
 assert.match(furnaceWorkState(f.get(p)),/Output blocked/);
 assert.equal(f.tick(10).completed,0);
});
test('specialized furnace and malformed restored fuel explain their blockers',()=>{
 const f=engine.create();f.ensure(p,'smoker');
 f.restore([{...p,kind:'smoker',input:{key:'rawIron',qty:1},fuel:{key:'coal',qty:1}}]);
 assert.match(furnaceWorkState(f.get(p)),/cannot be smelted here/);
 f.restore([{...p,input:{key:'rawIron',qty:1},fuel:{key:'lavaBucket',qty:2}}]);
 assert.match(furnaceWorkState(f.get(p)),/excess lava buckets/);
 assert.equal(f.tick(10).completed,0);
});
test('forward and reverse Tab wrap within enabled furnace controls',()=>{
 let focused=null,prevented=0;
 const nodes=Array.from({length:3},(_,i)=>({hidden:false,focus(){focused=i}}));
 const panel={querySelectorAll(){return nodes},contains(node){return nodes.includes(node)}};
 const e=shiftKey=>({key:'Tab',shiftKey,preventDefault(){prevented++}});
 assert.equal(containFurnaceTab(e(false),panel,nodes[2]),true);
 assert.equal(focused,0);
 assert.equal(containFurnaceTab(e(true),panel,nodes[0]),true);
 assert.equal(focused,2);
 assert.equal(prevented,2);
 assert.equal(containFurnaceTab(e(false),panel,nodes[1]),false);
 assert.equal(prevented,2);
});
test('focus reenters a dialog if a background element becomes active',()=>{
 let focused='',prevented=0;
 const first={hidden:false,focus(){focused='first'}};
 const last={hidden:false,focus(){focused='last'}};
 const panel={querySelectorAll(){return [first,last]},contains(n){return n===first||n===last}};
 const e=shiftKey=>({code:'Tab',shiftKey,preventDefault(){prevented++}});
 assert.equal(containFurnaceTab(e(false),panel,{}),true);
 assert.equal(focused,'first');
 assert.equal(containFurnaceTab(e(true),panel,{}),true);
 assert.equal(focused,'last');
 assert.equal(prevented,2);
 assert.equal(containFurnaceTab({key:'Enter'},panel,first),false);
 assert.equal(containFurnaceTab(e(false),null,first),false);
});
test('visible hint is not a noisy live region and refresh timer rejects invalid deltas',()=>{
 assert.match(uiSource,/id="mw-furnace-hint" aria-live="off"/);
 assert.match(uiSource,/textContent=furnaceWorkState\(m\)/);
 assert.match(uiSource,/containFurnaceTab\(e,panel,document\.activeElement\)/);
 assert.match(uiSource,/typeof dt!=='number'\|\|!Number\.isFinite\(dt\)\|\|dt<=0/);
 assert.match(uiSource,/drawClock%=\.25/);
 assert.match(uiSource,/announceState=null;drawClock=0/);
});

test('guidance tolerates older furnace API without slotCapacity',()=>{
 const f=engine.create();
 f.restore([{...p,kind:'furnace',input:{key:'rawIron',qty:1},fuel:{key:'coal',qty:1}}]);
 const original=engine.slotCapacity;
 try {
  engine.slotCapacity=undefined;
  assert.match(furnaceWorkState(f.get(p)),/Smelting iron/);
 } finally {engine.slotCapacity=original;}
});

test('deposit tolerates older furnace API without slotCapacity and conserves inventory',()=>{
 const position={dimension:'overworld',x:4,y:0,z:7};
 let owned=3,slot=null;
 const adapter={count(){return owned},change(_key,delta){owned+=delta;return delta}};
 const station={get(){return {input:slot}},insert(_p,_which,key,qty){slot={key,qty};return qty}};
 const original=engine.slotCapacity;
 try{
  engine.slotCapacity=undefined;
  const moved=ctx.window.MineWorldFurnaceUI.transfers.deposit(station,adapter,position,'input','rawIron',2);
  assert.equal(moved,2);
  assert.equal(owned,1);
  assert.equal(slot.qty,2);
 }finally{engine.slotCapacity=original;}
});

// The modal redraw must not crash when the optional capacity helper is absent.
test('modal render guards optional furnace slotCapacity like deposits do',()=>{
 const guarded=/const capacity=typeof window\.MineWorldFurnace\?\.slotCapacity==='function'\s*\?window\.MineWorldFurnace\.slotCapacity\(which,selected\):64;/;
 assert.match(uiSource,guarded);
 assert.doesNotMatch(uiSource,/const capacity=window\.MineWorldFurnace\.slotCapacity\(which,selected\);/);
});
