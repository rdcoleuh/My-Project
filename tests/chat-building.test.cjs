/* MineWorld 5.9 — vertical stacking, true 64-item inventory stacks and player chat. */
const {test}=require('node:test'),assert=require('node:assert/strict'),
fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
function moduleOf(filename,key){
 const ctx={window:{}};vm.runInNewContext(read(filename),ctx,{filename});return ctx.window[key];
}
const build=moduleOf('block-placement.js','MineWorldBuilding');
const chat=moduleOf('chat-rules.js','MineWorldChatRules');
test('normal face placement and stacking above a targeted block choose different cells',()=>{
 const target={x:6,y:14,z:9,b:3,previous:{x:7,y:14,z:9}};
 const inside=(x,y,z)=>x>=0&&x<10000&&y>0&&y<48&&z>=0&&z<10000;
 const get=()=>0;
 const standard=build.placement(target,{get,inside});
 assert.equal(standard.ok,true);assert.deepEqual({...standard.point},{x:7,y:14,z:9});
 const top=build.placement(target,{get,inside,stack:true});
 assert.equal(top.ok,true);assert.deepEqual({...top.point},{x:6,y:15,z:9});
 assert.equal(top.stack,true);
});
test('vertical building never overwrites a block or builds beyond world ceiling',()=>{
 const target={x:10,y:46,z:10,b:5,previous:{x:11,y:46,z:10}};
 const inside=(x,y,z)=>x>0&&x<10000&&y>0&&y<48&&z>0&&z<10000;
 const occupied=build.placement(target,{stack:true,inside,get:()=>3});
 assert.equal(occupied.ok,false);assert.match(occupied.reason,/occupied/i);
 assert.equal(build.placement({...target,y:47},{stack:true,inside,get:()=>0}).ok,false);
 assert.equal(build.placement(null,{stack:true,inside,get:()=>0}).ok,false);
 assert.equal(build.placement({...target,b:0},{stack:true,inside,get:()=>0}).ok,false);
});
test('block stacks stop at 64 and split excess into separate inventory stacks',()=>{
 assert.equal(build.stackLimit('block:1'),64);
 assert.equal(build.stackLimit('block:169'),64);
 assert.equal(build.stackLimit('diamondPickaxe'),1);
 const sandbox={window:{}};vm.runInNewContext(read('stack-inventory.js'),sandbox);
 const store=sandbox.window.MineWorldStackInventory.create(build.stackLimit);
 store.add('block:3',130);
 assert.deepEqual(Array.from(store.entries.map(s=>s.qty)),[64,64,2]);
 const id=store.entries[2].id;
 store.add('block:3',50);
 assert.deepEqual(Array.from(store.entries.map(s=>s.qty)),[64,64,52]);
 assert.equal(store.take('block:3',1,id),1);
 assert.equal(store.byId(id).qty,51);
 const snapshot=JSON.parse(JSON.stringify(store.snapshot()));
 const restored=sandbox.window.MineWorldStackInventory.create(build.stackLimit);
 restored.restore(snapshot,{'block:3':179});
 assert.equal(restored.count('block:3'),179);
 assert.deepEqual(Array.from(restored.entries.map(s=>s.qty)),[64,64,51]);
});
test('multiplayer chat sanitizes name/text, blocks spam, rejects control characters',()=>{
 assert.equal(chat.name(' <Player> '),'Player');
 assert.equal(chat.name(null),'Builder');
 assert.equal(chat.clean('  Hello   builders!\nNice world '),'Hello builders! Nice world');
 assert.equal(chat.clean('<img src=x onerror=1>'),'<img src=x onerror=1>');
 assert.equal(chat.clean('x'.repeat(300)).length,160);
 const limiter=chat.limiter(750,3,15000);
 assert.equal(limiter.accept('Alice',1000),true);
 assert.equal(limiter.accept('Alice',1300),false);
 assert.equal(limiter.accept('Alice',1751),true);
 assert.equal(limiter.accept('Bob',1751),true);
 assert.equal(limiter.accept('Alice',2551),true);
 assert.equal(limiter.accept('Alice',3351),false);
 limiter.clear('Alice');assert.equal(limiter.accept('Alice',3351),true);
});
test('chat and vertical building are wired into the live game and offline cache',()=>{
 const html=read('index.html'),multi=read('multiplayer.js'),cache=read('sw.js');
 for(const file of ['chat-rules.js','block-placement.js']){
   assert.ok(html.includes('src="./'+file+'"'),file+' not loaded');
   assert.ok(cache.includes("'./"+file+"'"),file+' not in offline cache');
 }
 for(const id of ['stack-above','chat-trigger','chat-toggle','chat-unread','chat-entry','chatbox']){
  assert.ok(html.includes('id="'+id+'"'),'missing UI '+id);
 }
 for(const marker of ['function performPlace(stack=false)','MineWorldBuilding.placement(aim,{stack,get,inside})',
   "if(e.code==='KeyB'","e.code==='KeyT'","clearChatMovement",
   'window.MineWorldMultiplayer?.isTyping?.()','performPlace(true)','return false;']){
  assert.ok(html.includes(marker),'missing behavior '+marker);
 }
 for(const marker of ["chatRules.clean","chatLimiter.accept(conn.peer,Date.now())",
   "chatLimiter.accept('local',Date.now())","const member=peers.get(conn.peer)",
   'openChat,isTyping','chat-trigger','chat-toggle']){
  assert.ok(multi.includes(marker),'missing chat relay '+marker);
 }
 assert.ok(html.includes('MineWorld 5.9'));
 for(const m of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))if(m[1].trim())new Function(m[1]);
});
