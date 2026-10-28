/* Regression: water-bound swimming must steer around banks and avoid ground teleportation. */
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const read=name=>fs.readFileSync(path.join(__dirname,'..',name),'utf8');
const ctx={window:{}};vm.createContext(ctx);
vm.runInContext(read('mob-ai-rules.js'),ctx);
const rules=ctx.window.MineWorldMobAIRules;

test('bounded steering finds a wet corridor rather than pushing into a dry bank',()=>{
  // Heading east encounters land; water remains to the north. Each candidate
  // checks the same water-column and collision constraints as the host game.
  const isWet=(angle)=>Math.sin(angle)>.6;
  const north=rules.steerHeading(0,isWet,1);
  assert.ok(north>0&&Math.sin(north)>.6,'aquatic mob turns into water');
  const south=rules.steerHeading(0,angle=>Math.sin(angle)<-.6,-1);
  assert.ok(south<0,'alternate stable steering preference');
  assert.equal(rules.steerHeading(0,()=>false,1),null,'sealed water cell stops movement');
});

test('host movement uses water-aware steering, safe knockback and hitbox checks',()=>{
  const html=read('index.html');
  assert.match(html,/const aquaticMob=!!extraMobs\?\.isAquatic\(m\.kind\)/);
  assert.match(html,/const swimSteered=\(swimming&&pace>\.0001\)\?mobAI\.steerHeading/);
  assert.match(html,/const steered=swimming\?swimSteered:/);
  assert.match(html,/get\(Math\.floor\(tx\),Math\.floor\(m\.y\),Math\.floor\(tz\)\)===7&&\s*collisionFree\(tx,m\.y,tz,m\.kind/);
  assert.match(html,/if\(aquaticMob\)\{\s*\/\/ Knockback must not teleport fish/);
  assert.match(html,/if\(canSwim&&collisionFree\(nx,m\.y,nz,m\.kind/);
  assert.ok(html.includes('m.y=Math.max(1,level+.2+Math.sin(dayClock*1.5+m.id)*.12)'),
    'preserve existing low-cost swim bobbing');
  assert.ok(read('sw.js').includes('mineworld-6-78-aquatic-steering-165'),
    'returning players must receive the corrected movement code');
  assert.ok(html.includes('mineworld-selfhost-v1'),'existing save key must remain intact');
});
