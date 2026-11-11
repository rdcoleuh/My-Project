'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const hud=require('../survival-hud-core.js');
class Node {
 constructor(doc){this.ownerDocument=doc;this.children=[];this.style={};this.classList={values:[],add:(...v)=>this.classList.values.push(...v)};}
 setAttribute(){} appendChild(n){this.children.push(n);} replaceChildren(){this.children=[];}
}
const doc={createElement(){return new Node(doc)}};
const url='data:image/png;base64,QUJD';
function icon(sprite){const root=new Node(doc);hud.render(root,20,20,()=>({url,...sprite}));return root.children[0].children[0];}
test('large atlas dimensions are rejected without allocating a background',()=>{
 const node=icon({x:0,y:0,width:16,height:16,atlasWidth:16385,atlasHeight:16385});
 assert.equal(node.style.backgroundImage,undefined);
 assert.equal(node.classList.values.includes('mw-imported-icon'),false);
});
test('maximum supported atlas can resolve its last pixel',()=>{
 const node=icon({x:16383,y:16383,width:1,height:1,atlasWidth:16384,atlasHeight:16384});
 assert.match(node.style.backgroundImage,/data:image\/png/);
 assert.equal(node.style.backgroundPosition,'100% 100%');
});
test('out-of-range coordinates fall back without CSS sprite styles',()=>{
 const node=icon({x:16384,y:0,width:1,height:1,atlasWidth:16384,atlasHeight:16384});
 assert.equal(node.style.backgroundImage,undefined);
 assert.equal(node.style.backgroundSize,undefined);
});
