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
test('host simulation uses validated pure mob rules; no changes to survival saves',()=>{
 const html=read('index.html'),sw=read('sw.js');
 for(const name of ['mob-ai-rules.js','mob-pixel-art.js','mob-expansion.js']){
   assert.ok(html.includes('src="./'+name+'"'));
   assert.ok(sw.includes("'./"+name+"'"));
 }
 assert.ok(html.includes('mobAI.creeperTick(m.fuse||0,dt,close)'));
 assert.ok(html.includes('mobAI.explosionDamage(distance)'));
 assert.ok(html.includes('mobAI.spiderAggressive(m.kind,nightTime(),m.anger)'));
 assert.ok(html.includes('mineworld-selfhost-v1'));
});
