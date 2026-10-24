/* MineWorld 5.7 — independently synthesized browser sound effects.
 * No sound recordings, audio clips, or artwork from Eaglercraft or Minecraft.
 * User-supplied ZIP imports may replace these locally during the current session.
 */
(()=>{
'use strict';
const STORAGE='mineworld-sound-settings-v1';
const typeSet=new Set(['break','place','step','jump','hurt','attack','pickup','click','eat','splash','open','portal','level']);
const AudioCtor=window.AudioContext||window.webkitAudioContext;
let context=null,enabled=true,volume=.38,seed=8675309,lastStep=0;
const imported=new Map();
try{
 const prefs=JSON.parse(localStorage.getItem(STORAGE)||'{}');
 if(prefs&&typeof prefs==='object'){
  enabled=prefs.enabled!==false;
  if(Number.isFinite(prefs.volume))volume=Math.max(0,Math.min(1,prefs.volume));
 }
}catch(_){}
const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
function state(){return {enabled,volume,available:!!AudioCtor,customSounds:imported.size}}
function persist(){try{localStorage.setItem(STORAGE,JSON.stringify({enabled,volume}))}catch(_){}}
function init(){
 if(!AudioCtor||!enabled||volume<=0)return null;
 if(!context){try{context=new AudioCtor()}catch(_){return null}}
 if(context.state==='suspended')context.resume().catch(()=>{});
 return context;
}
function beep(ctx,when,frequency,seconds,gain,shape='triangle',toFrequency=null){
 const osc=ctx.createOscillator(),g=ctx.createGain();
 osc.type=shape;osc.frequency.setValueAtTime(frequency,when);
 if(toFrequency&&toFrequency!==frequency)osc.frequency.exponentialRampToValueAtTime(Math.max(30,toFrequency),when+seconds);
 const a=volume*gain;
 g.gain.setValueAtTime(Math.max(.0001,a),when);
 g.gain.exponentialRampToValueAtTime(.0001,when+seconds);
 osc.connect(g);g.connect(ctx.destination);osc.start(when);osc.stop(when+seconds+.01);
}
function noise(ctx,when,seconds,gain,frequency=1000){
 const rate=ctx.sampleRate||44100,n=Math.max(16,Math.min(Math.floor(rate*seconds),rate));
 const buffer=ctx.createBuffer(1,n,rate),d=buffer.getChannelData(0);
 let last=0,blend=Math.min(.95,Math.max(.02,frequency/(rate*.2)));
 for(let i=0;i<n;i++){const sample=random()*2-1;last+=blend*(sample-last);d[i]=last;}
 const src=ctx.createBufferSource(),g=ctx.createGain();
 src.buffer=buffer;const amp=volume*gain;
 g.gain.setValueAtTime(Math.max(.0001,amp),when);
 g.gain.exponentialRampToValueAtTime(.0001,when+seconds);
 src.connect(g);g.connect(ctx.destination);src.start(when);src.stop(when+seconds+.01);
}
function classify(label){
 const n=String(label||'').toLowerCase();
 if(/glass|ice|crystal|portal/.test(n))return 'glass';
 if(/sand|gravel|soil|dirt|grass|mud|snow|clay/.test(n))return 'soft';
 if(/wood|log|plank|chest|barrel|tree|bamboo/.test(n))return 'wood';
 if(/stone|ore|brick|rock|basalt|quartz|deepslate/.test(n))return 'stone';
 if(/iron|gold|metal|copper|anvil|netherite/.test(n))return 'metal';
 if(/leaf|leaves|wheat|plant|flower|vine|crop/.test(n))return 'foliage';
 return 'stone';
}
function synthesized(ctx,type,material){
 const when=ctx.currentTime+.003;
 const kind=classify(material);
 if(type==='break'||type==='place'){
  const soft=kind==='soft'||kind==='foliage',wood=kind==='wood',metal=kind==='metal';
  const length=type==='break'?(soft?.18:.22):.11;
  const cutoff=soft?460:wood?780:metal?2800:kind==='glass'?3600:1500;
  noise(ctx,when,length,type==='break'?.24:.18,cutoff);
  const pitch=(soft?110:wood?215:metal?430:kind==='glass'?690:160)*(type==='break'?.85:1.15);
  beep(ctx,when,pitch,length*.8,.12,metal||kind==='glass'?'sine':'triangle',pitch*.63);
  return;
 }
 if(type==='step'){noise(ctx,when,.072,.13,kind==='soft'?450:950);return;}
 if(type==='jump'){beep(ctx,when,180,.12,.075,'sine',240);return;}
 if(type==='hurt'){noise(ctx,when,.21,.2,550);beep(ctx,when,175,.23,.13,'sawtooth',85);return;}
 if(type==='attack'){noise(ctx,when,.11,.15,1600);beep(ctx,when,365,.12,.08,'triangle',120);return;}
 if(type==='pickup'){beep(ctx,when,580,.07,.12,'sine',730);beep(ctx,when+.065,840,.10,.12,'sine',980);return;}
 if(type==='eat'){for(let i=0;i<3;i++)noise(ctx,when+i*.105,.09,.14,490+i*130);return;}
 if(type==='splash'){noise(ctx,when,.28,.21,360);beep(ctx,when,260,.2,.055,'sine',98);return;}
 if(type==='open'){beep(ctx,when,280,.13,.085,'square',190);return;}
 if(type==='portal'){beep(ctx,when,115,.55,.08,'sine',166);beep(ctx,when+.11,160,.42,.06,'triangle',125);return;}
 if(type==='level'){for(let i=0;i<3;i++)beep(ctx,when+i*.1,440*Math.pow(1.25,i),.13,.09,'sine');return;}
 beep(ctx,when,380,.055,.07,'sine',310);
}
function play(type,material=''){
 if(!enabled||volume<=0||!typeSet.has(type))return false;
 try{
  const ctx=init();if(!ctx)return false;
  const sample=imported.get(type);
  if(sample){
   const src=ctx.createBufferSource(),gain=ctx.createGain();
   src.buffer=sample;gain.gain.value=volume*.55;
   src.connect(gain);gain.connect(ctx.destination);src.start();return true;
  }
  synthesized(ctx,type,material);return true;
 }catch(e){console.warn('Audio unavailable',e);return false}
}
async function loadSound(type,bytes){
 if(!typeSet.has(type)||!(bytes instanceof Uint8Array)||bytes.byteLength>4e6||!bytes.byteLength)return false;
 const ctx=init();if(!ctx||typeof ctx.decodeAudioData!=='function')return false;
 try{
  const copy=bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength);
  const buf=await ctx.decodeAudioData(copy);
  if(!buf||!Number.isFinite(buf.duration)||buf.duration>8||!buf.duration)return false;
  imported.set(type,buf);return true;
 }catch(_){return false}
}
function clearSamples(){imported.clear()}
function setEnabled(v){enabled=!!v;persist();return state()}
function setVolume(v){volume=Math.max(0,Math.min(1,Number(v)||0));persist();return state()}
function step(material=''){const now=performance.now();if(now-lastStep<270)return false;lastStep=now;return play('step',material)}
window.MineWorldSound=Object.freeze({play,step,loadSound,clearSamples,setEnabled,setVolume,state,types:[...typeSet],classify});
})();