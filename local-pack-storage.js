/* MineWorld: optional, local-only persistence for player-selected Java and Bedrock packs.
 * Nothing is uploaded, downloaded automatically, or included in the game build.
 * IndexedDB is used only after the player explicitly chooses "Remember".
 */
(()=>{
'use strict';
const DATABASE='mineworld-user-resource-pack-v1',STORE='packs',KEY='active';
// Official Mojang full Bedrock Samples can exceed 160 MiB.
const LIMIT=240*1024*1024;
function openDatabase(){
 if(typeof indexedDB==='undefined')return Promise.resolve(null);
 return new Promise(resolve=>{
  let request;
  try{request=indexedDB.open(DATABASE,1);}
  catch(_){resolve(null);return;}
  request.onupgradeneeded=()=>{
   const db=request.result;
   if(!db.objectStoreNames.contains(STORE))db.createObjectStore(STORE);
  };
  request.onsuccess=()=>resolve(request.result);
  request.onerror=()=>resolve(null);
  request.onblocked=()=>resolve(null);
 });
}
async function transaction(mode,method,value){
 const db=await openDatabase();
 if(!db)return null;
 return new Promise(resolve=>{
  let completed=false,result=null;
  const finish=out=>{
   if(completed)return;
   completed=true;
   try{db.close();}catch(_){}
   resolve(out);
  };
  try{
   const tx=db.transaction(STORE,mode);
   const req=method==='put'?tx.objectStore(STORE).put(value,KEY):
     method==='get'?tx.objectStore(STORE).get(KEY):tx.objectStore(STORE).delete(KEY);
   req.onsuccess=()=>{if(method==='get')result=req.result||null;};
   tx.oncomplete=()=>finish(method==='get'?result:true);
   tx.onabort=()=>finish(null);
   tx.onerror=()=>finish(null);
  }catch(_){finish(null);}
 });
}
async function save(file){
 if(!file||typeof file.arrayBuffer!=='function')return false;
 if(!/\.(zip|jar|mcpack)$/i.test(file.name||''))return false;
 if(Number.isFinite(file.size)&&file.size>LIMIT)return false;
 try{
  const bytes=await file.arrayBuffer();
  if(!(bytes instanceof ArrayBuffer)||bytes.byteLength>LIMIT)return false;
  const blob=new Blob([bytes],{type:'application/octet-stream'});
  return await transaction('readwrite','put',{name:file.name,blob})===true;
 }catch(_){return false;}
}
async function load(){
 const saved=await transaction('readonly','get');
 if(!saved||!/\.(zip|jar|mcpack)$/i.test(saved.name||'')||
    !saved.blob||saved.blob.size>LIMIT)return null;
 return {name:saved.name,size:saved.blob.size,arrayBuffer:()=>saved.blob.arrayBuffer()};
}
async function clear(){return await transaction('readwrite','delete')===true;}
window.MineWorldPackStorage=Object.freeze({
 get supported(){return typeof indexedDB!=='undefined';},
 save,load,clear
});
})();
