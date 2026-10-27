const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
test('imported Bedrock slot textures remove opaque CSS overlays',()=>{const s=read('index.html');assert.ok(s.includes('#hotbar.mw-pack-bar-image .hot-item:not(.mw-pack-slot){'));assert.ok(s.includes("!!background||!!selected||!!genericSlot||slots.some(Boolean)"));assert.ok(s.includes("root.classList.toggle('mw-pack-bar-image'"));assert.ok(s.includes("!!selected&&item.classList.contains('active')"));});
test('Bedrock hotbar variants include start end and selected sprite aliases',()=>{const s=read('local-resource-pack.js');for(const key of ['hotbar_start_cap','hotbar_end_cap','hotbar_background','hotbar_selected'])assert.ok(s.includes(key));});

test('selection-only and partial HUD packs preserve fallback slot backgrounds',()=>{
 const s=read('index.html');
 assert.ok(s.includes('const useBackground=!!background&&!allSlots&&!genericSlot&&!slots.some(Boolean);'));
 assert.ok(s.includes("root.classList.toggle('mw-pack-bar-image',useBackground)"));
 assert.ok(s.includes('#hotbar.mw-pack-bar-image,#hotbar.mw-pack-hotbar-slots{background-color:transparent!important'));
 assert.ok(!s.includes('#hotbar.mw-pack-hotbar .hot-item{background-color:transparent!important'));
});

test('survival stack quantities stay bottom-right instead of inheriting top-aligned slot indices',()=>{
 const html=read('index.html');
 const match=html.match(/#hotbar \.hot-item > \.hot-stack-number\{([^}]+)\}/);
 assert.ok(match,'expected a dedicated stack-count overlay rule');
 assert.match(match[1],/top:auto!important/);
 assert.match(match[1],/bottom:3px!important/);
 assert.match(match[1],/z-index:5!important/);
 assert.match(match[1],/pointer-events:none/);
 assert.ok(html.includes('if(survival&&count>0)button.appendChild(qty)'));
});
