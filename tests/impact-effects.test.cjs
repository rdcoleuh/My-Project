/* MineWorld visual combat and block impact effects; no copyrighted assets. */
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
function boot(){
 const context={window:{},Math};
 vm.runInNewContext(read('impact-effects.js'),context,{filename:'impact-effects.js'});
 return context.window.MineWorldImpactEffects;
}
test('block impacts generate bounded textured fragments using live atlas UV',()=>{
 const fx=boot();
 assert.equal(fx.dust(0,0,0,3,18),18);
 const data=fx.geometry({x:2,y:2,z:2},(b,face,corner)=>corner===0?[.02,.04]:[.07,.09]);
 assert.equal(data.textured.length,18*6*8);
 assert.equal(data.plain.length,0);
 assert.ok(data.textured.every(Number.isFinite));
 assert.ok(data.textured.some((v,i)=>i%8===6&&v>=.02&&v<=.07));
 assert.equal(fx.dust(0,0,0,999,20),0);
});
test('hit flashes and critical-hit star particles expire without modifying saved data',()=>{
 const fx=boot();
 fx.hit(42,0,1,0,{critical:true,dead:true});
 assert.ok(fx.flash(42)>0);
 const geometry=fx.geometry({x:0,y:2,z:3},()=>[0,0]);
 assert.ok(geometry.plain.length>0);
 assert.ok(fx.stats().particles>20);
 for(let i=0;i<20;i++)fx.tick(.1);
 assert.equal(fx.flash(42),0);
 assert.equal(fx.stats().particles,0);
});
test('sweeps and pickup sparkles are local ephemeral geometry',()=>{
 const fx=boot();
 assert.equal(fx.sweep(0,1,0,Math.PI),10);
 assert.equal(fx.pickup(0,1,0),7);
 assert.ok(fx.geometry({x:1,y:2,z:2},()=>[0,0]).plain.length>0);
 fx.reset();assert.equal(fx.stats().particles,0);
});
test('particle count caps and dimensional culling preserve mobile performance',()=>{
 const fx=boot();
 for(let i=0;i<50;i++)fx.dust(i,0,0,3,30,'nether');
 assert.ok(fx.stats().particles<=240);
 assert.equal(fx.geometry({x:0,y:1,z:0},()=>[0,0],'overworld').textured.length,0);
});
test('effects have no new save keys, avoid asset bundling, and are loaded offline',()=>{
 const html=read('index.html'),sw=read('sw.js'),src=read('impact-effects.js');
 assert.match(html,/src="\.\/impact-effects\.js"/);
 assert.match(html,/drawImpactEffects\(eye\)/);
 assert.match(html,/MineWorldImpactEffects\?\.dust/);
 assert.match(html,/MineWorldImpactEffects\?\.hit/);
 assert.match(sw,/impact-effects\.js/);
 assert.match(sw,/mineworld-6-38/);
 assert.doesNotMatch(src,/localStorage|fetch\(|XMLHttpRequest|\.png|\.ogg/);
 assert.match(html,/mineworld-selfhost-v1/);
});
