const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
test('Java resource pack parser recognizes bounded HUD sprite PNGs',()=>{
 const src=read('local-resource-pack.js');
 assert.ok(src.includes('textures\\/gui\\/sprites\\/hud'));
 assert.ok(src.includes("keep('hud:'+hud[0]+':'+hud[1]"),'Java ZIPs must use [kind, variant] indices');
 assert.ok(!src.includes("keep('hud:'+hud[1]+':'+hud[2]"),'regression: hud:full:undefined is not a valid key');
 assert.ok(src.includes('function hudIcon(kind,fill)'));
 assert.ok(/itemName,blockItemIcon,hudIcon/.test(src));
});
test('HUD uses imported full, half and empty icons with procedural fallback',()=>{
 const src=read('index.html');
 assert.ok(src.includes('if(pack?.hudIcon)'));
 assert.ok(src.includes("const glyph=kind==='Health'?'heart':'food'"));
 assert.ok(src.includes('image-rendering:pixelated'));
 assert.ok(src.includes('MineWorldHudArt?.paint(glyph,fill)'));
 assert.ok(src.includes("src=await cachedStatArt(pack,glyph,'full')"));
 assert.ok(src.includes('statArtPromises.set(key'));
 assert.ok(src.includes('generation!==statArtGeneration'));
});
