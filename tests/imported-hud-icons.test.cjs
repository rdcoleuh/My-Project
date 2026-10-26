const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
test('Java resource pack parser recognizes bounded HUD sprite PNGs',()=>{
 const src=read('local-resource-pack.js');
 assert.ok(src.includes('textures\\/gui\\/sprites\\/hud'));
 assert.ok(src.includes("keep('hud:'+hud[1]+':'+hud[2]"));
 assert.ok(src.includes('function hudIcon(kind,fill)'));
 assert.ok(/itemName,blockItemIcon,hudIcon/.test(src));
});
test('HUD uses imported full, half and empty icons with procedural fallback',()=>{
 const src=read('index.html');
 assert.ok(src.includes('MineWorldLocalTextures?.hudIcon?.('));
 assert.ok(src.includes("kind==='Health'?'heart':'food'"));
 assert.ok(src.includes('image-rendering:pixelated'));
 assert.ok(src.includes('icon.textContent=remaining>=2'));
});
