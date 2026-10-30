'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const start=html.indexOf('const paintStat=(node,value,symbol,emptySymbol,kind)=>{');
const end=html.indexOf("\n    paintStat($('health-text')",start);
assert.ok(start>=0&&end>start,'extract actual production HUD renderer');
const renderer=html.slice(start,end);
class Element {
 constructor(tag='div'){
  this.tag=tag;this.children=[];this.dataset={};this.attributes={};
  this.isConnected=true;this.className='';
  this.classList={add:name=>{this.className+=' '+name;}};
 }
 appendChild(node){node.isConnected=this.isConnected;this.children.push(node);return node;}
 replaceChildren(...nodes){
  for(const node of this.children)node.isConnected=false;
  this.children=[];for(const node of nodes)this.appendChild(node);
 }
 setAttribute(name,value){this.attributes[name]=value;}
}
function setup(art){
 const pack={generation:5,hudIcon:async(kind,fill)=>art[fill]||null};
 const window={MineWorldLocalTextures:pack,MineWorldHudArt:{
  points:value=>value,slots:value=>Array.from({length:10},(_,i)=>value>=i*2+2?'full':value===i*2+1?'half':'empty'),
  paint:()=>new Element('canvas'),description:(kind,value)=>kind+': '+value+' of 20'
 }};
 const document={createElement:tag=>new Element(tag)};
 const cachedStatArt=(source,glyph,fill)=>Promise.resolve(source.hudIcon(glyph,fill));
 const paint=new Function('document','window','currentPack','packChanged','cachedStatArt',
  renderer+'return paintStat;')(document,window,pack,false,cachedStatArt);
 return {paint,window,pack};
}
const flush=()=>new Promise(resolve=>setTimeout(resolve,15));
test('imported full + empty without half uses matching player-owned empty backdrop',async()=>{
 const {paint}=setup({full:'data:full-heart',empty:'data:empty-heart'});
 const node=new Element();
 paint(node,19,'♥','♡','Health');
 await flush();
 assert.equal(node.children.length,10);
 const half=node.children[9];
 assert.equal(half.className,'mw-stat-icon half');
 assert.equal(half.children.length,2);
 assert.equal(half.children[0].tag,'img');
 assert.equal(half.children[0].src,'data:empty-heart');
 assert.match(half.children[0].className,/mw-pack-stat-underlay/);
 assert.equal(half.children[1].src,'data:full-heart');
 assert.match(half.children[1].className,/mw-pack-stat-clipped/);
 assert.equal(node.attributes['aria-label'],'Health: 19 of 20');
});
test('missing imported empty art retains original procedural backdrop',async()=>{
 const {paint}=setup({full:'data:full-heart'});
 const node=new Element();
 paint(node,19,'♥','♡','Health');
 await flush();
 assert.equal(node.children[9].children[0].tag,'canvas');
 assert.equal(node.children[9].children[1].tag,'img');
});
test('stale asynchronous empty lookup cannot overwrite a replaced pack',async()=>{
 let release;
 const {paint,window,pack}=setup({full:'data:full-heart'});
 pack.hudIcon=(kind,fill)=>fill==='empty'?new Promise(resolve=>{release=resolve;}):
   Promise.resolve(fill==='full'?'data:full-heart':null);
 const node=new Element();
 paint(node,19,'♥','♡','Health');
 await flush();
 assert.equal(typeof release,'function');
 window.MineWorldLocalTextures={generation:5,hudIcon:()=>null};
 release('data:stale-empty');
 await flush();
 assert.equal(node.children[9].children.length,1);
 assert.equal(node.children[9].children[0].tag,'canvas');
});
test('desktop and mobile browser smoke checks imported half underlay pixels',()=>{
 const smoke=fs.readFileSync(path.join(__dirname,'..','scripts','browser-smoke.cjs'),'utf8');
 assert.match(smoke,/makeTestArchive\('half-with-empty'\)/);
 assert.match(smoke,/underlay\.src===empty/);
 assert.match(smoke,/mobile-half-heart-imported-empty-synthetic\.png/);
 assert.match(smoke,/desktop-half-heart-imported-empty-synthetic\.png/);
 assert.match(html,/\.mw-pack-stat-underlay\{[^}]*image-rendering:pixelated/);
});
