/* Regression: even a sub-second furnace burn must be included in the next autosave. */
'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const start=html.indexOf('const furnaceDt=clamp(frameMs/1000,0,60);');
const end=html.indexOf('furnaceUI.tick(furnaceDt);',start);
assert.ok(start>=0&&end>start,'furnace render-loop logic exists');
const snippet=html.slice(start,end+'furnaceUI.tick(furnaceDt);'.length);
function run(frameMs,changed){
 const events=[];
 vm.runInNewContext(snippet,{
  frameMs,clamp:(n,min,max)=>Math.max(min,Math.min(max,n)),
  furnaces:{tick:dt=>{events.push(['tick',dt]);return {changed};}},
  markSave:()=>events.push(['dirty']),
  furnaceUI:{tick:dt=>events.push(['ui',dt])}
 });
 return events;
}
test('one 200ms furnace change marks the save dirty immediately',()=>{
 assert.deepEqual(run(200,true),[['tick',.2],['dirty'],['ui',.2]]);
});
test('one 1ms burn change is not lost to a one-second accumulator',()=>{
 assert.deepEqual(run(1,true),[['tick',.001],['dirty'],['ui',.001]]);
});
test('unchanged furnace state does not trigger unnecessary autosaves',()=>{
 assert.deepEqual(run(200,false),[['tick',.2],['ui',.2]]);
});
test('suspended frames remain capped at 60 seconds and still mark dirty',()=>{
 assert.deepEqual(run(3600000,true),[['tick',60],['dirty'],['ui',60]]);
});
test('dirty flag is decoupled from periodic localStorage writes',()=>{
 assert.doesNotMatch(html,/furnaceSaveClock/);
 assert.match(html,/saveTimer\+=dt;if\(saveTimer>8\)\{saveTimer=0;if\(dirtySave\)save\(\)\}/);
 assert.match(html,/function markSave\(\)\{dirtySave=true\}/);
});
