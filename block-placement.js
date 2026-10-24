/* MineWorld 5.8 — deterministic block placement helpers for face placement and vertical building. */
(()=>{
'use strict';
const integerPoint=p=>p&&['x','y','z'].every(k=>Number.isInteger(p[k]));
function placement(target,opts={}){
 const {stack=false,get,inside}=opts;
 if(!integerPoint(target)||typeof get!=='function'||typeof inside!=='function')return {ok:false,reason:'Aim at a block'};
 if(!Number.isInteger(target.b)||target.b<=0)return {ok:false,reason:'Aim at a solid block'};
 const p=stack?{x:target.x,y:target.y+1,z:target.z}:target.previous;
 if(!integerPoint(p)||!inside(p.x,p.y,p.z))return {ok:false,reason:'The position is outside this world'};
 if(get(p.x,p.y,p.z)!==0)return {ok:false,reason:stack?'Space directly above this block is occupied':'That position is occupied'};
 return {ok:true,point:p,stack};
}
function stackLimit(key){
 if(typeof key!=='string')return 0;
 if(key.startsWith('block:'))return /^block:[1-9]\d*$/.test(key)?64:0;
 return /sword|pickaxe|axe|shovel|hoe|helmet|chestplate|leggings|boots|armor|elytra|shield|saddle|harness|fishingRod|enchantedRod|boat|raft|minecart|enchanted/i.test(key)?1:64;
}
window.MineWorldBuilding=Object.freeze({placement,stackLimit});
})();