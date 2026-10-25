/* MineWorld 6.7 — original, independently-authored classic-style texture quality.
 * Sample every texel on all faces of all 169 block IDs, including old fallback art.
 */
const {test}=require('node:test'),assert=require('node:assert/strict'),
 fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
function load(){
 const w={window:{},console,Uint8ClampedArray};
 vm.createContext(w);
 for(const p of ['pixel-materials.js','texture-refinement.js','texture-details.js',
  'texture-polish.js','texture-workshop.js','classic-materials.js',
  'texture-clarity.js','readable-materials.js','texture-fidelity.js','utility-materials.js','core-pixel-art.js','texture-facets.js']){
  vm.runInContext(read(p),w,{filename:p,timeout:30000});
 }
 return w.window;
}
const w=load(),P=w.MineWorldPixelMaterials.paint;
function signature(id,face){
 let parts='';
 for(let y=0;y<16;y++)for(let x=0;x<16;x++)parts+=P(id,face,x,y).slice(0,3).join(',')+';';
 return parts;
}
function colorAt(id,face,x,y){return Array.from(P(id,face,x,y));}
test('all 169 block IDs have valid 16×16 faces and unique side materials',()=>{
 const seen=new Set();
 for(let id=1;id<=169;id++){
  for(let face=0;face<3;face++){
   for(let y=0;y<16;y++)for(let x=0;x<16;x++){
    const c=P(id,face,x,y);
    assert.equal(c.length,4,'RGBA size at block '+id);
    assert.ok(c.every(n=>Number.isInteger(n)&&n>=0&&n<=255),'invalid texel '+id+' / '+face+' / '+x+','+y);
   }
  }
  const side=signature(id,1);
  assert.equal(seen.has(side),false,'Two blocks have identical side textures: '+id);
  seen.add(side);
 }
 assert.equal(seen.size,169);
 assert.equal(w.MineWorldReadableMaterials.pixelsPerFace,16);
 assert.ok(w.MineWorldReadableMaterials.ids.length>=70,'Expected broad block-family coverage');
 assert.equal(w.MineWorldTextureFidelity.pixelSize,16);
 assert.ok(w.MineWorldTextureFidelity.improvedIds.length>=120,'Enhanced textures should cover a broad set of blocks');
});
test('logs have coherent vertical bark and different ringed endgrain',()=>{
 for(const id of [5,15,30,32,34,36,38,40,42,78,80]){
  const bark=signature(id,1),top=signature(id,0);
  assert.notEqual(bark,top,'Log '+id+' has no distinctive cut end');
  const center=colorAt(id,0,8,8),outer=colorAt(id,0,0,0);
  assert.notDeepEqual(center,outer,'Log '+id+' end needs heartwood distinct from bark');
  const pal=new Set(Array.from({length:16},(_,y)=>colorAt(id,1,8,y).slice(0,3).join(',')));
  assert.ok(pal.size>3,'Log '+id+' bark looks solid without grain');
 }
});
test('ore families have clear embedded mineral colors and distinct stone hosts',()=>{
 const pairs=[[18,101],[19,102],[95,103],[96,104],[97,105],[98,106],[99,107],[100,108]];
 for(const [regular,deep] of pairs){
  const side=signature(regular,1),deepSide=signature(deep,1);
  assert.notEqual(side,deepSide,'Ore '+regular+' and deepslate '+deep+' look identical');
  assert.notEqual(side,signature(3,1),'Ore '+regular+' indistinguishable from stone');
  assert.notEqual(deepSide,signature(58,1),'Deep ore '+deep+' indistinguishable from deepslate');
  let colored=0;
  for(let y=0;y<16;y++)for(let x=0;x<16;x++){
    const c=P(regular,1,x,y);if(Math.max(...c.slice(0,3))-Math.min(...c.slice(0,3))>28)colored++;
  }
  if(regular!==18)assert.ok(colored>=10,'Ore '+regular+' has too little visible mineral');
  else{
    const darkStone=Array.from({length:256},(_,i)=>P(regular,1,i%16,Math.floor(i/16))).filter(c=>c[0]<95).length;
    assert.ok(darkStone>=10,'Coal must show dark mineral fragments');
  }
 }
});
test('eleven tree leaf families have different intentional palettes and clumped detail',()=>{
 const ids=[6,12,13,14,31,33,35,37,39,41,43];
 assert.equal(new Set(ids.map(id=>signature(id,1))).size,ids.length);
 for(const id of ids){
  const distinct=new Set();
  for(let y=0;y<16;y++)for(let x=0;x<16;x++)
   distinct.add(P(id,1,x,y).slice(0,3).join(','));
  assert.ok(distinct.size>24,'leaf block '+id+' lacks pixel variation');
 }
 const cherry=P(41,1,8,8);
 assert.ok(cherry[0]>=cherry[1]&&cherry[2]>=cherry[1],'cherry colors need pink/magenta tone');
});
test('cobblestone, bricks, planks, stone bricks and Nether structures are each recognisable',()=>{
 for(const [a,b] of [[3,61],[8,53],[53,72],[11,52],[50,70],[75,76],[121,130],[131,132]]){
  assert.notEqual(signature(a,1),signature(b,1),'Indistinguishable blocks '+a+' and '+b);
 }
 const p=P(53,1,0,0),q=P(53,1,4,3);
 assert.notDeepEqual(Array.from(p),Array.from(q),'Stone brick mortar must contrast bricks');
 const grassTop=signature(1,0),grassSide=signature(1,1);
 assert.notEqual(grassTop,grassSide,'Grass side lacks dirt');
});
test('crafting, furnace, storage and workstation textures have hand-authored functional motifs',()=>{
 const devices=[20,109,119,120,136,155,156,157,158,159,160,161,162,163,164,165,166,167,168];
 const seen=new Set();
 for(const id of devices){
  const front=signature(id,1),top=signature(id,0);
  if(id!==109)assert.notEqual(front,top,'Directional device '+id+' needs face-specific artwork');
  assert.equal(seen.has(front),false,'Utility device '+id+' shares its front texture');
  seen.add(front);
 }
 assert.notDeepEqual(colorAt(119,1,8,7),colorAt(119,1,3,7),'Chest requires metallic central latch');
 assert.notDeepEqual(colorAt(168,0,6,6),colorAt(168,0,5,5),'Crafting table requires visible grid');
 assert.ok(w.MineWorldUtilityMaterials.ids.length>=20);
});
test('palette is stable across visits and original Minecraft texture files are not bundled',()=>{
 for(const id of [3,5,6,18,19,30,31,58,72,78,80,99,101,107,121,131]){
  const sample=signature(id,1);
  assert.equal(signature(id,1),sample,'random texture changes across calls for '+id);
 }
 const source=read('readable-materials.js');
 assert.ok(!source.includes('https://'),'new art must not remotely fetch originals');
 assert.ok(!source.includes('fetch('),'new art must not fetch original PNGs');
 const html=read('index.html'),sw=read('sw.js');
 assert.ok(html.includes('src="./readable-materials.js"'));
 assert.ok(html.includes('src="./utility-materials.js"'));
 assert.ok(html.includes('src="./texture-fidelity.js"'));
 assert.ok(sw.includes("'./texture-fidelity.js'"));
 assert.ok(sw.includes("'./core-pixel-art.js'"));
 assert.ok(html.includes('src="./core-pixel-art.js"'));
 assert.equal(w.MineWorldCorePixelArt.pixelSize,16);
 assert.ok(sw.includes("'./readable-materials.js'"));
 assert.ok(sw.includes("'./utility-materials.js'"));
 assert.match(html,/MineWorld 6\.\d+/,'A game version label must be visible');
 const a=html.indexOf('src="./texture-clarity.js"'),b=html.indexOf('src="./readable-materials.js"');
 const c=html.indexOf('src="./texture-fidelity.js"'),d=html.indexOf('src="./utility-materials.js"');
 assert.ok(b<c&&c<d,'fidelity must enhance classic colors without replacing detailed workstation UI');
 assert.ok(a>=0&&a<b,'new source should override previous paint stack');
});

test('crop growth frames have cutout alpha, mature stalks and species-specific colored tops',()=>{
 for(const start of [139,143,147,151]){
  const young=start,mature=start+3;
  const sample=Array.from({length:256},(_,i)=>P(mature,1,i%16,Math.floor(i/16)));
  const youngOpaque=Array.from({length:256},(_,i)=>P(young,1,i%16,Math.floor(i/16))).filter(v=>v[3]>0).length;
  const grownOpaque=sample.filter(v=>v[3]>0).length;
  assert.ok(youngOpaque>0&&grownOpaque>youngOpaque,'mature crops should be fuller '+mature);
  assert.ok(sample.some(v=>v[3]===0),'crop cutout must retain transparent pixels '+mature);
 }
 const species=[142,146,150,154].map(id=>signature(id,1));
 assert.equal(new Set(species).size,4,'crop families should be visibly different');
});
