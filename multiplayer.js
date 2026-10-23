/* MineWorld Together multiplayer. Game engine is original; PeerJS is used for WebRTC signaling only. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const bridge = window.MineWorldBridge;
  if (!bridge) { console.error('MineWorld game bridge not available'); return; }
  const peers = new Map();
  const sockets = new Map();
  let peer = null, host = null, role = 'offline', roomId = '', ready = false;
  let nickname = 'Builder', lastSend = 0, loadPromise = null, guestWorld = false;
  const MAX_GUESTS = 6;
  const roomParam = new URL(location.href).searchParams.get('room');
  function validId(id) { return /^[A-Za-z0-9][A-Za-z0-9_-]{0,100}[A-Za-z0-9]$/.test(id) || /^[A-Za-z0-9]$/.test(id); }
  function label() { return nickname.replace(/[<>]/g,'').trim().slice(0,16)||'Builder'; }
  function setStatus(message) { $('room-status').textContent = message; }
  function talk(name, message, system = false) {
    const entry = document.createElement('div');
    if(system) entry.style.color = '#c0ed87';
    const who = document.createElement('b'); who.textContent = system ? '• ' : String(name).slice(0,16)+': ';
    entry.appendChild(who); entry.appendChild(document.createTextNode(String(message).slice(0,160)));
    $('chat-log').appendChild(entry);
    while($('chat-log').children.length>40) $('chat-log').firstChild.remove();
    $('chat-log').scrollTop = $('chat-log').scrollHeight;
  }
  function updateUI() {
    const count = role==='host' ? sockets.size : (role==='guest' && ready ? peers.size : 0);
    $('online-count').textContent = String(count);
    $('online-hud').classList.toggle('hidden', role==='offline');
    $('online-hud').textContent = role==='host' ? `👥 Hosting · ${count+1} playing` : role==='guest' ? `👥 ${ready?'Connected':'Connecting'} · ${count+1} players` : '';
    $('chatbox').classList.toggle('hidden',role==='offline');
    $('roster').textContent = 'Players: '+[label(),...Array.from(peers.values()).map(p=>p.name)].join(', ');
    $('copy-room').disabled = role!=='host' || !roomId;
    $('leave-room').disabled = role==='offline';
    if(role==='host')$('room-code').value=roomId;
  }
  function openLobby() {
    $('lobby').classList.remove('hidden');
    if(document.pointerLockElement) document.exitPointerLock();
    try { nickname = ($('player-name').value||'Builder').trim().slice(0,16)||'Builder'; }
    catch(_){}
    if(role==='offline')setStatus('Offline. Host a room or paste a friend’s invitation link.');
    updateUI();
  }
  function closeLobby() { $('lobby').classList.add('hidden'); }
  function createInvite() { const u = new URL(location.origin+location.pathname); u.searchParams.set('room',roomId); return u.toString(); }
  function cleanup(reason) {
    if(peer) {const old=peer; peer=null; try{old.destroy()}catch(_){}}
    host=null;
    for(const c of sockets.values())try{c.close()}catch(_){}
    sockets.clear();peers.clear();ready=false;roomId='';role='offline';
    history.replaceState(null,'',location.pathname);
    updateUI();
    if(reason)setStatus(reason);
  }
  function peerLibrary() {
    if(window.Peer) return Promise.resolve(window.Peer);
    if(loadPromise)return loadPromise;
    loadPromise=new Promise((resolve,reject)=>{
      const script=document.createElement('script');
      script.src='https://cdn.jsdelivr.net/npm/peerjs@1.5.5/dist/peerjs.min.js';
      script.crossOrigin='anonymous';
      script.onload=()=>window.Peer?resolve(window.Peer):reject(Error('PeerJS did not initialize'));
      script.onerror=()=>reject(Error('Could not load multiplayer connection library'));
      document.head.appendChild(script);
    }).catch(e=>{loadPromise=null;throw e});
    return loadPromise;
  }
  function send(conn,payload) {
    try { if(conn && conn.open)conn.send(payload); } catch(e) { console.warn('Send failed',e); }
  }
  function broadcast(payload, exclude) {
    for(const [id,conn] of sockets)if(id!==exclude)send(conn,payload);
  }
  function cleanPlayer(data) {
    if(!data||typeof data!=='object')return null;
    const x=Number(data.x),y=Number(data.y),z=Number(data.z);
    if(![x,y,z].every(Number.isFinite))return null;
    if(x<0||x>64||y<-2||y>40||z<0||z>64)return null;
    return {x,y,z,yaw:Number.isFinite(data.yaw)?data.yaw:0, pitch:Number.isFinite(data.pitch)?data.pitch:0,name:String(data.name||'Friend').replace(/[<>]/g,'').slice(0,16)};
  }
  function receiveHostData(conn,message) {
    if(!message||typeof message!=='object'||conn.peer!==host?.peer)return;
    if(message.t==='snapshot') {
      if(bridge.acceptSnapshot(message.world)) {
        ready=true;peers.clear();
        for(const p of message.players||[])if(p && p.id && p.id!==peer.id){const state=cleanPlayer(p.state);if(state)peers.set(p.id,state)}
        setStatus('Connected to host! Tap “Back to Game,” then Play or Resume.');
        talk('', 'Shared world loaded. You can mine and build with friends.', true);
        updateUI();
      } else setStatus('Unable to load the shared world (incompatible save data).');
    }
    if(!ready)return;
    if(message.t==='edit') { bridge.remoteEdit(message.i,message.b); }
    if(message.t==='state') {
      if(message.id!==peer.id){const state=cleanPlayer(message.state);if(state)peers.set(message.id,state);}
      updateUI();
    }
    if(message.t==='leave'){peers.delete(message.id);updateUI();}
    if(message.t==='chat'){talk(message.name,message.text);}
    if(message.t==='world' && bridge.acceptSnapshot(message.world)) {
      talk('','Host generated a new world!',true);
    }
    if(message.t==='reject'){setStatus('Host room is full or unavailable.');host?.close();}
  }
  function receiveGuestData(conn,message) {
    if(!message||typeof message!=='object'||!sockets.has(conn.peer))return;
    if(message.t==='hello') {
      const existing=peers.get(conn.peer)||{x:32,y:17,z:32,name:'Friend'};
      existing.name=String(message.name||'Friend').replace(/[<>]/g,'').trim().slice(0,16)||'Friend';
      peers.set(conn.peer,existing);
      send(conn,{t:'snapshot',world:bridge.getSnapshot(),players:[{id:peer.id,state:{...bridge.getPlayer(),name:label()}},...Array.from(peers.entries()).filter(([id])=>id!==conn.peer).map(([id,state])=>({id,state}))]});
      const who=existing.name;
      talk('',who+' joined the world',true);
      broadcast({t:'chat',name:'System',text:who+' joined the world'},conn.peer);
      updateUI();
    } else if(message.t==='edit') {
      if(Number.isInteger(message.i)&&Number.isInteger(message.b) && bridge.remoteEdit(message.i,message.b)){
        broadcast({t:'edit',i:message.i,b:message.b});
      }
    } else if(message.t==='state') {
      const state=cleanPlayer({...message.state,name:peers.get(conn.peer)?.name||'Friend'});
      if(state){peers.set(conn.peer,state);broadcast({t:'state',id:conn.peer,state},conn.peer)}
    } else if(message.t==='chat') {
      const m=String(message.text||'').slice(0,160).trim();
      if(m){const n=peers.get(conn.peer)?.name||'Friend';talk(n,m);broadcast({t:'chat',name:n,text:m});}
    }
  }
  function onGuest(conn) {
    if(role!=='host'){conn.close();return}
    if(sockets.size>=MAX_GUESTS) {
      conn.on('open',()=>{send(conn,{t:'reject'});conn.close()});
      return;
    }
    sockets.set(conn.peer,conn);
    conn.on('data',m=>receiveGuestData(conn,m));
    conn.on('close',()=>{
      if(sockets.get(conn.peer)===conn){sockets.delete(conn.peer);const n=peers.get(conn.peer)?.name||'Friend';peers.delete(conn.peer);broadcast({t:'leave',id:conn.peer});talk('',n+' left the room',true);updateUI();}
    });
    conn.on('error',err=>console.warn('Guest connection error',err));
    updateUI();
  }
  async function createRoom() {
    if(role!=='offline'){setStatus('Leave the current room before hosting another.');return}
    nickname=label();$('host-room').disabled=true;
    setStatus('Creating room… Connecting to free PeerJS signaling server.');
    try{
      const Peer=await peerLibrary();
      role='host';ready=true;
      const p=peer=new Peer(undefined,{debug:1});
      p.on('open',id=>{if(p!==peer)return;roomId=id;
        setStatus('Room created! Send your friend the invite link with “Copy Invite Link.” Keep this tab open.');
        updateUI();talk('','Room is ready. Invite up to 6 friends.',true);
      });
      p.on('connection',conn=>{if(p===peer)onGuest(conn)});
      p.on('error',err=>{if(p!==peer)return;setStatus('Connection service error: '+(err.type||err.message||'Unknown'));});
      p.on('disconnected',()=>{if(p===peer)setStatus('Signaling connection lost. Existing friends may still be connected.');});
    }catch(e){cleanup('Could not create room: '+e.message);}
    finally{$('host-room').disabled=false;updateUI()}
  }
  async function joinRoom(){
    if(role!=='offline'){setStatus('Leave your current room before joining another.');return;}
    let code=$('room-code').value.trim();
    if(code.includes('://')){try{code=new URL(code).searchParams.get('room')||''}catch(_){}}
    if(!validId(code)){setStatus('Paste a valid MineWorld invite link or room code.');return}
    nickname=label();$('join-room').disabled=true;
    setStatus('Connecting to '+code+'…');
    try{
      const Peer=await peerLibrary();role='guest';guestWorld=true;roomId=code;
      const p=peer=new Peer(undefined,{debug:1});
      p.on('open',()=>{
        if(p!==peer)return;
        const conn=host=p.connect(code,{reliable:true,serialization:'json',metadata:{name:nickname}});
        conn.on('open',()=>{if(conn===host){setStatus('Connected. Downloading host world…');send(conn,{t:'hello',name:label()});}});
        conn.on('data',message=>receiveHostData(conn,message));
        conn.on('close',()=>{if(conn===host){host=null;ready=false;peers.clear();setStatus('Host disconnected. The shared room is no longer live. Reload to return to your saved solo world.');updateUI()}});
        conn.on('error',err=>setStatus('Could not connect to room: '+(err.message||'connection error')));
      });
      p.on('error',err=>{if(p===peer)setStatus('Join failed: '+(err.type||err.message||'Unknown connection error'))});
      updateUI();
    }catch(e){cleanup('Could not join: '+e.message)}
    finally{$('join-room').disabled=false}
  }
  function localEdit(i,b){
    if(role==='host')broadcast({t:'edit',i,b});
    else if(role==='guest' && ready)send(host,{t:'edit',i,b});
  }
  function tick(t){
    if(t-lastSend<120||role==='offline'||!ready)return;
    lastSend=t;
    const state={...bridge.getPlayer(),name:label()};
    if(role==='host')broadcast({t:'state',id:peer.id,state});
    else send(host,{t:'state',state});
  }
  function sendChat(){
    const input=$('chat-entry');const message=input.value.trim().slice(0,160);input.value='';
    if(!message||role==='offline'||!ready)return;
    talk(label(),message);
    if(role==='host')broadcast({t:'chat',name:label(),text:message});
    else send(host,{t:'chat',text:message});
  }
  window.MineWorldMultiplayer={
    localEdit,tick,isGuest:()=>guestWorld,getRemotes:()=>Array.from(peers.values()),
    broadcastWorld:()=>{if(role==='host'){broadcast({t:'world',world:bridge.getSnapshot()});updateUI();}},
    getMode:()=>role
  };
  for(const id of ['friends-toggle','welcome-friends','pause-friends'])$(id)?.addEventListener('click',openLobby);
  $('close-lobby').addEventListener('click',closeLobby);
  $('host-room').addEventListener('click',createRoom);
  $('join-room').addEventListener('click',joinRoom);
  $('leave-room').addEventListener('click',()=>{const wasGuest=guestWorld;cleanup('You left the room.');if(wasGuest)location.reload();});
  $('copy-room').addEventListener('click',async()=>{
    if(!roomId||role!=='host')return;
    const invite=createInvite();
    try{await navigator.clipboard.writeText(invite);setStatus('Invite link copied! Send it to a friend.');}
    catch(_){$('room-code').value=invite;$('room-code').select();setStatus('Invite link selected. Copy it and send it to a friend.');}
  });
  $('chat-send').addEventListener('click',sendChat);
  $('chat-entry').addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Enter'){sendChat();e.preventDefault();}});
  $('player-name').addEventListener('keydown',e=>e.stopPropagation());
  $('room-code').addEventListener('keydown',e=>e.stopPropagation());
  $('player-name').addEventListener('change',()=>{nickname=label();try{localStorage.setItem('mineworld-name',nickname)}catch(_){}updateUI()});
  try {const saved=localStorage.getItem('mineworld-name');if(saved)$('player-name').value=saved.slice(0,16)}catch(_){}
  nickname=label();
  if(roomParam && validId(roomParam)){
    $('room-code').value=roomParam;
    $('lobby').classList.remove('hidden');
    setStatus('Your friend invited you! Enter a name and tap Join Room.');
  }
  updateUI();
})();