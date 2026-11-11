'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const hud=require('../survival-hud-core.js');
class Node {
 constructor(doc){this.ownerDocument=doc;this.children=[];this.classList={values:[],add:(...v)=>this.classList.values.push(...v)};this.style={};this.attrs={};}
 setAttribute(k,v){this.attrs[k]=v;} appendChild(n){this.children.push(n);} replaceChildren(){this.children=[];}
}
const doc={createElement(){return new Node(doc)}};
const raster='data:image/png;base64,QUJD';
test('atlas UV mapping scales and offsets a selected 16px sprite',()=>{
 const root=new Node(doc);
 hud.render(root,20,20,()=>({url:raster,x:16,y:32,width:16,height:16,atlasWidth:64,atlasHeight:64}));
 const icon=root.children[0].children[0];
 assert.equal(icon.style.backgroundSize,'400% 400%');
 assert.equal(icon.style.backgroundPosition,'33.33333333333333% 66.66666666666666%');
 assert.equal(icon.classList.values.includes('mw-imported-icon'),true);
 assert.equal(root.children[0].attrs['aria-label'],'Health 20 of 20');
});
test('invalid atlas geometry and remote URLs retain procedural fallback',()=>{
 const bad=[
  {url:raster,x:-1,y:0,width:16,height:16,atlasWidth:64,atlasHeight:64},
  {url:raster,x:60,y:0,width:16,height:16,atlasWidth:64,atlasHeight:64},
  {url:raster,x:0,y:0,width:0,height:16,atlasWidth:64,atlasHeight:64},
  {url:raster,x:0.5,y:0,width:16,height:16,atlasWidth:64,atlasHeight:64},
  {url:'https://remote.example/atlas.png',x:0,y:0,width:16,height:16,atlasWidth:64,atlasHeight:64}
 ];
 const root=new Node(doc);let i=0;
 hud.render(root,20,20,()=>bad[(i++)%bad.length]);
 for(const icon of root.children.flatMap(row=>row.children))
  assert.equal(icon.classList.values.includes('mw-imported-icon'),false);
});
