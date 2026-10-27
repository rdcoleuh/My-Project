const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
test('classic hotbar retains nine inventory-backed slots and imported item icons',()=>{
 assert.match(html,/for\(let i=0;i<9;i\+\+\)/);
 assert.match(html,/MineWorldBlockItemIcons\?\.paint/);
 assert.match(html,/MineWorldLocalTextures\?\.itemIcon/);
 assert.match(html,/#hotbar \.hot-item\.active/);
 assert.match(html,/image-rendering:pixelated!important/);
});
test('health and hunger display ten half-capable icons with accessible totals',()=>{
 assert.match(html,/for\(let i=0;i<10;i\+\+\)/);
 assert.match(html,/remaining>=1&&remaining<2/);
 assert.match(html,/MineWorldHudArt\?\.description\?\.\(kind,points\)/);
 assert.match(html,/node\.setAttribute\('aria-label',/);
 assert.match(html,/paintStat\(\$\('health-text'\),health/);
 assert.match(html,/paintStat\(\$\('hunger-text'\),hunger/);
});
