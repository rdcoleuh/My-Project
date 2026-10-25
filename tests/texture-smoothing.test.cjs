/* MineWorld sharp-only GPU filtering regression checks. */
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
function boot(saved){
 const calls=[],store=new Map(saved||[]);
 const panels=[{children:[]},{children:[]}];
 class E{constructor(){this.attrs={};this.style={};this.textContent='';}setAttribute(k,v){this.attrs[k]=v;}}
 for(const p of panels){p.appendChild=x=>p.children.push(x);p.querySelector=()=>p.children[0]||null;}
 const gl={TEXTURE0:1,TEXTURE_2D:2,TEXTURE_MIN_FILTER:3,TEXTURE_MAG_FILTER:4,NEAREST:5,LINEAR:6,
   isContextLost:()=>false,activeTexture(...v){calls.push(['active',...v]);},
   bindTexture(...v){calls.push(['bind',...v]);},
   texParameteri(...v){calls.push(['param',...v]);}};
 const ctx={window:{},localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},
   document:{querySelector:k=>k.startsWith('#pause')?panels[0]:panels[1],createElement:()=>new E()}};
 vm.runInNewContext(read('texture-smoothing.js'),ctx);
 return {api:ctx.window.MineWorldTextureSmoothing,store,calls,gl,panels};
}
test('old saved smooth preference cannot reenable bilinear texture blur',()=>{
 const x=boot([['mineworld-texture-smoothing-v3','smooth']]);
 assert.equal(x.api.enabled,false);
 assert.equal(x.api.attach(x.gl,{},{}),true);
 assert.equal(x.api.set(true),false);
 assert.equal(x.api.enabled,false);
 assert.equal(x.store.get('mineworld-texture-smoothing-v3'),'smooth');
 assert.equal(x.store.get(x.api.storageKey),'classic');
 assert.ok(x.calls.some(c=>c[0]==='param'&&c[2]===x.gl.TEXTURE_MIN_FILTER&&c[3]===x.gl.NEAREST));
 assert.ok(x.calls.some(c=>c[0]==='param'&&c[2]===x.gl.TEXTURE_MAG_FILTER&&c[3]===x.gl.NEAREST));
 assert.ok(!x.calls.some(c=>c[0]==='param'&&c[3]===x.gl.LINEAR));
});
test('resource pack reimport reapplies nearest filtering',()=>{
 const x=boot();x.api.attach(x.gl,{},{});x.calls.length=0;
 assert.equal(x.api.apply(x.gl,{}),true);
 assert.equal(x.calls.filter(c=>c[0]==='param'&&c[3]===x.gl.NEAREST).length,2);
});
test('menus report sharp texture mode and have no smooth checkbox',()=>{
 const x=boot();x.api.mountUI();x.api.mountUI();
 assert.equal(x.panels[0].children.length,1);
 assert.equal(x.panels[1].children.length,1);
 assert.match(x.panels[0].children[0].textContent,/Sharp block pixels: ON/);
});
test('no changes to world saves, imported bitmaps, or mob texture filtering',()=>{
 const html=read('index.html'),src=read('texture-smoothing.js');
 assert.match(html,/MineWorldTextureSmoothing\?\.attach\(gl,atlasTexture,canvas\)/);
 assert.match(read('local-resource-pack.js'),/MineWorldTextureSmoothing\?\.apply\(gl,META\.texture\)/);
 assert.match(read('local-resource-pack.js'),/imageSmoothingEnabled=false/);
 assert.match(read('mob-pixel-art.js'),/NEAREST/);
 assert.match(read('sw.js'),/texture-smoothing\.js/);
 assert.match(html,/mineworld-selfhost-v1/);
 assert.doesNotMatch(src,/texImage2D|LINEAR|imageRendering/);
});