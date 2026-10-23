/* MineWorld Together multiplayer. Game engine is original; PeerJS is used for WebRTC signaling only. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const bridge = window.MineWorldBridge;
  if (!bridge) { console.error('MineWorld game bridge not available'); return; }
  const peers = new Map();
  const sockets = new Map();
  let peer = null, host = null, role = 'offline', roomId = '', ready = false;
  let nickname = 'Builder', lastSend = 0, lastMobSend=0, loadPromise = null, guestWorld = false, publicWorld = '', isConnectingPublic = false, exitPending = false;
  let pvp=false;
  const attackTimes=new Map(), hitTimes=new Map();
  const MAX_GUESTS = 6;
  const PUBLIC = Object.freeze({
    evergreen:{name:'Evergreen',id:'mineworld-pub-v34-villagers-evergreen',seed:17492331},
    sunset:{name:'Sunset Valley',id:'mineworld-pub-v34-villagers-sunset',seed:8342193},
    highlands:{name:'Highlands',id:'mineworld-pub-v34-villagers-highlands',seed:5173268}
  });
  const publicParam = new URL(location.href).searchParams.get('server');
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
  function updatePvpUI(){
    const b=$('pvp-toggle');
    b.textContent='⚔ PvP: '+(pvp?'ON · Players can fight':'OFF · Friendly building')+(role==='host'?' · Tap to change':' · Host controls');
    b.disabled=role!=='host';
  }
  function updateUI() {
    updatePvpUI();
    const count = role==='host' ? sockets.size : (role==='guest' && ready ? peers.size : 0);
    $('online-count').textContent = String(count);
    $('online-hud').classList.toggle('hidden', role==='offline');
    $('online-hud').textContent = role==='host' ? `🌐 ${publicWorld?PUBLIC[publicWorld].name:'Private room'} · ${count+1} playing` : role==='guest' ? `🌐 ${publicWorld?PUBLIC[publicWorld].name:'Private room'} · ${ready?'Online':'Connecting'} · ${count+1} players` : '';
    $('chatbox').classList.toggle('hidden',role==='offline');
    $('roster').textContent = 'Players: '+[label(),...Array.from(peers.values()).map(p=>p.name)].join(', ');
    $('copy-room').disabled = role==='offline' || !roomId;
    $('leave-room').disabled = role==='offline';
    if(role==='host')$('room-code').value=roomId;
    document.querySelectorAll('[data-public]').forEach(b=>b.disabled=(role!=='offline'&&role!=='connecting'));
  }
  function openLobby() {
    $('lobby').classList.remove('hidden');
    if(document.pointerLockElement) document.exitPointerLock();
    try { nickname = ($('player-name').value||'Builder').trim().slice(0,16)||'Builder'; }
    catch(_){}
    if(role==='offline'&&!isConnectingPublic)setStatus('Choose a public world, or create a private room.');
    updateUI();
  }
  function closeLobby() { $('lobby').classList.add('hidden'); }
  function createInvite() { const u = new URL(location.origin+location.pathname); if(publicWorld)u.searchParams.set('server',publicWorld);else u.searchParams.set('room',roomId); return u.toString(); }
  function cleanup(reason) {
    if(peer) {const old=peer; peer=null; try{old.destroy()}catch(_){}}
    host=null;pvp=false;attackTimes.clear();hitTimes.clear();bridge.setMobs([]);
    for(const c of sockets.values())try{c.close()}catch(_){}
    sockets.clear();peers.clear();ready=false;roomId='';role='offline';publicWorld='';isConnectingPublic=false;guestWorld=false;
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
    if(x<0||x>10000||y<-2||y>48||z<0||z>10000)return null;
    return {x,y,z,yaw:Number.isFinite(data.yaw)?data.yaw:0, pitch:Number.isFinite(data.pitch)?data.pitch:0,mode:data.mode==='survival'?'survival':'creative',dimension:['overworld','nether','end'].includes(data.dimension)?data.dimension:'overworld',riding:['horse','donkey','mule','camel','llama','pig','strider','skeleton_horse','zombie_horse','happy_ghast','boat','raft','spruceBoat','cherryBoat','minecart','chestMinecart','hopperMinecart','furnaceMinecart'].includes(data.riding)?data.riding:'',name:String(data.name||'Friend').replace(/[<>]/g,'').slice(0,16)};
  }
  function receiveHostData(conn,message) {
    if(!message||typeof message!=='object'||conn.peer!==host?.peer)return;
    if(message.t==='snapshot') {
      if(message.world?.version===7 && message.world?.worldSize===10000 && bridge.acceptSnapshot(message.world)) {
        ready=true;pvp=!!message.pvp;peers.clear();
        for(const p of message.players||[])if(p && p.id && p.id!==peer.id){const state=cleanPlayer(p.state);if(state)peers.set(p.id,state)}
        setStatus(`Connected to ${publicWorld?PUBLIC[publicWorld].name:'room'}! ${publicWorld?'Public world is live.':'Shared world loaded.'} Tap Back to Game, then Play.`);
        talk('', 'Shared world loaded. You can mine and build with friends.', true);
        updateUI();
      } else setStatus('Unable to load the shared world (incompatible save data).');
    }
    if(message.t==='reject'){setStatus(String(message.reason||'Host room unavailable or a different game mode.').slice(0,160));host?.close();return;}
    if(!ready)return;
    if(message.t==='edit') { bridge.remoteEdit(message.i,message.b); }
    if(message.t==='mobs')bridge.setMobs(message.mobs);
    if(message.t==='pvp'){pvp=!!message.enabled;updateUI();talk('',pvp?'PvP enabled':'PvP disabled',true)}
    if(message.t==='damage')bridge.applyDamage(message.amount,message.cause);
    if(message.t==='loot')bridge.grantLoot(message.drop,message.count);
    if(message.t==='state') {
      if(message.id!==peer.id){const state=cleanPlayer(message.state);if(state)peers.set(message.id,state);}
      updateUI();
    }
    if(message.t==='leave'){peers.delete(message.id);updateUI();}
    if(message.t==='chat'){talk(message.name,message.text);}
    if(message.t==='world' && message.world?.version===7 && message.world?.worldSize===10000 && bridge.acceptSnapshot(message.world)) {
      talk('','Host generated a new world!',true);
    }
  }
  function receiveGuestData(conn,message) {
    if(!message||typeof message!=='object'||!sockets.has(conn.peer))return;
    if(message.t==='hello') {
      if((message.mode==='survival'?'survival':'creative')!==bridge.getMode()){
        send(conn,{t:'reject',reason:'This world is '+bridge.getMode()+'. Choose the same mode on the Home Screen before joining.'});
        setTimeout(()=>conn.close(),150);return;
      }
      const existing=peers.get(conn.peer)||{x:5000,y:22,z:5000,name:'Friend'};
      existing.name=String(message.name||'Friend').replace(/[<>]/g,'').trim().slice(0,16)||'Friend';
      peers.set(conn.peer,existing);
      send(conn,{t:'snapshot',world:bridge.getSnapshot(),pvp,players:[{id:peer.id,state:{...bridge.getPlayer(),name:label()}},...Array.from(peers.entries()).filter(([id])=>id!==conn.peer).map(([id,state])=>({id,state}))]});
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
    } else if(message.t==='attack-mob') {
      processMobAttack(conn.peer,message);
    } else if(message.t==='attack-player') {
      processPlayerAttack(conn.peer,message);
    } else if(message.t==='chat') {
      const m=String(message.text||'').slice(0,160).trim();
      if(m){const n=peers.get(conn.peer)?.name||'Friend';talk(n,m);broadcast({t:'chat',name:n,text:m});}
    }
  }
  function distance(a,b){return Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z)}
  function allowAttack(attacker,now){
    if(!attacker)return false;
    const last=attackTimes.get(attacker.id)||0;
    if(now-last<420)return false;
    attackTimes.set(attacker.id,now);return true;
  }
  function playerProfile(data){
    if(!data)return {mode:'creative',damage:0};
    if(data.mode==='creative')return {mode:'creative',damage:20};
    const kind=['sword','pickaxe'].includes(data.equipped)?data.equipped:'none';
    const level={none:0,wood:1,stone:2,iron:3}[data.weapon]||0;
    return {mode:'survival',damage:Math.max(1,kind==='sword'?2+level*3:kind==='pickaxe'?1+level:1.5)};
  }
  // A host verifies proximity, rate limits, and authoritative mob IDs.
  // This is basic validation, not a hardened anti-cheat system.
  function processMobAttack(from,message){
    if(role!=='host')return false;
    const attacker=peers.get(from),conn=sockets.get(from),now=performance.now();
    if(!attacker||!conn||!allowAttack({...attacker,id:from},now))return false;
    const m=bridge.getMobs().find(m=>m.id===message.id);
    if(!m||distance(attacker,m)>5.3||(attacker.dimension||'overworld')!==(m.dimension||'overworld'))return false;
    const damage=Math.min(20,playerProfile({...message.profile,mode:attacker.mode}).damage);
    const result=bridge.applyMobHit(m.id,damage,from);
    if(!result.hit)return false;
    if(result.dead&&result.drop)send(conn,{t:'loot',drop:result.drop,count:result.count});
    flushMobs();return true;
  }
  function damagePlayer(targetId,amount,cause){
    if(role!=='host'||!Number.isInteger(amount)||amount<1||amount>20)return false;
    const now=performance.now(),last=hitTimes.get(targetId)||0;
    if(now-last<550)return false;
    hitTimes.set(targetId,now);
    if(targetId===peer.id||targetId===null){bridge.applyDamage(amount,cause);return true}
    const target=sockets.get(targetId);
    if(!target?.open)return false;
    send(target,{t:'damage',amount,cause:String(cause).slice(0,40)});return true;
  }
  function processPlayerAttack(from,message){
    if(role!=='host'||!pvp)return false;
    const attacker=peers.get(from),target=message.target===peer.id?{...bridge.getPlayer(),mode:bridge.getMode()}:peers.get(message.target);
    const now=performance.now();
    if(!attacker||!target||target.mode!=='survival'||!allowAttack({...attacker,id:from},now))return false;
    if(distance(attacker,target)>5.2||(attacker.dimension||'overworld')!==(target.dimension||'overworld'))return false;
    const damage=Math.min(11,Math.ceil(playerProfile({...message.profile,mode:attacker.mode}).damage));
    return damagePlayer(message.target,damage,'PvP sword strike');
  }
  function attackMob(id){
    if(role!=='guest'||!ready||!Number.isInteger(id))return false;
    send(host,{t:'attack-mob',id,profile:bridge.getCombatProfile()});return true;
  }
  function attackPlayer(id){
    if(!pvp||!id||role==='offline'||!ready)return false;
    if(role==='guest'){send(host,{t:'attack-player',target:id,profile:bridge.getCombatProfile()});return true}
    const target=peers.get(id),local=bridge.getPlayer();
    if(!target||target.mode!=='survival'||bridge.getMode()!=='survival'||distance(local,target)>5.2||(target.dimension||'overworld')!==(local.dimension||'overworld'))return false;
    const now=performance.now();if(!allowAttack({...local,id:peer.id},now))return false;
    return damagePlayer(id,Math.min(11,Math.ceil(playerProfile(bridge.getCombatProfile()).damage)),'PvP sword strike');
  }
  function flushMobs(){if(role==='host')broadcast({t:'mobs',mobs:bridge.getMobs()})}
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
        conn.on('open',()=>{if(conn===host){setStatus('Connected. Downloading host world…');send(conn,{t:'hello',name:label(),mode:bridge.getMode()});}});
        conn.on('data',message=>receiveHostData(conn,message));
        conn.on('close',()=>{if(conn===host){host=null;ready=false;peers.clear();setStatus('Host disconnected. The shared room is no longer live. Reload to return to your saved solo world.');updateUI()}});
        conn.on('error',err=>setStatus('Could not connect to room: '+(err.message||'connection error')));
      });
      p.on('error',err=>{if(p===peer)setStatus('Join failed: '+(err.type||err.message||'Unknown connection error'))});
      updateUI();
    }catch(e){cleanup('Could not join: '+e.message)}
    finally{$('join-room').disabled=false}
  }
  /* Public sessions use predictable PeerJS host IDs. First visitor claims the
     ID; later visitors join its WebRTC data channel. There is no always-on server. */
  async function joinPublic(which) {
    if(bridge.getMode()!=='survival'){setStatus('Public worlds are Survival-only. Choose Play Survival on the Home Screen before joining.');return;}
    const cfg=PUBLIC[which];
    if(!cfg){setStatus('That public world does not exist.');return;}
    if(role!=='offline'){setStatus('Leave your current world before joining another.');return;}
    if(isConnectingPublic)return;
    isConnectingPublic=true;publicWorld=which;nickname=label();role='connecting';
    document.querySelectorAll('[data-public]').forEach(b=>b.disabled=true);
    setStatus('Finding public world: '+cfg.name+'…');
    try{
      const Peer=await peerLibrary();
      if(role!=='connecting'||publicWorld!==which)return;
      let p=new Peer(cfg.id,{debug:1});peer=p;
      p.on('open',id=>{
        if(peer!==p||role!=='connecting')return;
        role='host';ready=true;isConnectingPublic=false;guestWorld=false;roomId=id;
        bridge.resetPublicWorld(cfg.seed);
        try{history.replaceState(null,'',location.pathname+'?server='+which)}catch(_){}
        setStatus(cfg.name+' is live. You started the public session! Other players can join now. Keep this tab open.');
        talk('',cfg.name+' public session started. Anyone can join and edit.',true);
        updateUI();
      });
      p.on('connection',conn=>{if(peer===p&&role==='host')onGuest(conn)});
      p.on('error',err=>{
        if(peer!==p)return;
        if(err.type==='unavailable-id' && role==='connecting'){
          try{p.destroy()}catch(_){}
          if(peer===p){peer=null;connectPublicGuest(Peer,which)}
        } else if(role==='connecting') {
          cleanup('Public connection failed: '+(err.type||err.message||'Network issue')+'. Try again.');
        } else setStatus('Public signaling issue: '+(err.type||err.message||'Please check connection'));
      });
      p.on('disconnected',()=>{if(peer===p&&role==='host')setStatus('Lost signaling service; connected players may still be online.');});
    }catch(e){cleanup('Could not open public world: '+e.message)}
    finally{if(role==='offline')document.querySelectorAll('[data-public]').forEach(b=>b.disabled=false)}
  }
  function connectPublicGuest(Peer,which) {
    const cfg=PUBLIC[which];
    role='guest';guestWorld=true;ready=false;roomId=cfg.id;
    const p=peer=new Peer(undefined,{debug:1});
    p.on('open',()=>{
      if(peer!==p)return;
      const conn=host=p.connect(cfg.id,{reliable:true,serialization:'json',metadata:{name:nickname}});
      const timeout=setTimeout(()=>{if(conn===host&&!ready){setStatus('Could not reach public host. Tap Leave Room and retry.');}},12000);
      conn.on('open',()=>{
        if(conn===host){clearTimeout(timeout);setStatus('Connected. Downloading public world…');send(conn,{t:'hello',name:label(),mode:bridge.getMode()});}
      });
      conn.on('data',message=>receiveHostData(conn,message));
      conn.on('close',()=>{
        clearTimeout(timeout);
        if(conn===host){host=null;ready=false;peers.clear();setStatus('Public host left. This session ended; leave and rejoin to start a fresh public world.');updateUI()}
      });
      conn.on('error',err=>{clearTimeout(timeout);setStatus('Peer connection issue: '+(err.message||'Try another network'))});
      try{history.replaceState(null,'',location.pathname+'?server='+which)}catch(_){}
      isConnectingPublic=false;
      updateUI();
    });
    p.on('error',err=>{if(peer===p)setStatus('Unable to join public world: '+(err.type||err.message||'Network error'))});
  }
  function localEdit(i,b){
    if(role==='host')broadcast({t:'edit',i,b});
    else if(role==='guest' && ready)send(host,{t:'edit',i,b});
  }
  function tick(t){
    if(role==='host'&&ready&&t-lastMobSend>250){lastMobSend=t;flushMobs()}
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
    localEdit,tick,attackMob,attackPlayer,damagePlayer,flushMobs,canPvp:()=>pvp,isGuest:()=>guestWorld,isShared:()=>guestWorld||!!publicWorld||exitPending,getRemotes:()=>Array.from(peers.values()),getCombatants:()=>Array.from(peers.entries()).map(([id,state])=>({id,...state})),
    broadcastWorld:()=>{if(role==='host'){broadcast({t:'world',world:bridge.getSnapshot()});updateUI();}},
    getMode:()=>role
  };
  $('pvp-toggle').addEventListener('click',()=>{if(role!=='host')return;pvp=!pvp;broadcast({t:'pvp',enabled:pvp});updateUI();talk('',pvp?'PvP enabled':'PvP disabled',true)});
  for(const id of ['friends-toggle','welcome-friends','pause-friends'])$(id)?.addEventListener('click',openLobby);
  $('close-lobby').addEventListener('click',closeLobby);
  document.querySelectorAll('[data-public]').forEach(b=>b.addEventListener('click',()=>joinPublic(b.dataset.public)));
  $('host-room').addEventListener('click',createRoom);
  $('join-room').addEventListener('click',joinRoom);
  $('leave-room').addEventListener('click',()=>{const wasShared=role!=='offline';exitPending=!!publicWorld||guestWorld;cleanup('You left the room.');if(wasShared)location.reload();});
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
  if(publicParam && PUBLIC[publicParam]){
    $('lobby').classList.remove('hidden');
    setStatus('Joining public world '+PUBLIC[publicParam].name+'…');
    setTimeout(()=>joinPublic(publicParam),150);
  } else if(roomParam && validId(roomParam)){
    $('room-code').value=roomParam;
    $('lobby').classList.remove('hidden');
    setStatus('Your friend invited you! Enter a name and tap Join Room.');
  }
  updateUI();
})();
