'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const hud=require('../survival-hud-core.js');
test('ten icons always represent the 0–20 survival range',()=>{
 for(let n=0;n<=20;n++){const icons=hud.icons(n);assert.equal(icons.length,10);assert.equal(icons.filter(x=>x==='full').length,n>>1);assert.equal(icons.filter(x=>x==='half').length,n%2);}
});
test('fractional values quantize down to half icons and clamp invalid inputs',()=>{
 assert.deepEqual(hud.icons(19.9).slice(-2),['full','half']);
 assert.equal(hud.normalize(-10),0);
 assert.equal(hud.normalize(Infinity),0);
 assert.equal(hud.normalize(NaN),0);
 assert.equal(hud.normalize(100),20);
});
test('health and food have independent accessible labels',()=>{
 const m=hud.model(7,13);
 assert.equal(m.healthLabel,'Health 7 of 20');
 assert.equal(m.foodLabel,'Food 13 of 20');
 assert.equal(m.hearts.filter(x=>x==='half').length,1);
 assert.equal(m.hunger.filter(x=>x==='half').length,1);
});

test('render builds 20 accessible icons and falls back when pack lookup throws',()=>{
 class Node {
  constructor(tag,doc){this.tagName=tag;this.ownerDocument=doc;this.children=[];this.attrs={};this.classList={values:[],add:(...v)=>this.classList.values.push(...v)};this.style={};}
  setAttribute(k,v){this.attrs[k]=v;}
  appendChild(n){this.children.push(n);}
  replaceChildren(){this.children=[];}
 }
 const doc={createElement(tag){return new Node(tag,doc)}};
 const root=new Node('div',doc);
 const state=hud.render(root,5,19,()=>{throw Error('pack unavailable')});
 assert.equal(state.health,5);
 assert.equal(root.children.length,2);
 assert.equal(root.children[0].children.length,10);
 assert.equal(root.children[1].children.length,10);
 assert.equal(root.children[0].attrs['aria-label'],'Health 5 of 20');
 assert.equal(root.children[1].attrs['aria-label'],'Food 19 of 20');
 assert.equal(root.children[0].children.filter(x=>x.classList.values.includes('mw-half')).length,1);
 assert.equal(root.children[0].children.filter(x=>x.classList.values.includes('mw-imported-icon')).length,0);
});
test('render accepts player-local image URLs and rejects external remote images',()=>{
 class Node {
  constructor(doc){this.ownerDocument=doc;this.children=[];this.classList={values:[],add:(...v)=>this.classList.values.push(...v)};this.style={};}
  setAttribute(){} appendChild(n){this.children.push(n)} replaceChildren(){this.children=[]}
 }
 const doc={createElement(){return new Node(doc)}};const root=new Node(doc);
 hud.render(root,20,20,(kind)=>kind==='heart'?'blob:local-test':'https://example.com/remote.png');
 assert.equal(root.children[0].children.filter(x=>x.classList.values.includes('mw-imported-icon')).length,10);
 assert.equal(root.children[1].children.filter(x=>x.classList.values.includes('mw-imported-icon')).length,0);
});

test('imported sprite URLs reject CSS injection and SVG data while accepting raster data',()=>{
 class Node {
  constructor(doc){this.ownerDocument=doc;this.children=[];this.classList={values:[],add:(...v)=>this.classList.values.push(...v)};this.style={};}
  setAttribute(){} appendChild(n){this.children.push(n)} replaceChildren(){this.children=[]}
 }
 const doc={createElement(){return new Node(doc)}};const root=new Node(doc);
 const attempts=['data:image/svg+xml;base64,PHN2Zz4=','blob:ok") ; color:red; /*','data:image/png;base64,QUJD','blob:local-valid'];
 let index=0;
 hud.render(root,20,20,()=>attempts[(index++)%attempts.length]);
 const icons=root.children.flatMap(row=>row.children);
 assert.equal(icons[0].classList.values.includes('mw-imported-icon'),false);
 assert.equal(icons[1].classList.values.includes('mw-imported-icon'),false);
 assert.equal(icons[2].classList.values.includes('mw-imported-icon'),true);
 assert.equal(icons[3].classList.values.includes('mw-imported-icon'),true);
});
