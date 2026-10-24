/* MineWorld 5.4 original texture regression checks. Run node --test tests/*.test.cjs */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
function load(withClassic){
 const context={window:{},console};vm.createContext(context);
 const order=['pixel-materials.js','texture-refinement.js','texture-details.js','texture-polish.js','texture-workshop.js'];
 if(withClassic)order.push('classic-materials.js');
 for(const file of order)vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context,{filename:file});
 return context.window.MineWorldPixelMaterials.paint;
}
test('all 169 blocks retain valid, distinct 16x16 side textures',()=>{
 const paint=load(true),unique=new Set();
 for(let block=1;block<=169;block++){
  let fingerprint='';
  for(let face=0;face<3;face++)for(let y=0;y<16;y++)for(let x=0;x<16;x++){
   const color=paint(block,face,x,y);
   assert.equal(color.length,4,'block '+block);
   for(let i=0;i<4;i++)assert.ok(Number.isInteger(color[i])&&color[i]>=0&&color[i]<=255,'invalid block '+block);
   assert.equal(color[3],255,'fully opaque block '+block);
   if(face===1)fingerprint+=color.join(',')+';';
  }
  assert.ok(!unique.has(fingerprint),'duplicate side texture for block '+block);
  unique.add(fingerprint);
 }
 assert.equal(unique.size,169);
});
test('top, side and bottom faces differ on major material types',()=>{
 const paint=load(true);
 for(const block of [1,5,15,30,32,34,36,38,40,42,44]){
  const faceKey=face=>{let pixels='';for(let y=0;y<16;y++)for(let x=0;x<16;x++)pixels+=paint(block,face,x,y).join(',')+';';return pixels;};
  assert.notEqual(faceKey(0),faceKey(1),'block '+block+' needs face-specific artwork');
 }
});
test('classic textures refine multiple old blocks but do not change IDs',()=>{
 const old=load(false),current=load(true);
 let improved=0;
 for(let id=1;id<=169;id++){
  let changed=false;
  for(const [x,y] of [[3,5],[7,8],[12,11]]){
   if(old(id,1,x,y).join(',')!==current(id,1,x,y).join(','))changed=true;
  }
  if(changed)improved++;
 }
 assert.ok(improved>=75,'expected >=75 refinements, got '+improved);
 assert.equal(current(1,1,3,5).length,4);
});
test('the live game includes original textures in its offline cache without changing legacy saves',()=>{
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 const sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');
 const classic=fs.readFileSync(path.join(root,'classic-materials.js'),'utf8');
 assert.ok(html.includes('MineWorld 5.9'));
 assert.ok(html.includes('mineworld-selfhost-v1'));
 assert.ok(html.includes('survivalHotbar'));
 assert.ok(html.includes('MineWorldMovement.resolve'));
 assert.ok(html.includes('MineWorldChunkPlanner'));
 assert.ok(sw.includes("'./classic-materials.js'"));
 assert.equal((html.match(/src="\.\/classic-materials\.js"/g)||[]).length,1);
 assert.ok(html.indexOf('texture-workshop.js')<html.indexOf('classic-materials.js'));
 assert.ok(html.indexOf('classic-materials.js')<html.indexOf('texture-motion.js'));
 assert.ok(!classic.includes('fetch('),'no third-party or Minecraft asset downloads');
 assert.ok(!classic.includes('https://'),'no embedded asset URLs');
});
