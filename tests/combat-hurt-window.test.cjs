/* Synthetic Java-inspired hit-resistance regression tests. */
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const read=name=>fs.readFileSync(path.join(__dirname,'..',name),'utf8');
const window={};vm.runInNewContext(read('combat-rules.js'),{window,Math,Number,Object});
const c=window.MineWorldCombat;
test('hurt window suppresses rapid weak hits without cancelling stronger hits',()=>{
 const first=c.hurtWindow({damage:6});
 assert.equal(first.applied,6);assert.equal(first.stored,6);assert.equal(first.resistant,false);
 const weaker=c.hurtWindow({damage:3,previousDamage:first.stored,elapsedMs:100});
 assert.equal(weaker.applied,0);assert.equal(weaker.stored,6);
 const stronger=c.hurtWindow({damage:8,previousDamage:6,elapsedMs:120});
 assert.equal(stronger.applied,2);assert.equal(stronger.stored,8);
 const expired=c.hurtWindow({damage:3,previousDamage:8,elapsedMs:500});
 assert.equal(expired.applied,3);assert.equal(expired.stored,3);
});
test('bad or malicious damage inputs remain bounded',()=>{
 const negative=c.hurtWindow({damage:-999,elapsedMs:-1});
 const huge=c.hurtWindow({damage:999,previousDamage:999,elapsedMs:1});
 assert.equal(negative.applied,0);
 assert.equal(huge.applied,0);assert.equal(huge.stored,20);
 assert.equal(c.hurtWindow({damage:5,elapsedMs:Infinity}).applied,5);
});
test('live creature hits use hurt resistance, consume swing on resisted hits, and do not mutate saves',()=>{
 const html=read('index.html'),sw=read('sw.js');
 assert.match(html,/MineWorldCombat\.hurtWindow/);
 assert.match(html,/m\.lastHitAt=now;m\.lastHitDamage=recent\.stored/);
 assert.match(html,/if\(!result\.hit\)\{lastAttackAt=now;attackCooldown=\.12;return;\}/);
 assert.match(sw,/'\.\/combat-rules\.js'/);
 assert.doesNotMatch(read('combat-rules.js'),/localStorage|\.jar/);
});
