/* Screen-reader events must reflect furnace transitions, not 250-ms timer ticks. */
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),source=fs.readFileSync(path.join(root,'furnace-ui.js'),'utf8');
const ctx=vm.createContext({window:{}});
for(const file of ['furnace-engine.js','furnace-ui.js'])
 vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),ctx);
const {furnaceAnnouncement,furnaceAnnouncementState}=ctx.window.MineWorldFurnaceUI;
const event=(a,b)=>JSON.parse(JSON.stringify(furnaceAnnouncement(a,b)));
const p={dimension:'overworld',x:111,y:-20,z:112};
test('visual timer updates do not repeatedly announce to screen readers',()=>{
 assert.match(source,/id="mw-furnace-status" aria-live="off"/);
 assert.match(source,/id="mw-furnace-announcement"[^>]*role="status" aria-live="polite" aria-atomic="true"/);
 assert.match(source,/class="mw-furnace-sr-only"/);
 assert.match(source,/announceState=furnaceAnnouncementState\(m\)/);
});
test('opening an existing station does not announce old output',()=>{
 const f=ctx.window.MineWorldFurnace.create();
 f.restore([{...p,output:{key:'iron',qty:2},burn:5,burnTotal:80}]);
 const m=f.get(p);
 assert.equal(furnaceAnnouncement(null,m),null);
 assert.equal(furnaceAnnouncement(furnaceAnnouncementState(m),m),null);
});
test('burn countdown is silent except for ignition and exhaustion',()=>{
 const f=ctx.window.MineWorldFurnace.create();
 f.insert(p,'input','rawIron',2);f.insert(p,'fuel','coal',1);
 const before=furnaceAnnouncementState(f.get(p));
 f.tick(1);
 assert.equal(event(before,f.get(p)).kind,'burning');
 const burning=furnaceAnnouncementState(f.get(p));
 f.tick(1);
 assert.equal(furnaceAnnouncement(burning,f.get(p)),null);
 const almost=furnaceAnnouncementState(f.get(p));
 f.tick(60);f.tick(60);
 assert.equal(event(almost,f.get(p)).kind,'fuel-out');
});
test('new output announces once and timer frames do not repeat it',()=>{
 const f=ctx.window.MineWorldFurnace.create();
 f.insert(p,'input','rawIron',2);f.insert(p,'fuel','coal',1);
 f.tick(9);
 const before=furnaceAnnouncementState(f.get(p));
 f.tick(1);
 assert.deepEqual(event(before,f.get(p)),{kind:'ready',key:'iron',quantity:1});
 const after=furnaceAnnouncementState(f.get(p));
 f.tick(1);
 assert.equal(furnaceAnnouncement(after,f.get(p)),null);
 f.tick(9);
 assert.equal(event(after,f.get(p)).kind,'ready');
});
test('closing furnace returns focus to its opening control',()=>{
 assert.match(source,/returnFocus=document.activeElement/);
 assert.match(source,/target\.focus\(\{preventScroll:true\}\)/);
 assert.match(source,/announceState=null;panel\?\.classList\.add\('hidden'\)/);
});
