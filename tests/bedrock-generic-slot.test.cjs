const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
test('Bedrock generic slot art is available to all nine slots while end caps remain separate',()=>{
 const html=read('index.html'),pack=read('local-resource-pack.js');
 assert.ok(pack.includes("hotbar_slot:'hotbar:slot'"));
 assert.ok(pack.includes("hotbar_start_cap:'hotbar:slot0'"));
 assert.ok(pack.includes("hotbar_end_cap:'hotbar:slot8'"));
 assert.ok(pack.includes("slot|slot[0-8]"));
 assert.ok(html.includes("source?.hudIcon?.('hotbar','slot')"));
 assert.ok(html.includes("const slotArt=slots[i]||genericSlot"));
 assert.ok(html.includes("const [background,selected,genericSlot,...slots]"));
});
