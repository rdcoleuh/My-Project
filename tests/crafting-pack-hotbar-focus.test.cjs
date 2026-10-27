'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const craft=html.slice(html.indexOf('function renderCraftingGrid(){'),html.indexOf('function placeCraftingTable(){'));
const hotbar=html.slice(html.indexOf('function updateHotbar(){'),html.indexOf('function toast(s)'));
const place=html.slice(html.indexOf('function performPlace('),html.indexOf('function breakBlockNow('));
const helper=html.match(/function hotbarIconRequestCurrent\(pack,generation,node\)\{[\s\S]*?\n  \}/);
test('crafting item sprites reject stale packs and detached cells',()=>{
 assert.ok(helper,'pack identity guard exists');
 const context={window:{MineWorldLocalTextures:null}};
 vm.runInNewContext(helper[0]+'\nthis.check=hotbarIconRequestCurrent;',context);
 const original={generation:4},next={generation:4},icon={isConnected:true};
 context.window.MineWorldLocalTextures=original;
 assert.equal(context.check(original,4,icon),true);
 context.window.MineWorldLocalTextures=next;
 assert.equal(context.check(original,4,icon),false);
 assert.equal(context.check(next,4,icon),true);
 icon.isConnected=false;
 assert.equal(context.check(next,4,icon),false);
});
test('crafting block icons prefer owned sprites only for flat or item-only packs',()=>{
 assert.match(craft,/MineWorldBlockItemIcons\?\.paint\(preview,blockId\)/);
 assert.match(craft,/hasCraftFaces=\[0,1,2\]\.some\(face=>craftPack\?\.hasImportedFace\?\.\(blockId,face\)\)/);
 assert.match(craft,/craftPack\?\.hasPack&&\(flatCraftBlock\|\|!hasCraftFaces\)/);
 assert.match(craft,/craftPack\.blockItemIcon\?\.\(blockId\)/);
 assert.match(craft,/hotbarIconRequestCurrent\(craftPack,craftGeneration,icon\)/);
 assert.match(craft,/image-rendering:pixelated/);
});
test('crafting item art cannot overwrite a new pack with the same generation',()=>{
 assert.match(craft,/craftPack\?\.itemIcon\?\.\(slot\.key\)/);
 assert.match(craft,/if\(!src\|\|!hotbarIconRequestCurrent\(craftPack,craftGeneration,icon\)\)return/);
 assert.doesNotMatch(craft,/if\(!src\|\|!icon\.isConnected\)return/);
});
test('hotbar retains keyboard focus through redraw without scrolling',()=>{
 assert.match(hotbar,/document\.activeElement\?\.parentElement===root/);
 assert.match(hotbar,/indexOf\.call\(root\.children,document\.activeElement\)/);
 assert.match(hotbar,/root\.children\[focusedSlot\]\?\.focus\(\{preventScroll:true\}\)/);
});
test('placing a crafting table invalidates nearby-station memo immediately',()=>{
 assert.match(place,/if\(b===168\)craftBenchMemo\.until=0/);
 assert.match(place,/aim\?\.b===168/);
 assert.match(place,/openGear\(\)/);
});