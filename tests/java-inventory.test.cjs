/* MineWorld 6.6: slot layout and item conservation regression tests. */
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const ctx=vm.createContext({window:{}});
for(const file of ['stack-inventory.js','java-slots.js'])vm.runInContext(read(file),ctx,{filename:file});
const create=()=>{
 const store=ctx.window.MineWorldStackInventory.create(key=>/Sword|Pickaxe|boots/i.test(key)?1:64);
 const hotbar=Array(9).fill(null);
 const model=ctx.window.MineWorldJavaSlots.create(store,hotbar);
 return {store,hotbar,model};
};
const count=s=>s.entries.reduce((n,v)=>n+v.qty,0);
const uniq=model=>{
 const s=model.inspect(),all=[...s.slots,s.offhand,s.cursor].filter(Boolean);
 assert.equal(all.length,new Set(all).size,'An item stack was duplicated across slots');
};
test('legacy stack IDs are migrated to a 27+9 Java-style layout without changing item counts',()=>{
 const {store,hotbar,model}=create();
 store.add('block:3',130);store.add('ironSword',1);
 hotbar[0]=store.entries[0].id;model.restore(null);
 const a=model.inspect();
 assert.equal(a.slots.length,36);
 assert.equal(a.slots[27],hotbar[0]);
 assert.equal(a.slots.filter(Boolean).length,4);
 assert.equal(count(store),131);
 uniq(model);
});
test('left/right clicks support half stack, single placement, merging and zero loss',()=>{
 const {store,model}=create();store.add('block:3',13);model.normalize();
 assert.equal(model.click(0,true),true);
 assert.equal(model.stackAt(0).qty,6);
 assert.equal(model.cursorStack().qty,7);
 assert.equal(model.click(1,true),true);
 assert.equal(model.stackAt(1).qty,1);
 assert.equal(model.cursorStack().qty,6);
 assert.equal(model.click(0,false),true);
 assert.equal(model.stackAt(0).qty,12);
 assert.equal(model.cursorStack(),null);
 assert.equal(count(store),13);uniq(model);
});
test('shift-click, number-key swap and offhand remain synchronized with hotbar references',()=>{
 const {store,hotbar,model}=create();
 store.add('block:3',64);store.add('block:4',14);
 model.normalize();
 assert.equal(model.quickMove(0),true);
 assert.equal(hotbar[0],model.stackAt(27).id);
 assert.equal(model.hotkey(1,1),true);
 assert.equal(hotbar[1],model.stackAt(28).id);
 assert.equal(model.moveOffhand(27),true);
 assert.equal(model.stackAt('offhand').key,'block:3');
 assert.equal(hotbar[0],null);
 assert.equal(count(store),78);uniq(model);
});
test('overflow pages preserve old worlds containing more than 36 distinct stacks',()=>{
 const {store,model,hotbar}=create();
 for(let i=0;i<56;i++)store.add('unique:'+i,1);
 model.restore(null);
 assert.equal(model.pages(),2);
 assert.equal(model.inspect().slots.filter(Boolean).length,56);
 assert.equal(count(store),56);
 const snap=JSON.parse(JSON.stringify(model.snapshot()));
 const second=ctx.window.MineWorldJavaSlots.create(store,hotbar);
 second.restore(snap);
 assert.equal(second.inspect().slots.filter(Boolean).length,56);
 assert.deepEqual(JSON.parse(JSON.stringify(second.snapshot())),snap);
 uniq(second);
});
test('closing inventory returns cursor stack without losing items',()=>{
 const {store,model}=create();
 store.add('block:1',17);model.normalize();
 model.click(0,false);assert.equal(model.stackAt(0),null);
 assert.equal(model.cursorStack().qty,17);
 model.putAway();
 assert.equal(model.cursorStack(),null);
 assert.equal(model.stackAt(0).qty,17);
 assert.equal(count(store),17);uniq(model);
});
test('main game saves slot positions, restores old saves, loads UI, and preserves gameplay',()=>{
 const html=read('index.html'),sw=read('sw.js'),ui=read('java-inventory-ui.js');
 for(const needle of ['javaInventory:javaInventory.snapshot()','javaInventory.restore(s.javaInventory)',
  'survivalHotbar:[...survivalHotbar]','mineworld-selfhost-v1',
  'src="./java-slots.js"','src="./java-inventory-ui.js"','href="./java-inventory.css"',
  'window.MineWorldJavaInventoryScreen=','MineWorld 6.6'])
  assert.ok(html.includes(needle),'Missing '+needle);
 for(const name of ['java-slots.js','java-inventory-ui.js','java-inventory.css'])
  assert.ok(sw.includes("'./"+name+"'"),'Offline cache omits '+name);
 assert.ok(ui.includes('contextmenu')&&ui.includes('Shift')&&ui.includes('hotkey'));
 assert.ok(!ui.includes('fetch('));
});
