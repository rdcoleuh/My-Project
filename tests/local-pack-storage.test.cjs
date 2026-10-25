/* Local-only texture-pack persistence: explicit opt-in, restore and reset. */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
function fakeIndexedDB(){
 const data=new Map();
 let exists=false;
 const db={
  objectStoreNames:{contains:()=>exists},
  createObjectStore(){exists=true;},
  close(){},
  transaction(){
   const tx={oncomplete:null,onabort:null,onerror:null};
   tx.objectStore=()=>({
    put(value,key){const request={};queueMicrotask(()=>{data.set(key,value);request.onsuccess?.();tx.oncomplete?.();});return request;},
    get(key){const request={};queueMicrotask(()=>{request.result=data.get(key);request.onsuccess?.();tx.oncomplete?.();});return request;},
    delete(key){const request={};queueMicrotask(()=>{data.delete(key);request.onsuccess?.();tx.oncomplete?.();});return request;}
   });
   return tx;
  }
 };
 return {data,indexedDB:{open(){
  const request={};queueMicrotask(()=>{request.result=db;if(!exists)request.onupgradeneeded?.();request.onsuccess?.();});return request;
 }}};
}
test('player-approved Java pack is stored only on-device and restored without network',async()=>{
 const mock=fakeIndexedDB(),window={};
 vm.runInNewContext(read('local-pack-storage.js'),{
  window,indexedDB:mock.indexedDB,Blob,ArrayBuffer,Number,Promise,queueMicrotask
 });
 const storage=window.MineWorldPackStorage;
 assert.equal(storage.supported,true);
 assert.equal(await storage.load(),null);
 const input=Uint8Array.from([80,75,3,4,7,9]);
 const file={name:'my-java-assets.jar',size:input.byteLength,arrayBuffer:async()=>input.buffer};
 assert.equal(await storage.save(file),true);
 assert.equal(mock.data.size,1);
 const restored=await storage.load();
 assert.equal(restored.name,'my-java-assets.jar');
 assert.deepEqual([...new Uint8Array(await restored.arrayBuffer())],[...input]);
 assert.equal(await storage.clear(),true);
 assert.equal(await storage.load(),null);
});
test('storage refuses unrelated formats, oversized packs and unsupported browsers',async()=>{
 const mock=fakeIndexedDB(),window={};
 vm.runInNewContext(read('local-pack-storage.js'),{
  window,indexedDB:mock.indexedDB,Blob,ArrayBuffer,Number,Promise,queueMicrotask
 });
 const storage=window.MineWorldPackStorage;
 assert.equal(await storage.save({name:'stone.png',size:4,arrayBuffer:async()=>new ArrayBuffer(4)}),false);
 assert.equal(await storage.save({name:'giant.zip',size:161*1024*1024,arrayBuffer:async()=>{throw Error('should not read')}}),false);
 assert.equal(mock.data.size,0);
 const other={};
 vm.runInNewContext(read('local-pack-storage.js'),{window:other,Blob,ArrayBuffer,Number,Promise});
 assert.equal(other.MineWorldPackStorage.supported,false);
 assert.equal(await other.MineWorldPackStorage.load(),null);
 assert.equal(await other.MineWorldPackStorage.save({name:'ok.zip',arrayBuffer:async()=>new ArrayBuffer(4)}),false);
});
test('importer offers explicit remember choice and clears saved packs on reset',()=>{
 const html=read('index.html'),sw=read('sw.js'),pack=read('local-resource-pack.js');
 assert.ok(html.indexOf('src="./local-pack-storage.js"')<html.indexOf('src="./local-resource-pack.js"'));
 assert.ok(html.includes('src="./local-pack-storage.js"'));
 assert.ok(sw.includes("'./local-pack-storage.js'"),'offline cache must include storage script');
 assert.ok(pack.includes("remember.type='checkbox'"),'opt-in is a checkbox');
 assert.ok(pack.includes('remember.checked?await packStorage?.save?.(selected):false'));
 assert.ok(pack.includes('await packStorage?.clear?.()'));
 assert.ok(pack.includes('if(!stored||manualImportStarted||state.active)return'));
 assert.ok(!pack.includes('fetch('),'local texture importer must not fetch remote files');
});
