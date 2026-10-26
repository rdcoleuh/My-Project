/* Original MineWorld adapter for player-imported Java hotbar sprites.
 * The standard nine-cell bar has a 182x22 canvas and 20x20 cell interiors.
 * Coordinates are computed on source pixel edges; no bitmap is distributed.
 */
(()=>{
'use strict';
function slotRect(width,height,index){
 if(!Number.isInteger(width)||!Number.isInteger(height)||
    !Number.isInteger(index)||index<0||index>8)return null;
 const scale=width/182;
 if(scale<0.5||Math.abs(height-22*scale)>0.51)return null;
 const x=Math.round((1+20*index)*scale),y=Math.round(scale);
 const right=Math.round((21+20*index)*scale),bottom=Math.round(21*scale);
 if(x<0||y<0||right>width||bottom>height||right<=x||bottom<=y)return null;
 return Object.freeze({x,y,width:right-x,height:bottom-y});
}
window.MineWorldHotbarUV=Object.freeze({slotRect});
})();
