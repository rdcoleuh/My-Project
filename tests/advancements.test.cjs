/* MineWorld 5.9 advancement progression and hotbar stack count regression. */
const {test}=require('node:test'),assert=require('node:assert/strict'),
 fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const context={window:{},console};vm.runInNewContext(read('advancements.js'),context);
const API=context.window.MineWorldAdvancements;
const rules=()=>API.create();
test('complete Java Edition 26.3-style list has 126 unique milestones across all five tabs',()=>{
 assert.equal(API.DATA.length,126);
 assert.equal(new Set(API.DATA.map(d=>d.id)).size,126);
 assert.deepEqual(
  Object.fromEntries(API.TABS.map(t=>[t.id,API.DATA.filter(d=>d.tab===t.id).length])),
  {story:16,nether:23,end:9,adventure:47,husbandry:31});
 for(const d of API.DATA){
  assert.ok(typeof d.name==='string'&&d.name.length>1);
  assert.ok(typeof d.description==='string'&&d.description.length>4);
  if(d.parent)assert.ok(API.DATA.some(other=>other.id===d.parent),'Missing parent '+d.name);
 }
});
test('awards real resource, craft, tool, armor and dimension achievements, only once',()=>{
 const awarded=[],a=API.create(d=>awarded.push(d.name));
 assert.equal(a.count,0);
 a.emit('have','block:168');assert.equal(a.has('Minecraft'),true);
 a.emit('have','block:61');assert.equal(a.has('Stone Age'),true);
 a.emit('tool','pickaxe:stone');assert.equal(a.has('Getting an Upgrade'),true);
 a.emit('have','iron');assert.equal(a.has('Acquire Hardware'),true);
 a.emit('tool','pickaxe:iron');assert.equal(a.has("Isn't It Iron Pick"),true);
 a.emit('have','diamond');assert.equal(a.has('Diamonds!'),true);
 a.emit('armor','diamond');assert.equal(a.has('Cover Me with Diamonds'),true);
 a.emit('dimension','nether');assert.equal(a.has('We Need to Go Deeper'),true);
 assert.equal(a.has('Nether'),true);
 a.emit('dimension','nether');assert.equal(awarded.length,new Set(awarded).size);
 assert.equal(a.has('Free the End'),false);
});
test('combat, trading, farming and boss reward follow actual game events',()=>{
 const a=rules();
 a.emit('kill','zombie',{hostile:true});
 assert.ok(a.has('Adventure')&&a.has('Monster Hunter'));
 a.emit('kill','wither_skeleton',{hostile:true});assert.equal(a.has('Spooky Scary Skeleton'),false);
 a.emit('have','witherSkull');assert.equal(a.has('Spooky Scary Skeleton'),true);
 a.emit('trade','any');a.emit('plant','wheat');a.emit('sleep','any');
 for(const name of ['What a Deal!','A Seedy Place','Sweet Dreams'])assert.equal(a.has(name),true);
 a.emit('kill','ender_dragon',{hostile:true});
 assert.equal(a.has('Free the End'),true);
 a.emit('have','dragonEgg');assert.equal(a.has('The Next Generation'),true);
});
test('nether and overworld exploration track distinct biome names and survive reloads',()=>{
 const a=rules(),names=['Nether Wastes','Crimson Forest','Warped Forest','Soul Sand Valley','Basalt Deltas'];
 for(const n of names)a.emit('biome',n,{dimension:'nether'});
 a.emit('biome','Crimson Forest',{dimension:'nether'});
 assert.equal(a.has('Hot Tourist Destinations'),true);
 a.emit('biome','Forest',{dimension:'overworld',total:2});
 assert.equal(a.has('Adventuring Time'),false);
 const backup=JSON.parse(JSON.stringify(a.snapshot()));
 const b=rules();b.restore(backup);
 assert.equal(b.has('Hot Tourist Destinations'),true);
 b.emit('biome','Plains',{dimension:'overworld',total:2});
 assert.equal(b.has('Adventuring Time'),true);
 assert.equal(b.progress('Adventuring Time')[0],2);
});
test('diet advancement counts only approved edible keys, never duplicate foods',()=>{
 const a=rules();
 a.emit('eat','fakeFood',{total:2,allowed:['apple','bread']});
 a.emit('eat','apple',{total:2,allowed:['apple','bread']});
 a.emit('eat','apple',{total:2,allowed:['apple','bread']});
 assert.equal(a.has('A Balanced Diet'),false);
 a.emit('eat','bread',{total:2,allowed:['apple','bread']});
 assert.equal(a.has('A Balanced Diet'),true);
 assert.equal(a.has('Husbandry'),true);
});
test('not-yet-implemented advancements stay visible without fake auto-unlock',()=>{
 const a=rules();
 for(const d of API.DATA.filter(d=>!d.event)){
  a.emit('have',d.name);
  a.emit('craft',d.name);
  a.emit('kill',d.name,{hostile:true});
  assert.equal(a.has(d.name),false,'Unavailable goal falsely unlocked: '+d.name);
 }
 assert.equal(a.isAvailable('Caves & Cliffs'),false);
 assert.equal(a.isAvailable('Mob Kabob'),false);
 assert.equal(a.isAvailable('This Boat Has Legs'),false);
});
test('old or malformed world progress is safely ignored and limited',()=>{
 const a=rules();a.restore({completed:['story/minecraft','invalid','nether/nether',null],foods:[null,15,'bread']});
 assert.equal(a.has('Minecraft'),true);
 assert.equal(a.has('Nether'),true);
 assert.equal(a.count,2);
 const b=rules();b.restore(null);assert.equal(b.count,0);
});
test('game bundles advancement UI and per-world progress plus visible hotbar icon counts',()=>{
 const html=read('index.html'),sw=read('sw.js');
 for(const file of ['advancements.js','advancements-ui.js']){
  assert.ok(html.includes('src="./'+file+'"'),'Missing game script '+file);
  assert.ok(sw.includes("'./"+file+"'"),'Missing offline cache entry '+file);
 }
 for(const marker of [
  'advancements:advancementEngine.snapshot()','advancementEngine.restore(s.advancements)',
  "emitAdvancement('dimension',next)","emitAdvancement('plant',kind)",
  "emitAdvancement('trade','any')","emitAdvancement('kill',m.kind",
  'getAdvancementState:()=>advancementEngine','tickAdvancements()',
  "e.code==='KeyL'","if(survival&&count>0)swatch.appendChild(qty)",
  "if(survival&&count>0)icon.appendChild(qty)","qty.className=survival?'hot-stack-number'"])
  assert.ok(html.includes(marker),'Missing integration '+marker);
 assert.ok(html.includes(".hot-item .hot-stack-number{display:block!important"),'quantity not visible on phone');
 assert.ok(html.includes("MineWorld 5.9"));
 for(const m of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))if(m[1].trim())new Function(m[1]);
});