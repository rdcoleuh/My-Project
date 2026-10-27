/* MineWorld original 11x11 pixel HUD glyphs; no game assets bundled.
 * Each half-heart or half-food icon is one point out of twenty. */
(()=>{
'use strict';
const glyphs=Object.freeze({
 heart:[
 '00111011100','01222122210','12222222221','12222222221',
 '12222222221','01222222210','00122222100','00012221000',
 '00001210000','00000100000','00000000000'
 ],
 food:[
 '00000011100','00000122210','00001222221','00001222221',
 '00000122210','00000012100','00000111000','00101100000',
 '01211000000','00101000000','00010000000'
 ]
});
const palette=Object.freeze({
 heart:[[0,0,0,0],[24,16,19,255],[227,48,64,255],[255,135,145,255],[67,42,49,255]],
 food:[[0,0,0,0],[28,20,14,255],[197,121,49,255],[249,184,86,255],[67,53,37,255]]
});
function pixels(kind,fill){
 const rows=glyphs[kind];if(!rows||!['full','half','empty'].includes(fill))return null;
 const data=new Uint8ClampedArray(11*11*4),colors=palette[kind];
 for(let y=0;y<11;y++)for(let x=0;x<11;x++){
  const value=Number(rows[y][x]);
  // Hearts fill left-to-right; hunger fills right-to-left in the classic HUD.
  // The center column remains empty on a half icon so odd values never
  // visually overstate the underlying 0-20 survival stat.
  const filledHalf=kind==='food'?x>=6:x<5;
  const shade=value===2?(fill==='full'||(fill==='half'&&filledHalf)?2:4):value;
  data.set(colors[shade],(y*11+x)*4);
 }
 return data;
}
function paint(kind,fill){
 const data=pixels(kind,fill);if(!data||!globalThis.document?.createElement)return null;
 const canvas=document.createElement('canvas');canvas.width=11;canvas.height=11;
 canvas.className='mw-stat-fallback';canvas.setAttribute('aria-hidden','true');
 const ctx=canvas.getContext('2d');if(!ctx)return null;
 const image=ctx.createImageData(11,11);image.data.set(data);ctx.putImageData(image,0,0);
 ctx.imageSmoothingEnabled=false;
 return canvas;
}
// One displayed half-icon represents one point of the 0-20 scale.
function points(value){
 const number=Number(value);
 return Number.isFinite(number)?Math.max(0,Math.min(20,Math.floor(number))):0;
}
function slots(value){
 const amount=points(value);
 return Array.from({length:10},(_,i)=>amount>=i*2+2?'full':amount===i*2+1?'half':'empty');
}
function description(kind,value){return kind+': '+points(value)+' of 20';}
window.MineWorldHudArt=Object.freeze({paint,pixels,points,slots,description});
})();