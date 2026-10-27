/* Original MineWorld adapter for player-imported Java hotbar sprites.
 * The standard nine-cell bar has a 182x22 canvas and 20x20 cell interiors.
 * Also supports seamless 180x20 nine-cell GUI sheets from imported packs.
 * Coordinates are computed on source pixel edges; no bitmap is distributed.
 */
(()=>{
'use strict';
function slotRect(width,height,index){
 if(!Number.isInteger(width)||!Number.isInteger(height)||
    !Number.isInteger(index)||index<0||index>8)return null;
 // Java's bordered 182x22 sheet and Bedrock-style seamless 180x20
 // sheets both contain nine 20-pixel cells. Require matching dimensions
 // so unrelated GUI art cannot be misinterpreted as a nine-slot bar.
 const bordered=width/182, seamless=width/180;
 const java=bordered>=0.5&&Math.abs(height-22*bordered)<0.01;
 const bedrock=seamless>=0.5&&Math.abs(height-20*seamless)<0.01;
 if(!java&&!bedrock)return null;
 const scale=java?bordered:seamless,edge=java?1:0;
 const x=Math.round((edge+20*index)*scale),y=Math.round(edge*scale);
 const right=Math.round((edge+20*(index+1))*scale);
 const bottom=Math.round((edge+20)*scale);
 if(x<0||y<0||right>width||bottom>height||right<=x||bottom<=y)return null;
 return Object.freeze({x,y,width:right-x,height:bottom-y});
}
window.MineWorldHotbarUV=Object.freeze({slotRect});
})();
