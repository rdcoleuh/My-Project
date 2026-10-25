/* MineWorld 6.40: extra cardinal cube face slots; no bundled assets or world save changes. */
(()=>{
 'use strict';
 const FIRST=518,LIMIT=1024,DIRS=['north','south','east','west'];
 let active=new Map();
 function plan(models){
  const tiles=new Map();let next=FIRST;
  if(!models?.entries)return {tiles,used:0};
  for(const [id,model] of models){
   const sides=model?.sides;
   if(!Number.isInteger(id)||id<1||id>169||!sides)continue;
   if(new Set(DIRS.map(d=>sides[d]).filter(Boolean)).size<2)continue;
   const row={};
   for(const dir of DIRS)if(sides[dir]&&next<LIMIT)row[dir]={tile:next++,name:sides[dir]};
   if(Object.keys(row).length)tiles.set(id,row);
   if(next>=LIMIT)break;
  }
  return {tiles,used:next-FIRST};
 }
 function commit(rows){
  const next=new Map();
  if(rows?.entries)for(const [id,row] of rows){
   if(!Number.isInteger(id)||id<1||id>169||!row)continue;
   const clean={};
   for(const dir of DIRS){
    const tile=row[dir]?.tile;
    if(Number.isInteger(tile)&&tile>=FIRST&&tile<LIMIT)clean[dir]=tile;
   }
   if(Object.keys(clean).length)next.set(id,Object.freeze(clean));
  }
  active=next;return active.size;
 }
 function tile(id,n){
  if(!Array.isArray(n))return null;
  const dir=n[0]===1?'east':n[0]===-1?'west':n[2]===1?'south':n[2]===-1?'north':null;
  return dir?(active.get(id)?.[dir]??null):null;
 }
 function stats(){let faces=0;for(const row of active.values())faces+=Object.keys(row).length;
  return {blocks:active.size,faces,capacity:LIMIT-FIRST};}
 window.MineWorldJavaDirectionalFaces=Object.freeze({plan,commit,tile,stats});
})();