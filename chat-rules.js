/* MineWorld 5.8 chat validation and room-scoped rate limiting. */
(()=>{
'use strict';
const LIMIT=160;
function clean(raw){
 if(typeof raw!=='string')return '';
 return raw.replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim().slice(0,LIMIT);
}
function name(raw){
 if(typeof raw!=='string')return 'Builder';
 return raw.replace(/[<>\u0000-\u001f\u007f]/g,'').trim().slice(0,16)||'Builder';
}
function limiter(cooldown=800,maxInWindow=10,windowMs=15000){
 const state=new Map();
 return {
  accept(id,now){
   if(typeof id!=='string'||!id||!Number.isFinite(now))return false;
   const old=state.get(id)||[];
   const recent=old.filter(t=>now-t<windowMs);
   if(recent.length>=maxInWindow||recent.length&&now-recent[recent.length-1]<cooldown)return false;
   recent.push(now);state.set(id,recent);
   return true;
  },
  clear(id){if(id)state.delete(id);else state.clear()}
 };
}
window.MineWorldChatRules=Object.freeze({clean,name,limiter,LIMIT});
})();