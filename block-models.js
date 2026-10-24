/* MineWorld 5.0 — simplified block model proportions informed by Minecraft Wiki dimensions.
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
    63:make(6,0,6,10,16,10), // Pointed dripstone simplified thin spire
    70:make(0,0,0,16,14,16), // Soul sand: 14/16 high, per Wiki
    59:make(5,0,5,11,10,11), // Lantern: narrow decorative metal body
    62:make(1,0,1,15,2,15), // Glow lichen: a thin surface-like layer (simplified orientation)
    77:make(6,0,6,10,12,10), // Crimson roots: low spindly vegetation
    82:make(6,0,6,10,12,10), // Warped roots
    93:make(6,0,6,10,16,10), // Twisting vines
    94:make(6,0,6,10,16,10), // Weeping vines
    122:make(5,0,5,11,16,11), // Chorus plant: narrow branching stem
    123:make(3,0,3,13,16,13), // Chorus flower
    124:make(4,0,4,12,14,12), // End crystal: floating decorative form
    125:make(0,0,0,16,13,16), // End portal frame: short block
    128:make(7,0,7,9,16,9), // End rod: 2-pixel-wide pole
    159:make(4,0,4,12,11,12), // Brewing stand: simplified tabletop body
    163:make(3,0,3,13,15,13), // Lectern body
    164:make(0,0,0,16,9,16), // Stonecutter: waist-high work surface
    167:make(2,0,2,14,14,14), // Grindstone assembly
    169:make(0,0,0,16,9,16), // red bed: 9-pixel-high simplified single-block bed
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
