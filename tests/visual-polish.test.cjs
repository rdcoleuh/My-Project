/* Presentation regression tests for MineWorld 6.37, using a fake DOM and
   a local, in-memory storage stub. Never opens or modifies world saves. */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const source=read('visual-polish.js'),css=read('visual-polish.css');
function boot(seed){
 const saved=new Map(seed?Object.entries(seed):[]);
 const classes=new Set();
 const ctx={
   localStorage:{getItem:k=>saved.get(k)||null,setItem:(k,v)=>saved.set(k,v)},
   document:{
     documentElement:{classList:{toggle:(name,on)=>on?classes.add(name):classes.delete(name)}},
     querySelectorAll:()=>[]
   },
   window:{}
 };
 vm.runInNewContext(source,ctx,{filename:'visual-polish.js'});
 return {prefs:ctx.window.MineWorldVisualPolish,classes,saved};
}
test('polish files are loaded, versioned, and cached by the worker',()=>{
 const html=read('index.html'),sw=read('sw.js');
 assert.match(html,/href="\.\/visual-polish\.css"/);
 assert.match(html,/src="\.\/visual-polish\.js"/);
 assert.match(sw,/visual-polish\.css/);
 assert.match(sw,/visual-polish\.js/);
 assert.match(sw,/mineworld-6-37/);
 assert.match(html,/MineWorld 6\.37/);
});
test('clean scaling is default; imported sprites and tiles retain nearest filtering',()=>{
 const x=boot();
 assert.equal(x.prefs.get().cleanScaling,true);
 assert.equal(x.classes.has('mw-retro-screen'),false);
 assert.match(css,/#world\s*\{image-rendering:auto\}/);
 assert.match(css,/html\.mw-retro-screen #world\{image-rendering:pixelated\}/);
 const game=read('index.html');
 assert.match(game,/antialias: false/);
 assert.match(read('texture-smoothing.js'),/g\.NEAREST/);
 assert.match(read('texture-atlas.js'),/gl\.NEAREST/);
});
test('retro screen and quiet HUD preferences are reversible and persist across reloads',()=>{
 const x=boot();
 x.prefs.setCleanScaling(false);
 x.prefs.setFocusHud(true);
 assert.equal(x.classes.has('mw-retro-screen'),true);
 assert.equal(x.classes.has('mw-quiet-hud'),true);
 assert.match(css,/html\.mw-quiet-hud #coord-readout/);
 const y=boot(Object.fromEntries(x.saved));
 assert.equal(y.prefs.get().cleanScaling,false);
 assert.equal(y.prefs.get().focusHud,true);
 y.prefs.setCleanScaling(true);y.prefs.setFocusHud(false);
 assert.equal(y.classes.has('mw-retro-screen'),false);
 assert.equal(y.classes.has('mw-quiet-hud'),false);
});
test('corrupt preferences fall back safely and world save keys are untouched',()=>{
 const x=boot({'mineworld-visual-polish-v1':'{bad json'});
 assert.equal(x.prefs.get().cleanScaling,true);
 assert.equal(x.prefs.get().focusHud,false);
 assert.equal(x.saved.size,1);
 assert.doesNotMatch(source,/mineworld-selfhost-v1/);
 assert.doesNotMatch(source,/removeItem/);
});
