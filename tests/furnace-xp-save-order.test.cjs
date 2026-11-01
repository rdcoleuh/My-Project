/* Regression: collecting furnace output must persist earned XP in the SAME
 * save snapshot as the credited inventory, not one callback later. */
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),ctx=vm.createContext({window:{}});
for(const file of ['furnace-engine.js','furnace-ui.js'])
 vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),ctx,{filename:file});
const furnace=ctx.window.MineWorldFurnace,ui=ctx.window.MineWorldFurnaceUI;
const position={dimension:'overworld',x:42,y:-12,z:43};
function setup(initial=0){
 const engine=furnace.create();
 engine.insert(position,'input','rawIron',3);
 engine.insert(position,'fuel','coal',1);
 assert.equal(engine.tick(30).completed,3);
 let iron=initial,xp=0,refreshes=0;
 const snapshots=[],toasts=[];
 const api={
  count:key=>key==='iron'?iron:0,
  change:(key,delta)=>{
   if(key!=='iron')return 0;
   const next=Math.max(0,Math.min(65535,iron+delta));
   const actual=next-iron;iron=next;return actual;
  },
  gainExperience:points=>{xp+=points;},
  onChange:()=>snapshots.push({iron,xp,output:engine.get(position)?.output?.qty||0}),
  toast:message=>toasts.push(message)
 };
 const collect=limit=>ui.transfers.commitTransfer(api,
  ()=>ui.transfers.withdraw(engine,api,position,'output',limit),
  result=>!!result?.moved,()=>{refreshes++;},
  result=>ui.awardCollectedOutput(api,'output','iron',result));
 return {engine,api,collect,snapshots,toasts,get iron(){return iron;},
  get xp(){return xp;},get refreshes(){return refreshes;}};
}
test('first saved snapshot contains both collected item and its experience',()=>{
 const game=setup();
 assert.equal(game.collect(1).moved,1);
 assert.deepEqual(game.snapshots,[{iron:1,xp:1,output:2}]);
 assert.equal(game.refreshes,1);
 assert.equal(game.collect(64).moved,2);
 assert.deepEqual(game.snapshots[1],{iron:3,xp:3,output:0});
 assert.equal(game.xp,3);
});
test('a full inventory does not earn XP or write an unchanged snapshot',()=>{
 const game=setup(65535);
 const result=game.collect(64);
 assert.equal(result.full,true);
 assert.equal(result.moved,0);
 assert.equal(game.xp,0);
 assert.equal(game.snapshots.length,0);
 assert.equal(game.engine.get(position).output.qty,3);
});
test('a reward callback failure cannot suppress saving a completed transfer',()=>{
 const game=setup();
 const result=ui.transfers.commitTransfer(game.api,
  ()=>ui.transfers.withdraw(game.engine,game.api,position,'output',1),
  value=>!!value?.moved,()=>{},
  ()=>{throw Error('interrupted XP adapter');});
 assert.equal(result.moved,1);
 assert.deepEqual(game.snapshots,[{iron:1,xp:0,output:2}]);
 assert.match(game.toasts[0],/reward interrupted/);
});
test('live furnace output buttons award XP before the persistence callback',()=>{
 const source=fs.readFileSync(path.join(root,'furnace-ui.js'),'utf8');
 assert.match(source,/value=>!!value\?\.moved,render,\s*result=>awardCollectedOutput\(api,which,outputKey,result\)/);
 const callback=source.indexOf('if(typeof beforeSave');
 const persisted=source.indexOf('api.onChange();refresh();',callback);
 assert.ok(callback>=0&&persisted>callback,'reward must precede save');
});
