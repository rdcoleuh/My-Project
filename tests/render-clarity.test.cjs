/* Framebuffer sizing must not soften Minecraft-like pixels on tall mobile screens. */
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const ctx={window:{}};vm.runInNewContext(read('render-clarity.js'),ctx);
const render=ctx.window.MineWorldRenderClarity.framebuffer;
test('portrait high-density phone uses >1300 actual framebuffer pixels',()=>{
 const a=render(390,844,3,2.2,true,true);
 assert.ok(a.width>=780,JSON.stringify(a));
 assert.ok(a.height>=1688,JSON.stringify(a));
 assert.ok(Math.abs(a.width/a.height-390/844)<.002);
});
test('desktop uses native density within render budget',()=>{
 const a=render(1280,720,2,2.35,false,true);
 assert.equal(a.width,2560);assert.equal(a.height,1440);
 const b=render(2560,1440,3,2.8,false,true);
 assert.ok(b.width*b.height<=6210000);
 assert.ok(b.width<=3200&&b.height<=2600);
});
test('faster mode is a crisp 1x canvas; invalid inputs stay bounded',()=>{
 const a=render(390,844,3,2.2,true,false);
 assert.equal(a.width,390);assert.equal(a.height,844);
 const b=render(NaN,Infinity,NaN,-6,true,true);
 assert.ok(b.width>=1&&b.height>=1);
});
test('game, worker and atlas all use new clarity module',()=>{
 const html=read('index.html');
 assert.match(html,/MineWorldRenderClarity\.framebuffer/);
 assert.match(html,/src="\.\/render-clarity\.js"/);
 assert.match(read('sw.js'),/render-clarity\.js/);
 assert.doesNotMatch(html,/Math\.min\(Math\.round\(h\*dpr\),1300\)/);
 assert.match(html,/getShaderPrecisionFormat/);
 assert.match(html,/mineworld-selfhost-v1/);
});