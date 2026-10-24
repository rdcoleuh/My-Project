/* MineWorld 4.2 — real per-stack inventory accounting.
   The existing item totals are retained as compatibility counters for game systems.
   Every stack has a stable id and independently consumes to zero. */
(()=>{
 'use strict';
 class StackStore{
   constructor(limits){
     this.limits=limits;this.entries=[];this.nextId=1;
   }
   limit(key){
     const n=Number(this.limits(key));
     return Number.isSafeInteger(n)&&n>=1&&n<=64?n:64;
   }
   byId(id){return Number.isSafeInteger(id)&&id>0?this.entries.find(s=>s.id===id)||null:null}
   count(key){let total=0;for(const s of this.entries)if(s.key===key)total+=s.qty;return total}
   add(key,count,onNew){
     if(typeof key!=='string'||!key||!Number.isSafeInteger(count)||count<=0)return 0;
     const requested=Math.min(count,65535),limit=this.limit(key);
     let remaining=requested;
     // Continue the first not-yet-full stack of this item before creating the next one.
     for(const s of this.entries){
       if(s.key!==key||s.qty>=limit)continue;
       const moved=Math.min(remaining,limit-s.qty);
       s.qty+=moved;remaining-=moved;
       if(!remaining)break;
     }
     while(remaining>0){
       const moved=Math.min(remaining,limit);
       const stack={id:this.nextId++,key,qty:moved};
       this.entries.push(stack);
       remaining-=moved;
       if(typeof onNew==='function')onNew(stack);
     }
     return requested;
   }
   take(key,count,id=null,assignedIds=null){
     if(typeof key!=='string'||!Number.isSafeInteger(count)||count<=0)return 0;
     if(id!==null){
       const stack=this.byId(id);
       if(!stack||stack.key!==key||stack.qty<count)return 0;
       stack.qty-=count;
       if(!stack.qty)this.entries.splice(this.entries.indexOf(stack),1);
       return count;
     }
     if(this.count(key)<count)return 0;
     let remaining=count;
     // For crafting and general costs, spend backpack-only stacks first.
     const assigned=assignedIds||new Set();
     const candidates=this.entries.filter(s=>s.key===key).sort((a,b)=>{
       const aa=assigned.has(a.id)?1:0,bb=assigned.has(b.id)?1:0;
       return aa-bb||b.id-a.id;
     });
     for(const s of candidates){
       const spent=Math.min(s.qty,remaining);
       s.qty-=spent;remaining-=spent;
       if(!s.qty)this.entries.splice(this.entries.indexOf(s),1);
       if(!remaining)break;
     }
     return count;
   }
   reconcile(counts,onNew,assignedIds){
     if(!counts||typeof counts!=='object')return;
     const target=new Map(),actual=new Map();
     for(const [key,value] of Object.entries(counts)){
       const qty=Math.min(65535,Math.max(0,Math.floor(Number(value)||0)));
       if(qty)target.set(key,qty);
     }
     for(const s of this.entries)actual.set(s.key,(actual.get(s.key)||0)+s.qty);
     for(const key of new Set([...target.keys(),...actual.keys()])){
       const delta=(target.get(key)||0)-(actual.get(key)||0);
       if(delta>0)this.add(key,delta,onNew);
       else if(delta<0)this.take(key,-delta,null,assignedIds);
     }
   }
   restore(records,counts){
     this.entries=[];this.nextId=1;
     if(Array.isArray(records)){
       const seen=new Set();
       for(const s of records.slice(0,8192)){
         if(!s||!Number.isSafeInteger(s.id)||s.id<=0||seen.has(s.id)||
            typeof s.key!=='string'||!Object.hasOwn(counts,s.key)||
            !Number.isInteger(s.qty)||s.qty<1||s.qty>this.limit(s.key))continue;
         seen.add(s.id);this.entries.push({id:s.id,key:s.key,qty:s.qty});
         this.nextId=Math.max(this.nextId,s.id+1);
       }
     }
     // Older saves have only aggregate counters. Build their 64-item stack records here.
     this.reconcile(counts,null,new Set());
   }
   snapshot(){return this.entries.map(s=>({id:s.id,key:s.key,qty:s.qty}))}
   clear(){this.entries=[];this.nextId=1}
 }
 window.MineWorldStackInventory={create:limit=>new StackStore(limit)};
})();