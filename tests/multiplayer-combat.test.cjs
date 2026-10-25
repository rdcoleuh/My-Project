/* MineWorld 6.9 — peer-hosted Java-like melee cooldown regression checks. */
const {test}=require('node:test'),assert=require('node:assert/strict'),
 fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const net=read('multiplayer.js'),html=read('index.html');
function rules(){
 const window={};
 vm.runInNewContext(read('combat-rules.js'),{window,Math,Number,Object});
 const start=net.indexOf('  function allowAttack(');
 const end=net.indexOf('  // A host verifies proximity',start);
 assert.ok(start>0&&end>start,'Host cooldown helpers must remain accessible to tests');
 const script='const attackTimes=new Map();\n'+net.slice(start,end)+
  '\n({allowAttack,serverStrike,attackTimes})';
 return vm.runInNewContext(script,{window,Map,Math,Number,Infinity});
}
test('first host-validated attack is not rejected during the first 420ms of play',()=>{
 const r=rules(),player={id:'guest-a'};
 assert.equal(r.allowAttack(player,100),true);
 assert.equal(r.allowAttack(player,300),false);
 assert.equal(r.allowAttack(player,520),true);
});
test('guest mob attacks use host elapsed timer and Java sword damage, not submitted damage',()=>{
 const r=rules(),p={equipped:'sword',weapon:'iron',damage:999,charge:1};
 const first=r.serverStrike(p,'survival',100,'guest-a');
 assert.equal(first.damage,6);
 assert.equal(r.allowAttack({id:'guest-a'},100),true);
 const early=r.serverStrike(p,'survival',520,'guest-a');
 assert.ok(early.damage<6,'420ms sword swing should not be fully charged');
 assert.equal(r.allowAttack({id:'guest-a'},520),true);
 const full=r.serverStrike(p,'survival',1200,'guest-a');
 assert.equal(full.damage,6);
});
test('axes, diamonds, invalid tiers and authoritative mode are respected',()=>{
 const r=rules();
 assert.equal(r.serverStrike({equipped:'axe',weapon:'diamond'},'survival',100,'a').damage,9);
 assert.equal(r.serverStrike({equipped:'sword',weapon:'netherite'},'survival',100,'b').damage,8);
 assert.equal(r.serverStrike({equipped:'sword',weapon:'unknown'},'survival',100,'c').damage,1);
 assert.equal(r.serverStrike({equipped:'sword',weapon:'netherite',mode:'creative'},'survival',100,'d').damage,8);
 assert.equal(r.serverStrike({equipped:'fist',weapon:'none'},'creative',100,'e').damage,20);
});
test('live guest mob and PvP routes use host strike and validate range before spending cooldown',()=>{
 assert.ok(net.includes('const hit=serverStrike(message.profile,attacker.mode,now,from);'));
 assert.ok(net.includes('const hit=serverStrike(bridge.getCombatProfile(),bridge.getMode(),now,peer.id);'));
 assert.ok(net.includes('Math.min(20,hit.damage)'));
 assert.ok(net.includes('Math.min(11,Math.ceil(hit.damage))'));
 assert.ok(!net.includes('playerProfile('));
 assert.ok(net.indexOf('if(!m||!window.MineWorldCombat.inReach(attacker,m)')<net.indexOf('const hit=serverStrike(message.profile'));
 assert.ok(html.includes("getCombatProfile:()=>({mode:gameMode,equipped,weapon:tools[equipped]||'none'})"));
});

test('host validates three-block melee range for guests and PvP',()=>{
 const reach='window.MineWorldCombat.inReach';
 assert.ok(net.includes('!'+reach+'(attacker,m)'));
 assert.ok(net.includes('!'+reach+'(attacker,target)'));
 assert.ok(net.includes('!'+reach+'(local,target)'));
 assert.ok(!net.includes('distance(attacker,m)>5.3'));
 assert.ok(!net.includes('distance(attacker,target)>5.2'));
});
