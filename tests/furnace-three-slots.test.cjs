/* Furnace three-slot UI and stack-transfer regression contracts. */
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'furnace-ui.js'),'utf8');
test('furnace has three labeled visual slots and independent live progress meters',()=>{
 for(const name of ['input','fuel','output']){
  assert.ok(source.includes('mw-furnace-slot-'+name),'missing '+name+' slot');
 }
 for(const id of ['mw-furnace-flame','mw-furnace-cook'])
  assert.ok(source.includes(id),'missing progress meter '+id);
 assert.match(source,/node\.setAttribute\('aria-label'/);
 assert.match(source,/m\.burn\/m\.burnTotal\*100/);
 assert.match(source,/m\.progress\/window\.MineWorldFurnace\.KINDS\[m\.kind\]\.cook\*100/);
});
test('furnace UI supports one item and a stack, without consuming more than owned',()=>{
 for(const name of ['input','fuel'])assert.ok(source.includes('mw-furnace-put-'+name+'-stack'));
 assert.match(source,/Math\.min\(limit,owned,64-/);
 assert.match(source,/const debit=api\.change\(item,-quantity\)/);
 assert.match(source,/const moved=deposit\(engine,api,current,which,item,limit\)/);
 assert.match(source,/if\(moved<quantity\)api\.change\(item,quantity-moved\)/);
 const context=vm.createContext({window:{}});
 vm.runInContext(fs.readFileSync(path.join(root,'furnace-engine.js'),'utf8'),context);
 const f=context.window.MineWorldFurnace.create();
 const p={dimension:'overworld',x:5010,y:14,z:5010};
 assert.equal(f.insert(p,'input','rawIron',64),64);
 assert.equal(f.insert(p,'input','rawIron',10),0,'slot is capped at 64');
 assert.equal(f.take(p,'input',3).qty,3);
 assert.equal(f.insert(p,'input','rawIron',20),3,'only available room is filled');
 assert.equal(f.get(p).input.qty,64);
 assert.equal(f.insert(p,'fuel','coal',64),64);
 assert.equal(f.insert(p,'fuel','coal',2),0);
});
