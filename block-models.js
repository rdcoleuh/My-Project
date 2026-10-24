/* MineWorld 4.9 — block model proportions informed by public Minecraft Wiki dimensions.
 * Original geometry definitions; no game assets or copyrighted images. Default: 16x16x16.
 * Nonfull blocks use model-space fractions of the 16-pixel grid. */
(()=>{
  'use strict';
  const px=n=>n/16;
  const make=(left,bottom,front,right,top,back)=>Object.freeze({
    left:px(left),bottom:px(bottom),front:px(front),right:px(right),top:px(top),back:px(back)
  });
  const shapes=Object.freeze({
    17:make(4,0,4,12,10,12),   // mushroom: small, squat
    44:make(.5,0,.5,15.5,16,15.5), // cactus: 15x16x15 centered
    45:make(5,0,5,11,16,11),   // bamboo: narrower stalk
    119:make(.5,0,.5,15.5,14,15.5), // treasure chest: 15x14x15
    120:make(.5,0,.5,15.5,14,15.5), // opened chest
    129:make(1,0,1,15,16,15), // dragon egg: inset
    137:make(0,0,0,16,15,16), // dry farmland: 15/16 tall
    138:make(0,0,0,16,15,16), // hydrated farmland
  });
  const FULL=Object.freeze({left:0,bottom:0,front:0,right:1,top:1,back:1});
  const isPartial=id=>Object.hasOwn(shapes,id);
  window.MineWorldBlockModels=Object.freeze({
    shape:id=>shapes[id]||FULL,isPartial,
    variants:Object.keys(shapes).map(Number),
    texturePixels:16,normalBlockMeters:1
  });
})();
