const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
function art(){const ctx={window:{}};vm.runInNewContext(read('classic-hud-art.js'),ctx);return ctx.window.MineWorldHudArt;}
test('original pixel art provides 10 full half and empty hearts/food, each 11x11 RGBA',()=>{
 const a=art();for(const kind of ['heart','food'])for(const fill of ['full','half','empty']){
  const data=a.pixels(kind,fill);assert.equal(data.length,11*11*4);
  assert.ok([...data].some(x=>x>0));
 }
});
test('half icons color only left half and preserve dark right side',()=>{
 const a=art();for(const kind of ['heart','food']){
  const full=a.pixels(kind,'full'),half=a.pixels(kind,'half'),empty=a.pixels(kind,'empty');
  let left=0,right=0;
  for(let y=0;y<11;y++)for(let x=0;x<11;x++){
   const p=(y*11+x)*4;
   if(x<5){if(full[p]!==empty[p]&&half[p]===full[p])left++;}
   else if(full[p]!==empty[p]&&half[p]===empty[p])right++;
  }
  assert.ok(left>0,kind+' left colored');assert.ok(right>0,kind+' right empty');
 }
});
test('hotbar imports are sharp, selected remains visible without imported selection art',()=>{
 const s=read('index.html'),sw=read('sw.js');
 assert.ok(s.includes('active:not(.mw-pack-selected)'));
 assert.ok(s.includes("button.setAttribute('aria-pressed',String(i===selection))"));
 assert.ok(s.includes("src=await pack.hudIcon(glyph,'full')"));
 assert.ok(s.includes('mw-pack-stat-clipped'));
 assert.ok(s.includes('src="./classic-hud-art.js"'));
 assert.ok(sw.includes("'./classic-hud-art.js'"));
 assert.ok(s.includes('const flatBlock=/\\b(?:rail|torch'));
 assert.ok(!s.includes('const flatBlock=/\\\\b(?:rail|torch'));
});
