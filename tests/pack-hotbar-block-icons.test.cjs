const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
test('pack block item icon checks names and mapped block faces',()=>{const s=read('local-resource-pack.js');assert.ok(s.includes('function blockItemIcon(id)'));assert.ok(s.includes('mappings.get(id)?.[0]'));assert.ok(s.includes('itemName,blockItemIcon,hudIcon'));});
test('hotbar replaces procedural block icon with imported item art when available',()=>{const s=read('index.html');assert.ok(s.includes('blockItemIcon?.(id)'));assert.ok(s.includes('packGeneration!==window.MineWorldLocalTextures?.generation'));assert.ok(s.includes('sprite.replaceWith(art)'));assert.ok(s.includes('.swatch.mw-has-pack-icon{background-color:transparent'));});

test('item-only resource packs provide block icons even without terrain atlas',()=>{
 const s=read('index.html');
 assert.ok(s.includes('const importedBlockFaces=[0,1,2].some(face=>localPack?.hasImportedFace?.(id,face))'));
 assert.ok(s.includes('if(localPack?.hasPack&&(flatBlock||!importedBlockFaces))'));
 assert.ok(!s.includes('if(flatBlock&&window.MineWorldLocalTextures?.active)'));
});
test('imported hotbar sprites preserve square pixels inside touch-sized buttons',()=>{
 const s=read('index.html');
 assert.ok(s.includes('background-size:100% auto!important;background-position:center!important'));
 assert.ok(s.includes('background-size:contain!important;background-position:center!important'));
});
