/* MineWorld sharp output and local quality/HUD choices. */
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
function boot(seed){
 const store=new Map(Object.entries(seed||{})),classes=new Set(),canvas={style:{}};
 const ctx={window:{},localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},
   document:{documentElement:{classList:{toggle:(x,on)=>on?classes.add(x):classes.delete(x)}},
     getElementById:()=>canvas,querySelectorAll:()=>[]}};
 vm.runInNewContext(read('visual-polish.js'),ctx);
 return {api:ctx.window.MineWorldVisualPolish,store,classes,canvas};
}
test('default sharp high resolution uses pixelated CSS, never browser blur',()=>{
 const x=boot();
 assert.equal(x.api.get().cleanScaling,true);
 assert.equal(x.canvas.style.imageRendering,'pixelated');
 assert.match(read('visual-polish.css'),/#world\{image-rendering:pixelated\}/);
 assert.doesNotMatch(read('visual-polish.css'),/#world\{image-rendering:auto\}/);
 assert.match(read('index.html'),/antialias: false/);
});
test('old cleanScaling and quiet HUD preferences migrate without fuzzy output',()=>{
 const x=boot({'mineworld-visual-polish-v1':JSON.stringify({cleanScaling:true,focusHud:true})});
 assert.equal(x.api.get().cleanScaling,true);
 assert.equal(x.api.get().focusHud,true);
 assert.equal(x.canvas.style.imageRendering,'pixelated');
 x.api.setCleanScaling(false);
 assert.equal(x.canvas.style.imageRendering,'pixelated');
 const next=boot(Object.fromEntries(x.store));
 assert.equal(next.api.get().cleanScaling,false);
 next.api.setCleanScaling(true);
 assert.equal(next.canvas.style.imageRendering,'pixelated');
});
test('quiet HUD setting and bad storage never alter original worlds',()=>{
 const x=boot({'mineworld-visual-polish-v2':'{bad'});
 assert.equal(x.api.get().cleanScaling,true);
 x.api.setFocusHud(true);
 assert.equal(x.classes.has('mw-quiet-hud'),true);
 assert.doesNotMatch(read('visual-polish.js'),/mineworld-selfhost-v1|removeItem/);
 assert.match(read('sw.js'),/mineworld-6-[0-9]+/);
 assert.match(read('index.html'),/MineWorld 6\.[0-9]+/);
});