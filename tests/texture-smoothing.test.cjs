/* MineWorld texture smoothing: GPU sampling, local preference, mobile menus. */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const base=path.resolve(__dirname,'..');
const read=name=>fs.readFileSync(path.join(base,name),'utf8');
const source=read('texture-smoothing.js'),html=read('index.html');
function boot(saved){
  const calls=[],store=new Map(saved?[['mineworld-texture-smoothing-v2',saved]]:[]);
  const panels=[{children:[]},{children:[]}];
  class Element{
    constructor(tag){this.tag=tag;this.children=[];this.handlers={};this.style={};this.checked=false;this.attrs={};}
    setAttribute(k,v){this.attrs[k]=v;}
    addEventListener(k,fn){this.handlers[k]=fn;}
    append(...nodes){this.children.push(...nodes);}
    querySelector(key){return this.children.find(c=>c.attrs?.['data-mw-texture-filter'])||null;}
  }
  const gl={TEXTURE0:1,TEXTURE_2D:2,TEXTURE_MIN_FILTER:3,TEXTURE_MAG_FILTER:4,
    LINEAR:5,NEAREST:6,activeTexture(...a){calls.push(['active',...a]);},
    bindTexture(...a){calls.push(['bind',...a]);},
    texParameteri(...a){calls.push(['filter',...a]);},
    isContextLost:()=>false};
  const canvas={style:{},id:'world'};
  const context={window:{},gl,console,
    localStorage:{getItem:key=>store.get(key)||null,setItem:(key,v)=>store.set(key,v)},
    document:{
      querySelector:key=>key.startsWith('#pause')?panels[0]:key.startsWith('#mw-options')?panels[1]:null,
      createElement:tag=>new Element(tag)
    }};
  panels.forEach(p=>{p.querySelector=function(key){return this.children.find(c=>c.attrs?.['data-mw-texture-filter'])||null;};p.append=(...x)=>p.children.push(...x);});
  vm.runInNewContext(source,context,{filename:'texture-smoothing.js'});
  return {api:context.window.MineWorldTextureSmoothing,gl,canvas,calls,store,panels};
}
test('Classic sharp pixel sampling is the default; Smooth stays an optional setting',()=>{
  const x=boot(); const tex={};
  assert.equal(x.api.enabled,false);
  assert.equal(x.api.attach(x.gl,tex,x.canvas),true);
  assert.equal(x.canvas.style.imageRendering,'pixelated');
  assert.ok(x.calls.some(v=>v[0]==='filter'&&v[2]===x.gl.TEXTURE_MIN_FILTER&&v[3]===x.gl.NEAREST));
  x.api.set(false);
  assert.equal(x.store.get(x.api.storageKey),'classic');
  assert.equal(x.canvas.style.imageRendering,'pixelated');
  assert.ok(x.calls.some(v=>v[0]==='filter'&&v[2]===x.gl.TEXTURE_MAG_FILTER&&v[3]===x.gl.NEAREST));
  x.api.set(true);
  assert.equal(x.store.get(x.api.storageKey),'smooth');
  assert.equal(x.canvas.style.imageRendering,'auto');
  assert.ok(x.calls.some(v=>v[0]==='filter'&&v[2]===x.gl.TEXTURE_MIN_FILTER&&v[3]===x.gl.LINEAR));
  assert.equal(x.api.apply(x.gl,tex),true,'resource packs can restore filter without changing worlds');
});
test('existing preference survives page reload; matching controls update in pause and Options',()=>{
  const x=boot('classic');
  x.api.attach(x.gl,{},x.canvas);
  x.api.mountUI();
  assert.equal(x.panels[0].children.length,2);
  assert.equal(x.panels[1].children.length,2);
  assert.equal(x.canvas.style.imageRendering,'pixelated');
  const first=x.panels[0].children[0].children[0];
  const other=x.panels[1].children[0].children[0];
  assert.equal(first.checked,false);
  first.checked=true;first.handlers.change();
  assert.equal(other.checked,true);
  assert.equal(x.canvas.style.imageRendering,'auto');
  x.api.mountUI();
  assert.equal(x.panels[0].children.length,2,'mounting again does not duplicate the option');
});
test('rendering wiring preserves original world saves, resource-pack pixels and skin sampling',()=>{
  assert.ok(html.includes('src="./texture-smoothing.js"'));
  assert.ok(html.includes('MineWorldTextureSmoothing?.attach(gl,atlasTexture,canvas)'));
  assert.ok(html.includes('window.MineWorldTextureSmoothing'));
  assert.ok(html.includes('mineworld-selfhost-v1'));
  assert.ok(html.includes('uAtlas'));
  assert.ok(read('local-resource-pack.js').includes('MineWorldTextureSmoothing?.apply(gl,META.texture)'));
  assert.ok(read('sw.js').includes("'./texture-smoothing.js'"),'offline cache must include smoothing script');
  assert.ok(!source.includes('texImage2D'),'filters must not alter player-supplied artwork');
});

test('old v1 smooth preference does not override new classic-default release',()=>{
  const x=boot();
  assert.equal(x.api.enabled,false);
  assert.equal(x.api.storageKey,'mineworld-texture-smoothing-v2');
  x.api.set(true);
  assert.equal(x.store.get(x.api.storageKey),'smooth');
  const restored=boot('smooth');
  assert.equal(restored.api.enabled,true);
});
