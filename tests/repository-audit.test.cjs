/* MineWorld 5.7: whole-repository syntax, asset and UI-reference audit.
   These tests are static guards, not proof that every gameplay bug is fixed. */
const {test}=require('node:test'),assert=require('node:assert/strict'),
 fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const html=read('index.html');
const loaded=[...html.matchAll(/<script\b[^>]*\bsrc=["']\.\/([^"']+)["']/g)].map(x=>x[1]);
const files=fs.readdirSync(root).filter(x=>x.endsWith('.js'));
test('all top-level JavaScript modules and all embedded game scripts parse successfully',()=>{
 for(const name of files)assert.doesNotThrow(()=>new vm.Script(read(name),{filename:name}),name);
 for(const [i,m] of [...html.matchAll(/<script(?![^>]*\bsrc=)(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].entries())
  if(m[1].trim())assert.doesNotThrow(()=>new vm.Script(m[1],{filename:'index-inline-'+i}), 'inline script '+i);
});
test('all referenced external scripts exist, each is loaded once and all core scripts are precached',()=>{
 const sw=read('sw.js');
 assert.equal(loaded.length,new Set(loaded).size,'duplicate script load');
 for(const name of loaded){
  assert.ok(fs.existsSync(path.join(root,name)),name+' does not exist');
  if(name!=='multiplayer.js')assert.ok(sw.includes("'./"+name+"'"),name+' is not precached');
 }
 assert.ok(sw.includes('self.skipWaiting()'));
 assert.ok(sw.includes('self.clients.claim()'));
});
test('DOM uses unique ids and all direct $ selectors reference an existing element',()=>{
 const ids=[...html.matchAll(/\bid=["']([^"']+)["']/g)].map(x=>x[1]);
 assert.equal(ids.length,new Set(ids).size,'duplicate HTML ids');
 const existing=new Set(ids);
 const refs=[...html.matchAll(/\$\(['"]([^'"]+)['"]\)/g)].map(x=>x[1]);
 for(const id of refs)assert.ok(existing.has(id),'missing UI element: '+id);
 assert.ok(refs.length>100,'expected full-game UI audit coverage');
});
test('original resources are not downloaded or embedded; resource packs never upload selected files',()=>{
 const importer=read('local-resource-pack.js');
 const audio=read('sound-engine.js');
 const skin=read('skin-editor.js');
 for(const src of [importer,audio]){
  assert.ok(!src.includes('fetch('),'no unapproved remote requests');
  assert.ok(!src.includes('XMLHttpRequest'),'no network transfers');
 }
 assert.ok(!importer.includes('localStorage.setItem'),'ZIP asset bytes are session-only');
 assert.ok(importer.includes('deflate-raw'),'deflated resources handled locally');
 assert.ok(importer.includes('const max=Math.min(6*1024*1024'),'bounded memory expansion');
 assert.ok(!audio.includes('data:audio/'),'no embedded copyrighted sound clips');
 assert.ok(skin.includes('mineworld-avatar-skin-v1'),'keep customized skin data');
 assert.ok(html.includes('mineworld-selfhost-v1'),'preserve old world saves');
});
test('initially absent imported files still leave original 16x16 artwork and WebAudio sounds intact',()=>{
 assert.ok(loaded.indexOf('classic-materials.js')>=0);
 assert.ok(loaded.indexOf('sound-engine.js')>=0);
 assert.ok(loaded.indexOf('local-resource-pack.js')>=0);
 assert.ok(loaded.indexOf('local-resource-pack.js')>loaded.indexOf('sound-engine.js'));
 assert.ok(html.includes('MineWorld 5.7'));
 assert.ok(read('pixel-materials.js').length>4000);
 assert.ok(read('classic-materials.js').length>4000);
});