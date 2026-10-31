/* Regression: migration preview must retain the backpack and equipment, not only slot stacks. */
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const ctx=vm.createContext({window:{}});
vm.runInContext(fs.readFileSync(path.join(__dirname,'..','world-depth.js'),'utf8'),ctx);
const plan=ctx.window.MineWorldWorldDepth.planLegacySaveMigration;
const base={version:13,worldSize:8,edits:[],netherEdits:[],endEdits:[]};
const preview=save=>plan({...base,...save},{width:8,depth:8}).playerItems;
const plain=value=>JSON.parse(JSON.stringify(value));
test('backpack counters, tools, armor and XP survive in detached frozen preflight',()=>{
 const bag={rawIron:7,coal:13,'mod:ore/cobalt':2,experience:120000};
 const tools={pickaxe:'diamond',sword:'iron',hoe:'none',axe:'wood',shovel:'stone'};
 const armor={head:'ironHelmet',chest:'',legs:'',feet:'diamondBoots'};
 const save={bag,tools,armor,experienceTotal:73},before=plain(save);
 const result=preview(save);
 assert.deepEqual(plain(result.bag),bag);
 assert.deepEqual(plain(result.tools),tools);
 assert.deepEqual(plain(result.armor),armor);
 assert.equal(result.experienceTotal,73);
 for(const field of ['bag','tools','armor'])assert.equal(Object.isFrozen(result[field]),true);
 bag.rawIron=99;tools.pickaxe='wood';armor.head='';
 assert.equal(result.bag.rawIron,7);
 assert.equal(result.tools.pickaxe,'diamond');
 assert.equal(result.armor.head,'ironHelmet');
 assert.deepEqual(before,{bag:{rawIron:7,coal:13,'mod:ore/cobalt':2,experience:120000},
  tools:{pickaxe:'diamond',sword:'iron',hoe:'none',axe:'wood',shovel:'stone'},
  armor:{head:'ironHelmet',chest:'',legs:'',feet:'diamondBoots'},experienceTotal:73});
});
test('legacy saves without optional backpack or equipment fields remain previewable',()=>{
 const result=preview({});
 for(const field of ['bag','tools','armor','experienceTotal'])assert.equal(result[field],null);
});
test('a large valid recipe backpack is preserved rather than truncated at 128 keys',()=>{
 const bag={};for(let i=0;i<200;i++)bag['item'+i]=i;
 const result=preview({bag});
 assert.equal(Object.keys(result.bag).length,200);
 assert.equal(result.bag.item199,199);
});
test('invalid, oversized and accessor-backed backpack counters fail closed',()=>{
 const getter={rawIron:3};
 Object.defineProperty(getter,'coal',{enumerable:true,get(){throw Error('getter executed');}});
 const huge={};for(let i=0;i<513;i++)huge['item'+i]=1;
 for(const bag of [{rawIron:-1},{rawIron:1.5},{rawIron:65536},
   {'__proto__':0,rawIron:Infinity},{'mod:ore//bad':2},[1,2],getter,huge]){
  assert.throws(()=>preview({bag}),/Invalid saved backpack/);
 }
});
test('invalid tool and armor metadata cannot silently erase equipment',()=>{
 for(const tools of [{pickaxe:17},{pickaxe:'../../evil'},{unknown:'diamond'},['diamond']])
  assert.throws(()=>preview({tools}),/Invalid saved tools/);
 for(const armor of [{head:42},{head:'block:0'},{unknown:'ironHelmet'},['ironHelmet']])
  assert.throws(()=>preview({armor}),/Invalid saved armor/);
});
test('invalid XP fails preflight without modifying the original save',()=>{
 for(const experienceTotal of [-1,1.5,Infinity,'70',2000001]){
  const save={...base,bag:{rawIron:2},experienceTotal};
  const before=plain(save);
  assert.throws(()=>preview(save),/Invalid saved experience total/);
  assert.deepEqual(save,before);
 }
});
