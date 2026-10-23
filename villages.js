/* MineWorld village professions, deterministic village residents and crop mechanics.
   Original simplified mechanics, not Minecraft gameplay code or trade tables. */
(()=>{
'use strict';
const FARM={farmland:137,moist:138,composter:155};
const CROPS={
 wheat:{blocks:[139,140,141,142],seed:'wheatSeeds',produce:'wheat',name:'Wheat',color:'#e3bd45'},
 carrot:{blocks:[143,144,145,146],seed:'carrot',produce:'carrot',name:'Carrots',color:'#f29342'},
 potato:{blocks:[147,148,149,150],seed:'potato',produce:'potato',name:'Potatoes',color:'#c7b06a'},
 beetroot:{blocks:[151,152,153,154],seed:'beetrootSeeds',produce:'beetroot',name:'Beetroot',color:'#b84f64'}
};
const stations={farmer:155,armorer:156,butcher:157,cartographer:158,cleric:159,fisherman:160,fletcher:161,leatherworker:162,librarian:163,mason:164,shepherd:165,toolsmith:166,weaponsmith:167};
const JOBS=[
 ['farmer','Farmer','Composter','#ad7f4a', [
  ['wheat:20','emerald:1'],['emerald:1','bread:6'],['potato:26','emerald:1'],['emerald:1','apple:4'],['carrot:22','emerald:1'],['emerald:1','pumpkinPie:4'],['beetroot:15','emerald:1'],['emerald:1','goldenCarrot:3'],['wheat:20','emerald:1'],['emerald:3','goldenCarrot:9']]],
 ['armorer','Armorer','Blast Furnace','#545e74',[['iron:4','emerald:1'],['emerald:5','ironHelmet:1'],['coal:15','emerald:1'],['emerald:7','ironChestplate:1'],['lavaBucket:1','emerald:1'],['emerald:8','shield:1'],['diamond:1','emerald:2'],['emerald:13','diamondBoots:1'],['iron:5','emerald:1'],['emerald:22','diamondChestplate:1']]],
 ['butcher','Butcher','Smoker','#bc6b63',[['raw:10','emerald:1'],['emerald:1','cooked:5'],['chicken:12','emerald:1'],['emerald:2','steak:4'],['coal:15','emerald:1'],['emerald:1','rabbitStew:1'],['mutton:7','emerald:1'],['emerald:1','cooked:8'],['sweetBerries:10','emerald:1'],['emerald:2','steak:7']]],
 ['cartographer','Cartographer','Cartography Table','#6f87a8',[['paper:24','emerald:1'],['emerald:7','map:1'],['glass:11','emerald:1'],['emerald:8','oceanMap:1'],['compass:1','emerald:1'],['emerald:8','woodlandMap:1'],['paper:24','emerald:1'],['emerald:3','banner:1'],['compass:1','emerald:2'],['emerald:6','globeBanner:1']]],
 ['cleric','Cleric','Brewing Stand','#9b62a5',[['rottenFlesh:30','emerald:1'],['emerald:1','redstone:2'],['gold:3','emerald:1'],['emerald:1','lapis:2'],['rabbitFoot:2','emerald:1'],['emerald:4','glowstone:1'],['glassBottle:9','emerald:1'],['emerald:5','enderPearl:1'],['netherWart:22','emerald:1'],['emerald:3','experienceBottle:1']]],
 ['fisherman','Fisherman','Barrel','#4e8090',[['string:20','emerald:1'],['emerald:3','fishingRod:1'],['coal:10','emerald:1'],['emerald:1','cookedFish:5'],['fish:15','emerald:1'],['emerald:4','enchantedRod:1'],['boat:1','emerald:1'],['emerald:2','cookedFish:8'],['tropicalFish:6','emerald:1'],['emerald:5','nameTag:1']]],
 ['fletcher','Fletcher','Fletching Table','#668844',[['sticks:32','emerald:1'],['emerald:1','arrow:16'],['flint:26','emerald:1'],['emerald:2','bow:1'],['string:14','emerald:1'],['emerald:3','crossbow:1'],['feather:24','emerald:1'],['emerald:1','arrow:32'],['tripwireHook:8','emerald:1'],['emerald:2','tippedArrow:8']]],
 ['leatherworker','Leatherworker','Cauldron','#8b5f45',[['leather:6','emerald:1'],['emerald:3','leatherCap:1'],['flint:26','emerald:1'],['emerald:4','leatherTunic:1'],['rabbitHide:9','emerald:1'],['emerald:5','leatherPants:1'],['turtleScute:4','emerald:1'],['emerald:6','leatherBoots:1'],['leather:6','emerald:1'],['emerald:6','saddle:1']]],
 ['librarian','Librarian','Lectern','#b6a17c',[['paper:24','emerald:1'],['emerald:5','books:1'],['books:4','emerald:1'],['emerald:7','enchantedBook:1'],['inkSac:5','emerald:1'],['emerald:8','enchantedBook:1'],['bookQuill:2','emerald:1'],['emerald:5','glass:4'],['books:5','emerald:1'],['emerald:12','nameTag:1']]],
 ['mason','Mason','Stonecutter','#8d8a7e',[['stone:20','emerald:1'],['emerald:1','brick:10'],['clay:10','emerald:1'],['emerald:1','stoneBricks:10'],['granite:16','emerald:1'],['emerald:1','polishedStone:10'],['terracotta:16','emerald:1'],['emerald:1','quartzBlock:1'],['quartz:12','emerald:1'],['emerald:1','glazedTerracotta:4']]],
 ['shepherd','Shepherd','Loom','#c0b294',[['wool:18','emerald:1'],['emerald:1','shears:1'],['dye:12','emerald:1'],['emerald:1','wool:5'],['wool:18','emerald:1'],['emerald:3','bed:1'],['dye:12','emerald:1'],['emerald:2','banner:1'],['wool:18','emerald:1'],['emerald:4','painting:1']]],
 ['toolsmith','Toolsmith','Smithing Table','#759da2',[['coal:15','emerald:1'],['emerald:3','stonePickaxe:1'],['iron:4','emerald:1'],['emerald:7','ironAxe:1'],['flint:30','emerald:1'],['emerald:9','ironPickaxe:1'],['diamond:1','emerald:2'],['emerald:14','diamondAxe:1'],['iron:4','emerald:1'],['emerald:20','diamondPickaxe:1']]],
 ['weaponsmith','Weaponsmith','Grindstone','#9a7774',[['coal:15','emerald:1'],['emerald:3','ironAxe:1'],['iron:4','emerald:1'],['emerald:7','ironSword:1'],['flint:24','emerald:1'],['emerald:8','ironAxe:1'],['diamond:1','emerald:2'],['emerald:13','diamondSword:1'],['iron:4','emerald:1'],['emerald:18','diamondAxe:1']]]
].map(([key,name,station,color,offers])=>({key,name,station,block:stations[key],color,offers:offers.map(([give,take],idx)=>{
 const parse=s=>{const i=s.lastIndexOf(':');return {item:s.slice(0,i),count:Number(s.slice(i+1))}};
 return {tier:Math.floor(idx/2),cost:parse(give),result:parse(take),max:idx%2===0?16:12,xp:idx%2===0?2:3};
})}));
const NON_WORKING=[{key:'unemployed',name:'Unemployed Villager',station:'None',color:'#98816c',offers:[]},{key:'nitwit',name:'Nitwit',station:'None',color:'#71a258',offers:[]}];
const TIERS=['Novice','Apprentice','Journeyman','Expert','Master'];
function cropAt(id){for(const [key,c] of Object.entries(CROPS)){const stage=c.blocks.indexOf(id);if(stage!==-1)return {key,stage,...c};}return null;}
function hash(seed,x,z,alt=0){let n=Math.imul((seed|0)+alt,1274126177)^Math.imul(x|0,374761393)^Math.imul(z|0,668265263);n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0);}
function villageSites({x,z,seed,zone,biomes,terrain,radius=240}){
 const GRID=192;const result=[];
 for(let gx=Math.floor((x-radius)/GRID);gx<=Math.floor((x+radius)/GRID);gx++)for(let gz=Math.floor((z-radius)/GRID);gz<=Math.floor((z+radius)/GRID);gz++){
  const ax=gx*GRID+40+(hash(seed,gx,gz,180)%100),az=gz*GRID+40+(hash(seed,gx,gz,181)%100);
  if(ax<10||az<10||ax>=9990||az>=9990)continue;
  const biome=biomes[zone(ax,az)];if(!['village','savannaVillage'].includes(biome?.feature))continue;
  if(hash(seed,gx,gz,182)/4294967295>.67)continue;
  if(Math.hypot(ax-x,az-z)>radius+28)continue;
  result.push({id:gx+','+gz,x:ax,z:az,y:terrain(ax,az)+1,kind:biome.feature});
 }
 return result.sort((a,b)=>(a.x-x)**2+(a.z-z)**2-( (b.x-x)**2+(b.z-z)**2));
}
window.MineWorldVillages={FARM,CROPS,JOBS,NON_WORKING,TIERS,stations,cropAt,villageSites,hash};
})();
