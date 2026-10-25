/* MineWorld 6.8 independently authored Java-style combat regression checks. */
const {test}=require('node:test'),assert=require('node:assert/strict'),
 fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
function combat(){
 const window={};vm.runInNewContext(read('combat-rules.js'),{window,Math,Number,Object});
 return window.MineWorldCombat;
}
test('Java-like melee damage increases with tool tier and charged swing',()=>{
 const c=combat();
 assert.equal(c.stats('sword','wood').damage,4);
 assert.equal(c.stats('sword','iron').damage,6);
 assert.equal(c.stats('sword','netherite').damage,8);
 assert.equal(c.stats('axe','netherite').damage,10);
 assert.equal(c.stats('pickaxe','none').damage,1);
 const weak=c.strike({weapon:'sword',tier:'iron',elapsedMs:80});
 const full=c.strike({weapon:'sword',tier:'iron',elapsedMs:900});
 assert.ok(weak.damage<full.damage);
 assert.equal(full.damage,6);
 assert.ok(weak.charge<.5);
});
test('critical hits require charged airborne fall without sprint',()=>{
 const c=combat(),opts={weapon:'sword',tier:'diamond',elapsedMs:1000,falling:true,grounded:false,sprinting:false};
 const critical=c.strike(opts);
 assert.equal(critical.critical,true);
 assert.equal(critical.damage,10.5);
 assert.equal(c.strike({...opts,grounded:true}).critical,false);
 assert.equal(c.strike({...opts,sprinting:true}).critical,false);
 assert.equal(c.strike({...opts,elapsedMs:100}).critical,false);
});
test('sword sweep and sprint knockback depend on movement and recharge',()=>{
 const c=combat();
 assert.equal(c.strike({weapon:'sword',tier:'iron',elapsedMs:900,grounded:true}).sweep,true);
 assert.equal(c.strike({weapon:'axe',tier:'iron',elapsedMs:900,grounded:true}).sweep,false);
 assert.equal(c.strike({weapon:'sword',tier:'iron',elapsedMs:900,grounded:true,sprinting:true}).sweep,false);
 assert.ok(c.strike({weapon:'sword',tier:'iron',elapsedMs:900,sprinting:true}).knockback>
           c.strike({weapon:'sword',tier:'iron',elapsedMs:900,sprinting:false}).knockback);
 const k=c.knockback(Math.PI/2,2);
 assert.ok(Math.abs(k.x-2)<1e-8);
 assert.ok(Math.abs(k.z)<1e-8);
});
test('new combat module is loaded before gameplay and preserves existing world saves',()=>{
 const html=read('index.html'),sw=read('sw.js');
 assert.ok(html.includes('src="./combat-rules.js"'));
 assert.ok(html.indexOf('src="./combat-rules.js"')<html.indexOf('function attackMob(m)'));
 assert.ok(sw.includes("'./combat-rules.js'"));
 for(const token of ['MineWorldCombat.strike','MineWorldCombat.knockback','hit.sweep','hit.critical','lastAttackAt=now'])
  assert.ok(html.includes(token),'Missing combat integration '+token);
 for(const token of ["worldLibrary.key(mode,'original')","mineworld-selfhost-v1"])
  assert.ok(html.includes(token),'Save key changed '+token);
});
