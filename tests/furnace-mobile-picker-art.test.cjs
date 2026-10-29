/* Furnace mobile picker stability and imported item art regression. */
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),ctx={window:{}};
vm.createContext(ctx);
for(const file of ['furnace-engine.js','furnace-ui.js'])
 vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),ctx);
const {syncSelect,resolveSlotIcon}=ctx.window.MineWorldFurnaceUI;
function fakeSelect(){
 let value='';
 return {options:[],replacements:0,get value(){return value;},set value(v){value=v;},
  replaceChildren(...nodes){this.replacements++;this.options=nodes;value=nodes[0]?.value||'';}};
}
const doc={createElement(tag){assert.equal(tag,'option');return {value:'',textContent:''};}};
test('furnace redraw keeps option nodes and active mobile selection stable',()=>{
 const select=fakeSelect(),keys=['coal','charcoal'];
 assert.equal(syncSelect(select,keys,{coal:3,charcoal:2},x=>x,doc),true);
 select.value='charcoal';const selected=select.options[1];
 for(let i=0;i<20;i++){
  assert.equal(syncSelect(select,keys,{coal:3,charcoal:2},x=>x,doc),false);
  assert.equal(select.replacements,1);assert.equal(select.options[1],selected);
  assert.equal(select.value,'charcoal');
 }
});
test('quantity changes update labels in place, while new keys reconcile',()=>{
 const select=fakeSelect();syncSelect(select,['coal'],{coal:1},x=>x,doc);
 const original=select.options[0];
 assert.equal(syncSelect(select,['coal'],{coal:7},x=>x,doc),false);
 assert.equal(select.options[0],original);assert.equal(original.textContent,'coal (7)');
 assert.equal(syncSelect(select,['coal','sticks'],{coal:7,sticks:4},x=>x,doc),true);
 assert.equal(select.value,'coal');assert.equal(select.options[1].textContent,'sticks (4)');
});
test('player-imported item PNG wins over procedural block artwork',async()=>{
 let fallback=0;ctx.window.MineWorldBlockItemIcons={paint(){fallback++;return true;}};
 const pack={blockItemIcon:async()=> 'data:image/png;base64,AAA=',itemIcon:async()=> 'data:image/png;base64,BBB='};
 assert.equal(await resolveSlotIcon('block:4',pack,{}),'data:image/png;base64,AAA=');
 assert.equal(await resolveSlotIcon('rawIron',pack,{}),'data:image/png;base64,BBB=');
 assert.equal(fallback,0);
});
test('missing or corrupt imported art uses original block preview or text',async()=>{
 ctx.window.MineWorldBlockItemIcons={paint(canvas,id){
  assert.equal(id,4);canvas.toDataURL=()=> 'data:image/png;base64,FALLBACK=';return true;}};
 const document={createElement(tag){assert.equal(tag,'canvas');return {};}};
 assert.equal(await resolveSlotIcon('block:4',{blockItemIcon:async()=>null},document),
  'data:image/png;base64,FALLBACK=');
 assert.equal(await resolveSlotIcon('rawIron',{itemIcon:async()=>{throw Error('bad PNG');}},document),null);
 assert.equal(await resolveSlotIcon('block:170',null,document),null);
});
test('three slots use crisp transparent art and stale async results are guarded',()=>{
 const source=fs.readFileSync(path.join(root,'furnace-ui.js'),'utf8');
 assert.equal((source.match(/<img alt="" aria-hidden="true" hidden>/g)||[]).length,3);
 assert.match(source,/image-rendering:pixelated/);
 assert.match(source,/node\.dataset\.artStamp!==stamp/);
 assert.match(source,/img\.hidden=true;letters\.hidden=false/);
 assert.match(fs.readFileSync(path.join(root,'sw.js'),'utf8'),/mineworld-6-96-furnace-mobile-picker-and-icons/);
});
