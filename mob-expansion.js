/* MineWorld 6.18 — independently implemented Java-inspired mob catalog.
 * Species names and broad categories informed by minecraft.wiki/w/Mob (Oct 2026).
 * No Mojang geometry, texture bitmaps or code. Lightweight cuboids for mobile.
 * These entries are playable approximations, NOT complete Java mob mechanics.
 */
(()=>{
'use strict';
const catalog=Object.create(null);
function add(id,kind,hp,speed,damage,shape,color,drop='experience'){
 const label=id.split('_').map(w=>w[0].toUpperCase()+w.slice(1)).join(' ');
 catalog[id]={name:label,kind,hp,speed,damage:damage||0,shape,
  body:color,head:color.map(c=>Math.min(1,c*1.13+.015)),drop};
}
// Passive land/air creatures; aquatic mobs are available to summon near water.
add('allay','passive',20,1.45,0,'wisp',[.45,.81,.98]);
add('armadillo','passive',12,.72,0,'smallquad',[.69,.48,.32],'leather');
add('axolotl','passive',14,.68,0,'axolotl',[.93,.63,.70],'fish');
add('bat','passive',6,1.4,0,'bat',[.36,.29,.24]);
add('cat','passive',10,1.2,0,'cat',[.63,.56,.47],'string');
add('cod','passive',3,.7,0,'fish',[.62,.70,.55],'fish');
add('copper_golem','passive',20,.72,0,'golem',[.66,.45,.27],'copper');
add('frog','passive',10,1.15,0,'frog',[.36,.67,.34]);
add('glow_squid','passive',10,.72,0,'squid',[.25,.72,.80],'inkSac');
add('mooshroom','passive',10,.54,0,'mushroomcow',[.72,.16,.19],'raw');
add('ocelot','passive',10,1.24,0,'cat',[.83,.68,.35],'string');
add('parrot','passive',6,1.2,0,'bird',[.31,.68,.33],'feather');
add('rabbit','passive',3,1.25,0,'rabbit',[.64,.55,.44],'rabbitHide');
add('salmon','passive',3,.8,0,'fish',[.74,.43,.40],'fish');
add('sniffer','passive',14,.6,0,'sniffer',[.63,.28,.23],'experience');
add('snow_golem','passive',4,.95,0,'snowman',[.92,.94,.96],'snow');
add('squid','passive',10,.7,0,'squid',[.31,.34,.55],'inkSac');
add('tadpole','passive',6,.75,0,'fish',[.37,.42,.25],'fish');
add('tropical_fish','passive',3,.9,0,'fish',[.96,.53,.17],'fish');
add('turtle','passive',30,.48,0,'turtle',[.28,.56,.29],'turtleScute');
add('wandering_trader','passive',20,.7,0,'villager',[.25,.39,.72],'emerald');
add('villager','passive',20,.7,0,'villager',[.56,.38,.27],'emerald');
add('camel_husk','passive',30,1.0,0,'camel',[.54,.49,.35],'leather');
add('sulfur_cube','passive',12,.7,0,'slime',[.90,.81,.23],'experience');
// Neutral creatures become hostile only when anger is raised by provocation.
add('bee','neutral',10,.85,2,'bee',[.93,.75,.21],'experience');
add('cave_spider','neutral',12,1.35,2,'spider',[.11,.30,.50],'string');
add('dolphin','neutral',10,1.35,2,'fish',[.39,.61,.72],'fish');
add('drowned','neutral',20,.95,3,'biped',[.19,.42,.39],'raw');
add('fox','neutral',10,1.2,2,'fox',[.92,.40,.18],'leather');
add('goat','neutral',10,1.25,2,'goat',[.87,.85,.78],'raw');
add('iron_golem','neutral',40,.9,7,'golem',[.74,.73,.65],'iron');
add('nautilus','neutral',16,.9,2,'shell',[.74,.61,.47],'experience');
add('panda','neutral',20,.65,3,'panda',[.88,.88,.83],'experience');
add('polar_bear','neutral',30,1.0,5,'bear',[.92,.92,.85],'fish');
add('pufferfish','neutral',3,.6,2,'puffer',[.91,.78,.28],'fish');
add('trader_llama','neutral',16,1.0,2,'llama',[.79,.67,.48],'leather');
add('wolf','neutral',10,1.25,4,'wolf',[.69,.68,.64],'bone');
add('zombie_nautilus','neutral',16,.9,3,'shell',[.35,.51,.36],'experience');
// Hostile biome/structure monsters. Special structures and boss logic need more work.
add('bogged','hostile',16,.92,3,'biped',[.41,.49,.31],'bone');
add('breeze','hostile',25,1.3,4,'wisp',[.51,.72,.84],'experience');
add('creaking','hostile',20,.7,3,'creaking',[.35,.31,.24],'resin');
add('elder_guardian','hostile',40,.55,6,'guardian',[.67,.68,.51],'fish');
add('evoker','hostile',24,.75,4,'villager',[.37,.36,.48],'emerald');
add('guardian','hostile',30,.8,4,'guardian',[.68,.74,.54],'fish');
add('husk','hostile',20,1,3,'biped',[.65,.53,.35],'raw');
add('parched','hostile',20,.9,3,'biped',[.64,.54,.39],'bone');
add('phantom','hostile',20,1.6,4,'bat',[.15,.26,.36],'experience');
add('pillager','hostile',24,1,4,'villager',[.47,.43,.43],'crossbow');
add('ravager','hostile',40,1.15,7,'bear',[.48,.46,.43],'experience');
add('silverfish','hostile',8,1.05,2,'bug',[.48,.48,.49],'experience');
add('slime','hostile',16,.75,3,'slime',[.38,.71,.34],'experience');
add('stray','hostile',20,.9,3,'biped',[.62,.70,.74],'bone');
add('vex','hostile',14,1.5,3,'wisp',[.72,.79,.87],'experience');
add('vindicator','hostile',24,1.15,5,'villager',[.42,.40,.41],'iron');
add('warden','hostile',40,1,8,'warden',[.13,.23,.27],'experience');
add('witch','hostile',26,.75,4,'villager',[.34,.24,.43],'glassBottle');
add('zombie_villager','hostile',20,.92,3,'villager',[.29,.48,.31],'raw');
const WATER=new Set(['axolotl','cod','glow_squid','salmon','squid','tadpole','tropical_fish',
 'dolphin','drowned','nautilus','pufferfish','zombie_nautilus','guardian','elder_guardian']);
const SPAWNABLE_PASSIVE=[
 ['mooshroom',/mushroom/],['armadillo',/savanna|badlands/],['rabbit',/desert|snow|meadow|plains/],
 ['frog',/swamp|mangrove/],['goat',/mountain|peak|slope|grove|windswept/],
 ['fox',/taiga|snowy|grove/],['wolf',/forest|taiga|grove/],
 ['bee',/flower|meadow|forest|plains/],['panda',/jungle/],
 ['parrot',/jungle/],['ocelot',/jungle/],['sniffer',/warm.ocean/]
];
const SPAWNABLE_HOSTILE=[
 ['husk',/desert/],['parched',/desert|badlands/],['stray',/snow|frozen|ice/],
 ['bogged',/swamp|mangrove/],['witch',/swamp/],['slime',/swamp/],
 ['silverfish',/mountain|cave/],['zombie_villager',/plains|forest|savanna/],
 ['phantom',/plains|meadow/]
];
function pickBiome(biome,seed,hostile=false){
 const pool=(hostile?SPAWNABLE_HOSTILE:SPAWNABLE_PASSIVE)
  .filter(v=>v[1].test(String(biome).toLowerCase())).map(v=>v[0]);
 if(!pool.length)return null;
 return pool[Math.abs(Math.trunc(Number(seed)||0))%pool.length];
}
function draw(m,box,time=0){
 const spec=catalog[m.kind];if(!spec||typeof box!=='function')return false;
 const x=m.x,y=m.y,z=m.z,c=spec.body,light=spec.head;
 const dark=c.map(v=>Math.max(.03,v*.54)),white=[.94,.94,.91],black=[.10,.11,.11];
 const size=m.baby?.55:1;
 const part=(px,py,pz,w,h,d,col)=>box(x+px*size,y+py*size,z+pz*size,w*size,h*size,d*size,col);
 const eyes=(h=.9,w=.22,depth=-.36)=>{
   for(const side of [-1,1])part(side*w-.032,h,depth,.065,.072,.024,black);
 };
 const feet=(height=.4,width=.28,depth=.31)=>{
   for(const side of [-1,1])for(const fore of [-1,1])
     part(side*width-.08,.03,fore*depth-.06,.16,height,.16,dark);
 };
 const gait=m.moving===false?0:Math.sin((m.gait||time*5)+(m.id||1))*.045;
 switch(spec.shape){
 case 'fish':
   part(-.37,.38,-.22,.74,.33,.43,c);
   part(-.19,.45,-.43,.38,.2,.24,light);
   part(-.09,.4,.17,.18,.43,.38,dark);
   part(-.15,.64,-.12,.30,.12,.2,light);eyes(.54,.14,-.443);break;
 case 'squid':
   part(-.31,.7,-.33,.62,.72,.62,c);
   for(let i=0;i<8;i++){const a=i*Math.PI/4;
     part(Math.cos(a)*.26-.052,.22+Math.sin(time*2+i)*.08,Math.sin(a)*.25-.052,.11,.56,.11,light);}
   eyes(.86,.18,-.354);break;
 case 'axolotl':
   feet(.19,.28,.27);part(-.34,.23,-.40,.68,.35,.85,c);
   part(-.40,.30,-.60,.80,.31,.34,light);
   for(const side of [-1,1])for(let i=0;i<3;i++)
     part(side*.38-.07,.38+i*.1,-.44,.14,.07,.12,[.79,.30,.39]);
   eyes(.46,.21,-.619);break;
 case 'bat':
 case 'wisp':
 case 'bird':
   part(-.23,.83,-.20,.46,.44,.42,c);
   part(-.19,1.15,-.37,.38,.28,.32,light);
   for(const s of [-1,1])
     part(s*.42-.36,1.00+Math.sin(time*6)*.10,-.03,.72,.07,.50,dark);
   eyes(1.26,.12,-.383);
   if(spec.shape==='bird')part(-.08,1.18,-.46,.16,.08,.15,[.95,.72,.19]);
   break;
 case 'bee':
   part(-.31,.70,-.31,.62,.45,.63,c);
   for(const zz of [-.17,.10])part(-.315,.72,zz,.63,.34,.07,dark);
   for(const side of [-1,1])part(side*.24-.08,1.10,-.06,.16,.07,.35,white);
   eyes(.88,.16,-.333);break;
 case 'spider':
 case 'bug':
   part(-.30,.24,-.34,.60,.33,.70,c);
   part(-.25,.30,-.51,.5,.30,.25,light);
   for(const side of [-1,1])for(const zz of [-.30,-.07,.16,.34])
     part(side*.40-.05,.09,zz,.12,.3,.11,dark);
   eyes(.48,.15,-.526);break;
 case 'rabbit':
 case 'cat':
 case 'fox':
 case 'wolf':
 case 'goat':
 case 'smallquad':
   feet(.42,.30,.29);
   part(-.40,.43,-.38,.8,.44,.80,c);
   part(-.29,.64,-.62,.58,.37,.41,light);
   for(const s of [-1,1])
     part(s*.20-.075,.96,-.53,.15,spec.shape==='rabbit'?.36:.18,.15,light);
   eyes(.79,.17,-.641);
   if(['fox','wolf','cat'].includes(spec.shape))part(-.12,.67,.38,.24,.19,.3,dark);
   if(spec.shape==='goat')for(const side of [-1,1])part(side*.22-.04,1.09,-.48,.08,.26,.09,white);
   if(spec.shape==='smallquad')part(-.32,.78,-.26,.64,.12,.6,dark);
   break;
 case 'frog':
   part(-.44,.19,-.39,.88,.48,.78,c);
   for(const side of [-1,1])part(side*.27-.14,.59,-.35,.28,.19,.2,light);
   eyes(.69,.30,-.40);break;
 case 'slime':
 case 'puffer':
   part(-.48,.16,-.48,.96,.92,.96,c);
   part(-.3,.40,-.50,.60,.12,.025,light);
   eyes(.83,.25,-.503);
   if(spec.shape==='puffer')for(const s of [-1,1])part(s*.52-.07,.52,-.12,.14,.15,.24,dark);
   break;
 case 'turtle':
 case 'shell':
   feet(.22,.34,.31);part(-.50,.28,-.45,1,.43,.90,c);
   part(-.41,.60,-.38,.82,.13,.78,dark);
   part(-.28,.41,-.72,.56,.26,.32,light);eyes(.56,.17,-.735);break;
 case 'mushroomcow':
 case 'panda':
 case 'bear':
 case 'sniffer':
   feet(.69,.37,.40);part(-.52,.68,-.54,1.04,.67,1.08,c);
   part(-.40,.85,-.79,.80,.51,.46,light);eyes(1.12,.23,-.805);
   if(spec.shape==='mushroomcow')for(const side of [-1,1])
     part(side*.25-.12,1.38,-.20,.24,.23,.3,[.96,.90,.82]);
   if(spec.shape==='sniffer')part(-.30,.88,-1.06,.60,.22,.32,[.44,.58,.29]);
   if(spec.shape==='panda')for(const side of [-1,1])part(side*.23-.10,1.09,-.811,.20,.22,.03,black);
   break;
 case 'golem':
 case 'warden':
 case 'snowman':
 case 'creaking':
   part(-.43,.51,-.25,.86,1.14,.52,c);
   part(-.33,1.68,-.32,.66,.59,.65,light);
   for(const side of [-1,1]){part(side*.52-.12,.57,-.17,.25,1.04,.37,c);
     part(side*.23-.12,.04,-.16,.24,.55,.36,dark);}
   eyes(2.00,.20,-.342);
   if(spec.shape==='snowman')part(-.07,1.91,-.43,.14,.1,.17,[.96,.42,.12]);
   if(spec.shape==='warden'){part(-.32,1.16,-.28,.65,.13,.045,[.16,.77,.79]);}
   if(spec.shape==='creaking'){for(const s of [-1,1])part(s*.20-.07,2.22,-.20,.14,.30,.18,dark);}
   break;
 case 'guardian':
   part(-.50,.5,-.46,1.0,.87,.94,c);
   part(-.27,.82,-.49,.54,.35,.055,light);
   part(-.11,.84,-.51,.22,.22,.03,[.82,.19,.15]);
   for(const side of [-1,1])part(side*.60-.13,.88,-.16,.24,.18,.38,dark);
   break;
 case 'villager':
 case 'biped':
   part(-.32,.66,-.24,.64,.79,.48,c);
   part(-.31,1.47,-.30,.62,.52,.60,light);
   for(const side of [-1,1]){
     part(side*.19-.12,.04,-.15,.24,.63,.34,dark);
     part(side*.41-.10,.82,-.16,.20,.60,.30,c);
   }
   if(spec.shape==='villager')part(-.09,1.70,-.40,.18,.22,.16,light);
   eyes(1.78,.17,-.323);break;
 case 'camel':
 case 'llama':
   feet(.96,.47,.44);part(-.66,1.0,-.7,1.32,.68,1.35,c);
   part(-.21,1.55,-.78,.42,.80,.40,light);
   part(-.30,2.16,-.85,.60,.30,.43,light);
   eyes(2.27,.20,-.863);
   if(spec.shape==='camel')part(-.27,1.67,-.12,.54,.19,.60,dark);
   break;
 default:return false;
 }
 // Distinctive low-cost original 1/16-block pixel highlights.
 if(spec.shape!=='fish'&&spec.shape!=='squid'&&spec.shape!=='bat')
   part(-.16,.76,-.38,.0625,.0625,.025,light);
 return true;
}
function mountUI(){
 const root=document.querySelector('#pause .mw-render-panel')?.parentNode;
 if(!root||root.querySelector('#mw-mob-catalog'))return false;
 const section=document.createElement('section');section.id='mw-mob-catalog';
 section.style.cssText='margin:12px 0;padding:10px;border:1px solid #93ab8c;background:#1c3022;color:#fff;';
 const title=document.createElement('strong');title.textContent='Mob catalog · Java-inspired creatures';
 const note=document.createElement('p');note.textContent='Creative mode: select a creature to summon near you. Models and AI are independent, simplified interpretations; aquatic creatures require water.';
 note.style.cssText='font-size:12px;margin:6px 0;';
 const select=document.createElement('select');select.setAttribute('aria-label','Choose a MineWorld mob to summon');
 select.style.cssText='min-height:40px;max-width:100%;width:100%;font-size:16px;background:#253827;color:white;';
 for(const [kind,spec] of Object.entries(catalog).sort((a,b)=>a[1].name.localeCompare(b[1].name))){
  const option=document.createElement('option');option.value=kind;option.textContent=spec.name+' · '+spec.kind;select.appendChild(option);
 }
 const button=document.createElement('button');button.type='button';button.textContent='Summon in Creative';
 button.className='ui-button';button.style.margin='8px 0 0';button.style.minHeight='42px';
 const status=document.createElement('small');status.style.cssText='display:block;font-size:12px;';
 button.addEventListener('click',()=>{
   const result=window.MineWorldMobBridge?.summon?.(select.value);
   status.textContent=result?'Summoned '+catalog[select.value]?.name+'.':'Cannot summon here: use Creative, find open terrain or water, and try again.';
 });
 section.append(title,note,select,button,status);root.appendChild(section);
 return true;
}
window.MineWorldMobExpansion=Object.freeze({
 catalog,draw,mountUI,pickBiome,isAquatic:kind=>WATER.has(kind),
 count:Object.keys(catalog).length,
 eligible:(kind,biome)=>SPAWNABLE_PASSIVE.some(([id,re])=>id===kind&&re.test(String(biome).toLowerCase()))
});
})();