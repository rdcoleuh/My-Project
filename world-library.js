/* MineWorld 5.6 — browser-local multiworld index.
   Maintains the original 5.5 creative/survival save keys indefinitely.
   No account, network requests, or forced migration of old world data. */
(()=>{
'use strict';
const INDEX='mineworld-world-library-v1',MODES=['creative','survival'],MAX=20;
function create(storage,prefix){
 const base=mode=>prefix+'-slot-'+mode+'-v1';
 const fresh=()=>({version:1,next:1,active:{creative:'original',survival:'original'},worlds:[
  {id:'original',mode:'creative',name:'Original Creative',created:0},
  {id:'original',mode:'survival',name:'Original Survival',created:0}
 ]});
 function normalize(s){
  const init=fresh();
  if(!s||s.version!==1||!Array.isArray(s.worlds))return init;
  const result={...init,next:Number.isSafeInteger(s.next)&&s.next>=1?s.next:1,worlds:[]};
  const seen=new Set();
  for(const raw of s.worlds.slice(0,50)){
   if(!raw||!MODES.includes(raw.mode)||typeof raw.id!=='string'||!(/^[a-z0-9_-]{1,48}$/i).test(raw.id))continue;
   const k=raw.mode+':'+raw.id;if(seen.has(k))continue;
   seen.add(k);result.worlds.push({
    id:raw.id,mode:raw.mode,
    name:String(raw.name||'Untitled World').trim().slice(0,36)||'Untitled World',
    created:Number.isFinite(raw.created)?raw.created:0
   });
  }
  for(const mode of MODES)if(!result.worlds.some(w=>w.mode===mode&&w.id==='original'))result.worlds.unshift({...init.worlds.find(w=>w.mode===mode)});
  for(const mode of MODES){
   const wanted=s.active?.[mode];
   if(typeof wanted==='string'&&result.worlds.some(w=>w.mode===mode&&w.id===wanted))result.active[mode]=wanted;
  }
  return result;
 }
 let state;
 try{state=normalize(JSON.parse(storage.getItem(INDEX)||'null'))}catch(_){state=fresh()}
 const persist=()=>storage.setItem(INDEX,JSON.stringify(state));
 const modeOK=m=>{if(!MODES.includes(m))throw Error('Invalid world mode');return m;};
 const find=(mode,id)=>state.worlds.find(w=>w.mode===mode&&w.id===id);
 const list=mode=>state.worlds.filter(w=>!mode||w.mode===mode).map(w=>({...w,key:w.id==='original'?base(w.mode):base(w.mode)+'-world-'+w.id,active:state.active[w.mode]===w.id,hasSave:!!storage.getItem(w.id==='original'?base(w.mode):base(w.mode)+'-world-'+w.id)}));
 const current=mode=>{modeOK(mode);return find(mode,state.active[mode])||find(mode,'original')};
 const key=(mode,id=current(mode).id)=>{modeOK(mode);if(!find(mode,id))throw Error('Unknown world');return id==='original'?base(mode):base(mode)+'-world-'+id};
 function select(mode,id){modeOK(mode);if(!find(mode,id))throw Error('World not found');const previous=state.active[mode];state.active[mode]=id;try{persist()}catch(e){state.active[mode]=previous;throw e}return current(mode);}
 function createWorld(mode,name){
  modeOK(mode);
  if(list(mode).length>=MAX)throw Error('Limit of 20 worlds per mode reached');
  const before=JSON.stringify(state);
  const id='w'+(state.next++).toString(36)+'_'+Math.floor(Math.random()*0xfffffff).toString(36);
  const entry={mode,id,name:String(name||'New World').trim().slice(0,36)||'New World',created:Date.now()};
  state.worlds.push(entry);
  try{persist()}catch(e){state=JSON.parse(before);throw e}
  return {...entry,key:key(mode,id)};
 }
 function rename(mode,id,name){
  const w=find(modeOK(mode),id);if(!w)throw Error('World not found');
  const clean=String(name||'').trim().slice(0,36);if(!clean)throw Error('Enter a world name');
  const old=w.name;w.name=clean;
  try{persist()}catch(e){w.name=old;throw e}
  return {...w};
 }
 function remove(mode,id){
  modeOK(mode);
  if(id==='original')throw Error('Original worlds are protected to preserve old saves');
  const w=find(mode,id);if(!w)throw Error('World not found');
  const existing=storage.getItem(key(mode,id));const backup=JSON.stringify(state);
  state.worlds=state.worlds.filter(v=>!(v.id===id&&v.mode===mode));
  if(state.active[mode]===id)state.active[mode]='original';
  try{persist();storage.removeItem(base(mode)+'-world-'+id)}
  catch(e){state=JSON.parse(backup);if(existing!==null)try{storage.setItem(base(mode)+'-world-'+id,existing)}catch(_){ }throw e}
  return true;
 }
 function duplicate(mode,id){
  const source=storage.getItem(key(mode,id));if(!source)throw Error('This world has no save data to copy');
  const copy=createWorld(mode,(find(mode,id)?.name||'World')+' Copy');
  try{storage.setItem(copy.key,source)}catch(e){remove(mode,copy.id);throw e}
  return copy;
 }
 return Object.freeze({list,current,key,select,create:createWorld,rename,remove,duplicate,MAX});
}
window.MineWorldWorldLibrary=Object.freeze({create});
})();