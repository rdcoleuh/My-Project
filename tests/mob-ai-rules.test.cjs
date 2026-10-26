/* Combat rules for original delayed creepers and day/night-neutral spiders. */
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const ctx={window:{}};vm.createContext(ctx);vm.runInContext(read('mob-ai-rules.js'),ctx);
const rules=ctx.window.MineWorldMobAIRules;
test('creepers require a complete fuse to explode and disengaging defuses it',()=>{
 let fuse=0;
 for(let i=0;i<14;i++){const out=rules.creeperTick(fuse,.1,true);fuse=out.fuse;assert.equal(out.explode,false);}
 assert.ok(fuse>1.3);
 assert.equal(rules.creeperTick(fuse,.1,true).explode,true);
 assert.ok(rules.creeperTick(1,.1,false).fuse<1);
 assert.equal(rules.creeperTick(0,.1,false).fuse,0);
 assert.equal(rules.creeperTick(0,100,true).explode,false,'background frame must not detonate immediately');
});
test('spiders calm down in daylight, fight in darkness or after provocation',()=>{
 assert.equal(rules.spiderAggressive('spider',false,0),false);
 assert.equal(rules.spiderAggressive('cave_spider',false,0),false);
 assert.equal(rules.spiderAggressive('spider',true,0),true);
 assert.equal(rules.spiderAggressive('spider',false,9),true);
 assert.equal(rules.spiderAggressive('cow',true,9),false);
});
test('creeper blast damage decays with range and is limited to a radius',()=>{
 assert.equal(rules.explosionDamage(0),8);
 assert.equal(rules.explosionDamage(3),0);
 assert.equal(rules.explosionDamage(5),0);
 assert.ok(rules.explosionDamage(.2)>rules.explosionDamage(2.4));
 assert.equal(rules.explosionDamage(NaN),0);
});
test('local steering avoids walls, favors a stable side, and stops in sealed spaces',()=>{
 const straight=rules.steerHeading(0,()=>true,1);
 assert.equal(straight,0);
 const corridor=a=>Math.abs(a)>0.5;
 assert.ok(rules.steerHeading(0,corridor,1)>0,'prefer left turn');
 assert.ok(rules.steerHeading(0,corridor,-1)<0,'prefer right turn');
 assert.equal(rules.steerHeading(0,()=>false,1),null,'sealed cell must not force movement');
 assert.equal(rules.steerHeading(NaN,()=>true),null);
 assert.equal(rules.steerHeading(0,null),null);
});
test('last-seen pursuit expires and does not retain an invalid or infinite target',()=>{
 const seen=rules.pursuitPoint(null,{x:3,y:2,z:5},.05);
 assert.equal(seen.ttl,2);
 assert.equal(seen.x,3);
 let memory=seen;
 for(let i=0;i<21;i++)memory=rules.pursuitPoint(memory,null,.1);
 assert.equal(memory,null,'a lost player cannot be tracked forever');
 assert.equal(rules.pursuitPoint(null,{x:Infinity,y:2,z:5},.1),null);
 assert.equal(rules.pursuitPoint({x:1,y:0,z:0,ttl:-1},null,.1),null);
});
test('hostile attacks require current line of sight even between cached sight scans',()=>{
 const html=read('index.html');
 assert.ok(html.includes('if(chase&&m.attack<=0&&mobHasLineOfSight(m,target))'));
 assert.ok(html.includes('const close=chase&&dist<3'),'creeper fuse remains proximity-triggered');
 assert.ok(html.includes('chase&&dist<.9'),'close-range monsters stop walking through players');
});
test('host simulation uses validated pure mob rules; no changes to survival saves',()=>{
 const html=read('index.html'),sw=read('sw.js');
 for(const name of ['mob-ai-rules.js','mob-pixel-art.js','mob-expansion.js']){
   assert.ok(html.includes('src="./'+name+'"'));
   assert.ok(sw.includes("'./"+name+"'"));
 }
 assert.ok(html.includes('mobAI.creeperTick(m.fuse||0,dt,close)'));
 assert.ok(html.includes('mobAI.explosionDamage(distance)'));
 assert.ok(html.includes('mobAI.spiderAggressive(m.kind,nightTime(),m.anger)'));
 assert.ok(html.includes('mobAI.steerHeading(m.heading,angle=>'));
 assert.ok(html.includes('m.lastSeen=mobAI.pursuitPoint(m.lastSeen,null,dt)'));
 assert.ok(html.includes('const pursuing=aggressive&&!target&&!!m.lastSeen'));
 assert.ok(html.includes('mineworld-selfhost-v1'));
});
