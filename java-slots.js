/* MineWorld 6.7 - persistent Java-style slot mechanics. Original code.
 * 27 inventory slots, nine hotbar slots, safe overflow, cursor and offhand.
 * StackStore remains the single authoritative count and save backend.
 */
(()=>{
'use strict';
const MAIN=27,LENGTH=36;
function create(store,hotbar,changed=()=>{}){
 let slots=Array(LENGTH).fill(null),cursor=null,offhand=null;
 const valid=id=>Number.isSafeInteger(id)&&id>0&&store.byId(id)?id:null;
 const at=p=>p==='offhand'?offhand:slots[p]??null;
 const assign=(p,id)=>{
  id=valid(id);
  if(p==='offhand'){offhand=id;return;}
  if(!Number.isInteger(p)||p<0||p>8191)return;
  while(slots.length<=p)slots.push(null);
  slots[p]=id;
  if(p>=MAIN&&p<LENGTH)hotbar[p-MAIN]=id;
 };
 function normalize(){
  for(let i=0;i<9;i++)slots[MAIN+i]=valid(hotbar[i]);
  const used=new Set();
  for(let i=MAIN;i<LENGTH;i++){
   const id=valid(slots[i]);slots[i]=id&&!used.has(id)?id:null;
   if(slots[i])used.add(slots[i]);
   hotbar[i-MAIN]=slots[i];
  }
  offhand=valid(offhand);if(used.has(offhand))offhand=null;if(offhand)used.add(offhand);
  cursor=valid(cursor);if(used.has(cursor))cursor=null;if(cursor)used.add(cursor);
  for(let i=0;i<slots.length;i++){
   if(i>=MAIN&&i<LENGTH)continue;
   const id=valid(slots[i]);slots[i]=id&&!used.has(id)?id:null;
   if(slots[i])used.add(slots[i]);
  }
  for(const s of store.entries){
   if(used.has(s.id))continue;
   let i=slots.findIndex((n,k)=>k<MAIN&&n===null);
   if(i<0)i=slots.findIndex((n,k)=>k>=LENGTH&&n===null);
   if(i<0)i=Math.max(LENGTH,slots.length);
   assign(i,s.id);used.add(s.id);
  }
 }
 const change=()=>{normalize();changed()};
 function removeEmpty(id){
  const s=store.byId(id);
  if(s&&s.qty<=0)store.entries.splice(store.entries.indexOf(s),1);
 }
 function split(id,n){
  const s=store.byId(id);
  if(!s||n<1||n>=s.qty)return null;
  s.qty-=n;const duplicate={id:store.nextId++,key:s.key,qty:n};
  store.entries.push(duplicate);return duplicate.id;
 }
 function merge(source,destination,n=Infinity){
  const s=store.byId(source),d=store.byId(destination);
  if(!s||!d||s.id===d.id||s.key!==d.key)return 0;
  const moved=Math.min(n,s.qty,store.limit(s.key)-d.qty);
  if(moved<=0)return 0;
  s.qty-=moved;d.qty+=moved;removeEmpty(s.id);return moved;
 }
 function click(pos,right=false,shift=false){
  normalize();
  if(pos!=='offhand'&&(!Number.isInteger(pos)||pos<0||pos>=8192))return false;
  if(pos!=='offhand')while(slots.length<=pos)slots.push(null);
  if(shift)return quickMove(pos);
  const target=at(pos),held=cursor;
  if(!held){
   if(!target)return false;
   if(right){
    const s=store.byId(target),n=Math.ceil(s.qty/2);
    cursor=n===s.qty?target:split(target,n);
    if(n===s.qty)assign(pos,null);
   }else{cursor=target;assign(pos,null)}
  }else if(!target){
   if(right){
    const s=store.byId(held),piece=s.qty===1?held:split(held,1);
    assign(pos,piece);if(piece===held)cursor=null;
   }else{assign(pos,held);cursor=null}
  }else if(target===held)return false;
  else if(store.byId(target)?.key===store.byId(held)?.key){
   if(!merge(held,target,right?1:Infinity))return false;
   if(!store.byId(held))cursor=null;
  }else if(!right){assign(pos,held);cursor=target}
  else return false;
  change();return true;
 }
 function quickMove(pos){
  normalize();const id=at(pos),s=store.byId(id);if(!s)return false;
  const targets=pos==='offhand'||pos>=MAIN&&pos<LENGTH?
   Array.from({length:MAIN},(_,i)=>i):
   Array.from({length:9},(_,i)=>MAIN+i);
  if(pos>=LENGTH)targets.unshift(...Array.from({length:MAIN},(_,i)=>i));
  let moved=false;
  for(const i of targets){
   const t=at(i);
   if(t&&t!==id&&store.byId(t)?.key===s.key&&s.qty>0)if(merge(id,t))moved=true;
   if(!store.byId(id)){assign(pos,null);break}
  }
  if(store.byId(id)){
   const empty=targets.find(i=>at(i)===null);
   if(empty!==undefined){assign(pos,null);assign(empty,id);moved=true}
  }
  if(moved)change();return moved;
 }
 function swap(from,to){
  normalize();
  if(from!=='offhand'&&(!Number.isInteger(from)||from<0||from>=8192))return false;
  if(to!=='offhand'&&(!Number.isInteger(to)||to<0||to>=8192))return false;
  if(from!=='offhand')while(slots.length<=from)slots.push(null);
  if(to!=='offhand')while(slots.length<=to)slots.push(null);
  if(from===to)return false;
  const a=at(from),b=at(to);if(!a&&!b)return false;
  assign(from,b);assign(to,a);change();return true;
 }
 function drag(from,to){
  normalize();const a=at(from),b=at(to);
  if(!a||from===to)return false;
  if(b&&store.byId(a)?.key===store.byId(b)?.key){
   if(!merge(a,b))return false;
   if(!store.byId(a))assign(from,null);
   change();return true;
  }
  return swap(from,to);
 }

 // Java Edition-style double click: pull matching stacks into the cursor
 // without exceeding the item's own stack cap.
 function collect(pos){
  normalize();
  if(pos!=='offhand'&&(!Number.isInteger(pos)||pos<0||pos>=slots.length))return false;
  if(!cursor){
   const initial=at(pos);
   if(!initial)return false;
   cursor=initial;assign(pos,null);
  }
  const held=store.byId(cursor);
  if(!held)return false;
  let changedAny=false;
  for(const p of [...Array(slots.length).keys(),'offhand']){
   const source=at(p);
   if(!source||source===cursor||store.byId(source)?.key!==held.key)continue;
   if(held.qty>=store.limit(held.key))break;
   const moved=merge(source,cursor,store.limit(held.key)-held.qty);
   if(moved){
    if(!store.byId(source))assign(p,null);
    changedAny=true;
   }
  }
  change();return changedAny||!!held;
 }
 // Mouse drag distribution: one item per destination on right drag,
 // equal whole-number shares on left drag. All leftovers stay on cursor.
 function distribute(positions,right=false){
  normalize();
  const held=store.byId(cursor);
  if(!held||!Array.isArray(positions))return false;
  const unique=[...new Set(positions)].filter(p=>
    (p==='offhand'||Number.isInteger(p)&&p>=0&&p<slots.length)&&
    at(p)!==cursor&&(!at(p)||store.byId(at(p))?.key===held.key&&store.byId(at(p)).qty<store.limit(held.key))
  );
  if(!unique.length)return false;
  const share=right?1:Math.floor(held.qty/unique.length);
  if(share<1)return false;
  let moved=false;
  for(const p of unique){
   if(!cursor||!store.byId(cursor))break;
   const target=at(p);
   if(target){
    if(merge(cursor,target,share)){moved=true;if(!store.byId(cursor))cursor=null;}
   }else{
    const s=store.byId(cursor);
    const n=Math.min(share,s.qty);
    const newId=n===s.qty?cursor:split(cursor,n);
    assign(p,newId);if(newId===cursor)cursor=null;
    moved=true;
   }
  }
  if(moved)change();
  return moved;
 }
 function putAway(){
  normalize();if(!cursor)return;
  let i=slots.findIndex((v,k)=>k<MAIN&&v===null);
  if(i<0)i=slots.findIndex((v,k)=>k>=LENGTH&&v===null);
  if(i<0)i=Math.max(LENGTH,slots.length);
  assign(i,cursor);cursor=null;change();
 }
 function restore(data){
  slots=Array(LENGTH).fill(null);offhand=null;cursor=null;
  if(data&&Array.isArray(data.slots)){
   for(let i=0;i<Math.min(8192,data.slots.length);i++){
    if(i>=MAIN&&i<LENGTH)continue;
    slots[i]=valid(data.slots[i]);
   }
   offhand=valid(data.offhand);cursor=valid(data.cursor);
  }
  normalize();
 }
 function snapshot(){normalize();return {slots:slots.slice(),offhand,cursor}}
 function reset(){slots=Array(LENGTH).fill(null);offhand=null;cursor=null}
 function inspect(){normalize();return {slots:slots.slice(),offhand,cursor,stacks:store.snapshot()}}
 return {normalize,inspect,click,quickMove,swap,drag,collect,distribute,putAway,restore,snapshot,reset,
  hotkey:(from,i)=>swap(from,MAIN+i),moveOffhand:from=>swap(from,'offhand'),
  stackAt:p=>{normalize();return store.byId(at(p))},
  cursorStack:()=>store.byId(cursor),
  pages:()=>{normalize();return 1+Math.ceil(Math.max(0,slots.length-LENGTH)/MAIN)}};
}
window.MineWorldJavaSlots=Object.freeze({create});
})();