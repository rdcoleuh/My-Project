/* MineWorld 5.8: simulated two-browser PeerJS room chat integration.
 * No external network, DOM, assets, or dependencies. */
const {test}=require('node:test'),assert=require('node:assert/strict'),
 fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const source=f=>fs.readFileSync(path.join(root,f),'utf8');
const net=new Map();let serial=0;
class Emitter{
 constructor(){this.listeners=new Map();}
 on(type,fn){const list=this.listeners.get(type)||[];list.push(fn);this.listeners.set(type,list);return this;}
 emit(type,...args){for(const fn of this.listeners.get(type)||[])fn(...args);}
}
class FakeConn extends Emitter{
 constructor(peer){super();this.peer=peer;this.open=false;this.other=null;}
 send(message){if(this.open&&this.other?.open)queueMicrotask(()=>this.other.emit('data',message));}
 close(){this.open=false;this.emit('close');if(this.other?.open){this.other.open=false;this.other.emit('close');}}
}
class FakePeer extends Emitter{
 constructor(id){super();this.id=id||'mw-test-peer-'+(++serial);net.set(this.id,this);queueMicrotask(()=>this.emit('open',this.id));}
 connect(remote){
  const other=net.get(remote);if(!other)throw Error('No fake host for '+remote);
  const outgoing=new FakeConn(remote),incoming=new FakeConn(this.id);
  outgoing.other=incoming;incoming.other=outgoing;
  queueMicrotask(()=>{
   other.emit('connection',incoming);
   queueMicrotask(()=>{
    outgoing.open=incoming.open=true;
    outgoing.emit('open');incoming.emit('open');
   });
  });
  return outgoing;
 }
 destroy(){net.delete(this.id);this.emit('close');}
}
class Element{
 constructor(id,doc){this.id=id;this.doc=doc;this.value='';this.textContent='';this.disabled=false;
  this.handlers=new Map();this.children=[];this.parentNode=null;this.style={};this.scrollHeight=0;
  const set=new Set(['chatbox','chat-trigger','chat-unread','lobby'].includes(id)?['hidden']:[]);
  this.classList={
   add:(...xs)=>xs.forEach(x=>set.add(x)),remove:(...xs)=>xs.forEach(x=>set.delete(x)),
   contains:x=>set.has(x),toggle:(x,force)=>{const yes=force===undefined?!set.has(x):!!force;if(yes)set.add(x);else set.delete(x);return yes;}
  };
 }
 addEventListener(type,fn){const list=this.handlers.get(type)||[];list.push(fn);this.handlers.set(type,list);}
 dispatch(type,e={}){for(const fn of this.handlers.get(type)||[])fn({...e,stopPropagation(){},preventDefault(){}});}
 click(){this.dispatch('click')}
 appendChild(node){node.parentNode=this;this.children.push(node);return node;}
 remove(){if(this.parentNode)this.parentNode.children.splice(this.parentNode.children.indexOf(this),1);}
 get firstChild(){return this.children[0]||null;}
 replaceChildren(...xs){this.children=[];this.append(...xs);}
 append(...xs){xs.forEach(x=>this.appendChild(x));}
 setAttribute(){}
 focus(){this.doc.activeElement=this;}
 blur(){if(this.doc.activeElement===this)this.doc.activeElement=null;}
 select(){}
}
function browser(playerName){
 const elements=new Map(),store=new Map();
 const doc={activeElement:null,pointerLockElement:null,exitPointerLock(){this.pointerLockElement=null},
  createElement:tag=>new Element(tag,doc),
  createTextNode:text=>({textContent:String(text)}),
  getElementById:id=>{if(!elements.has(id))elements.set(id,new Element(id,doc));return elements.get(id)},
  querySelectorAll:()=>[],head:{appendChild(){}}
 };
 const $=id=>doc.getElementById(id);
 $('player-name').value=playerName;
 const ctx={window:{Peer:FakePeer},document:doc,location:{origin:'https://example.test',pathname:'/mineworld/',href:'https://example.test/mineworld/'},
  URL,console,performance,Date,Map,Set,Math,history:{replaceState(){}},navigator:{clipboard:{writeText:async()=>{}}},
  setTimeout,clearTimeout,queueMicrotask,localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v))}};
 const bridge={
  getMode:()=> 'survival',
  getPlayer:()=>({x:5000,y:20,z:5000,yaw:0,mode:'survival',dimension:'overworld'}),
  getSnapshot:()=>({version:7,worldSize:10000,seed:3,edits:[],netherEdits:[],endEdits:[]}),
  acceptSnapshot:()=>true,
  setMobs(){},getMobs:()=>[],getCombatProfile:()=>({mode:'survival'}),
  applyDamage(){},grantLoot(){},clearChatMovement(){}
 };
 ctx.window.MineWorldBridge=bridge;
 vm.runInNewContext(source('chat-rules.js'),ctx,{filename:'chat-rules.js'});
 vm.runInNewContext(source('multiplayer.js'),ctx,{filename:'multiplayer.js'});
 return {doc,$,api:ctx.window.MineWorldMultiplayer};
}
const settle=()=>new Promise(r=>setTimeout(r,15));
const messages=client=>client.$('chat-log').children.map(item=>item.children.map(child=>child.textContent).join(''));
test('real host and guest data-channel handlers relay chat in both directions and protect nicknames',async()=>{
 const host=browser('Host Builder'),guest=browser('Guest Builder');
 host.$('host-room').click();await settle();
 assert.equal(host.api.getMode(),'host');
 const code=host.$('room-code').value;
 assert.match(code,/mw-test-peer-/);
 guest.$('room-code').value=code;
 guest.$('join-room').click();await settle();await settle();
 assert.equal(guest.api.getMode(),'guest');
 assert.equal(guest.api.isTyping(),false);
 assert.equal(guest.api.openChat(),true);
 assert.equal(guest.api.isTyping(),true);
 guest.$('chat-entry').value='Hello from the guest!';
 guest.$('chat-send').click();await settle();
 assert.ok(messages(host).some(x=>x==='Guest Builder: Hello from the guest!'),JSON.stringify(messages(host)));
 host.api.openChat();
 host.$('chat-entry').value='Hello from the host!';
 host.$('chat-send').click();await settle();
 assert.ok(messages(guest).some(x=>x==='Host Builder: Hello from the host!'),JSON.stringify(messages(guest)));
 assert.ok(host.$('chat-entry').value==='');
 guest.api.closeChat();assert.equal(guest.api.isTyping(),false);
 assert.equal(guest.$('chatbox').classList.contains('mw-chat-collapsed'),true);
 host.$('chat-entry').value='More news';host.api.sendChat();await settle();
 assert.equal(guest.$('chat-unread').classList.contains('hidden'),false);
 assert.equal(guest.$('chat-unread').textContent,'1 new');
 guest.api.openChat();assert.equal(guest.$('chat-unread').classList.contains('hidden'),true);
});
test('solo mode cannot open network chat',()=>{
 const lone=browser('Solo');assert.equal(lone.api.getMode(),'offline');
 assert.equal(lone.api.openChat(),false);
 assert.equal(lone.$('chat-trigger').classList.contains('hidden'),true);
});
