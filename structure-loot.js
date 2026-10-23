/* MineWorld deterministic, independently authored loot sets for generated landmarks.
   Structure-specific pools inspired by Minecraft, not copied vanilla loot table JSON.
   Generated from seed + chest coordinates; world changes mark loot as claimed. */
(()=>{
'use strict';
const POOLS={
 shipwreck:[['iron',1,5,7],['emerald',1,4,5],['gold',1,5,3],['paper',2,9,8],['map',1,1,2],['coal',2,9,6],['cooked',1,4,4],['potato',2,7,4],['lapis',1,5,2],['diamond',1,2,1],['compass',1,1,2]],
 igloo:[['coal',2,7,6],['gold',1,2,3],['apple',1,3,6],['goldenApple',1,1,1],['emerald',1,3,3],['wheat',2,7,5],['iron',1,3,4]],
 cabin:[['bread',1,5,5],['coal',1,6,5],['iron',1,3,3],['potato',1,4,4],['apple',1,3,4],['spruceSapling',1,3,3],['map',1,1,2]],
 peakTower:[['iron',1,4,6],['emerald',1,4,4],['arrow',2,12,7],['crossbow',1,1,2],['wheat',2,5,3],['sentryTrim',1,1,1]],
 watchtower:[['iron',1,4,6],['gold',1,3,4],['arrow',2,12,7],['crossbow',1,1,2],['coal',2,7,5]],
 shoreRuins:[['coal',2,7,6],['iron',1,3,4],['wheat',2,8,5],['emerald',1,2,2],['fishingRod',1,1,2]],
 oceanRuins:[['coal',2,7,7],['iron',1,4,5],['wheat',2,8,5],['emerald',1,4,3],['gold',1,3,3],['fishingRod',1,1,2]],
 well:[['suspiciousSand',1,3,7],['potterySherd',1,1,3],['emerald',1,2,2],['brick',2,7,4]],
 village:[['bread',2,6,9],['potato',2,7,6],['apple',1,5,6],['wheat',2,8,6],['emerald',1,4,4],['iron',1,4,3],['gold',1,3,2],['diamond',1,1,1],['saddle',1,1,2]],
 savannaVillage:[['bread',2,6,9],['wheat',2,8,7],['potato',2,6,6],['emerald',1,4,5],['iron',1,4,3],['apple',1,4,5],['saddle',1,1,2]],
 manor:[['gold',1,6,6],['diamond',1,3,3],['emerald',1,5,6],['bone',2,8,8],['string',2,6,7],['powder',1,6,5],['nameTag',1,1,2],['vexTrim',1,1,1],['goldenApple',1,1,1]],
 pavilion:[['cherrySapling',1,4,6],['bread',1,4,5],['gold',1,3,3],['emerald',1,3,4],['map',1,1,2]],
 shrine:[['resin',2,9,7],['emerald',1,3,4],['gold',1,4,3],['books',1,3,5],['paleSapling',1,3,5]],
 abandonedCamp:[['bread',1,5,8],['wheat',2,6,5],['arrow',2,8,5],['coal',2,5,5],['rope',1,2,4],['map',1,1,2],['potato',1,5,5]],
 trailRuins:[['potterySherd',1,2,7],['brick',2,8,7],['emerald',1,3,3],['dye',1,4,5],['wayfinderTrim',1,1,1],['coal',1,6,4]],
 desertTemple:[['bone',2,8,9],['string',2,8,8],['powder',1,7,8],['gold',1,6,7],['iron',1,6,7],['emerald',1,3,3],['diamond',1,3,2],['goldenApple',1,1,1],['duneTrim',1,1,1],['saddle',1,1,3]],
 mineshaft:[['rails',3,12,9],['coal',2,7,7],['iron',1,5,7],['gold',1,4,4],['lapis',1,6,3],['diamond',1,2,2],['bread',1,4,5],['nameTag',1,1,3],['pumpkinSeeds',1,5,5]],
 ruinedPortal:[['gold',1,6,8],['goldNugget',4,17,8],['obsidian',1,4,6],['flintSteel',1,1,4],['fireCharge',1,3,5],['goldenApple',1,1,2],['iron',1,3,2],['goldenGear',1,1,2]],
 bridge:[['stone',2,9,8],['iron',1,3,3],['emerald',1,2,2],['map',1,1,2]],
 swampHut:[['mushroom',1,4,8],['redstone',1,5,3],['sugar',1,5,7],['books',1,3,3]],
 witchHut:[['mushroom',1,4,8],['redstone',1,6,5],['sugar',1,5,7],['glassBottle',1,3,6],['powder',1,3,3]],
 jungleTemple:[['bone',2,8,8],['iron',1,5,7],['gold',1,5,6],['emerald',1,4,4],['diamond',1,3,2],['bamboo',2,7,6],['wildTrim',1,1,1],['saddle',1,1,2]],
 camp:[['bamboo',3,9,8],['bread',1,5,6],['iron',1,3,3],['paper',2,8,5],['gold',1,2,2]],
 mushroomHut:[['mushroom',2,8,9],['cooked',1,4,7],['bread',1,5,7],['books',1,3,4]],
 fortress:[['gold',1,4,7],['iron',1,5,7],['diamond',1,3,3],['obsidian',1,4,5],['saddle',1,1,3],['blazeRod',1,3,5],['netherWart',2,8,5],['ribTrim',1,1,1],['goldenGear',1,1,3]],
 bastion:[['gold',2,9,9],['goldNugget',5,18,9],['obsidian',1,5,7],['ancientDebris',1,2,2],['netheriteScrap',1,2,2],['netheriteUpgrade',1,1,1],['pigstep',1,1,1],['snoutTrim',1,1,1],['gildedBlackstone',1,4,7],['diamond',1,2,2]],
 bastionTreasure:[['gold',2,12,9],['goldNugget',5,22,7],['netheriteScrap',1,3,5],['netheriteIngot',1,1,3],['ancientDebris',1,3,4],['obsidian',1,5,5],['diamond',1,4,4],['pigstep',1,1,2],['snoutTrim',1,1,2],['gildedBlackstone',2,6,8]],
 portal:[['gold',1,4,8],['goldNugget',2,9,8],['obsidian',1,3,7],['flintSteel',1,1,5],['fireCharge',1,2,4],['goldenApple',1,1,2]],
 fossil:[['bone',3,12,9],['coal',2,8,8],['gold',1,3,3],['quartz',1,6,6]],
 wellNether:[['magmaCream',1,4,7],['quartz',2,7,8],['gold',1,4,4]],
 endCity:[['diamond',1,5,8],['emerald',1,7,9],['gold',2,7,7],['iron',2,8,7],['enderPearl',1,4,6],['enchantedGear',1,1,5],['spireTrim',1,1,1],['beetrootSeeds',2,8,4],['saddle',1,1,2]],
 endShip:[['diamond',1,5,8],['emerald',1,7,8],['gold',1,7,6],['iron',1,7,6],['enderPearl',1,4,5],['enchantedGear',1,1,6],['spireTrim',1,1,2],['healingPotion',1,2,3]],
 stronghold:[['enderPearl',1,3,7],['iron',1,7,8],['gold',1,5,6],['books',1,5,6],['redstone',1,4,6],['diamond',1,3,3],['eyeTrim',1,1,1]]
};
const ALIASES={peakTower:'watchtower',shoreRuins:'oceanRuins',well:'well',pavilion:'village',shrine:'village',bridge:'village',camp:'abandonedCamp',mushroomHut:'village'};
function rand(seed,x,y,z,salt){let h=Math.imul((Number(seed)||85721)|0,2246822519)^Math.imul(x|0,3266489917)^Math.imul(y|0,668265263)^Math.imul(z|0,374761393)^Math.imul(salt|0,1274126177);h=Math.imul(h^(h>>>15),2246822519);return ((h^(h>>>13))>>>0)/4294967296;}
function roll(kind,seed,x,y,z){
 const table=POOLS[kind]||POOLS[ALIASES[kind]]||POOLS.village;
 const result=new Map();const draws=4+Math.floor(rand(seed,x,y,z,18)*4);
 for(let i=0;i<draws;i++){
  const total=table.reduce((acc,e)=>acc+e[3],0);let ticket=rand(seed,x,y,z,i*7+28)*total;
  let entry=table.at(-1);for(const r of table){ticket-=r[3];if(ticket<0){entry=r;break}}
  const amount=entry[1]+Math.floor(rand(seed,x,y,z,i*11+145)*(entry[2]-entry[1]+1));
  result.set(entry[0],(result.get(entry[0])||0)+amount);
 }
 // Rare progression is always obtainable at the guaranteed major treasure site.
 if(kind==='bastionTreasure')result.set('netheriteUpgrade',Math.max(1,result.get('netheriteUpgrade')||0));
 if(kind==='endShip')result.set('elytra',1);
 return [...result].map(([item,count])=>({item,count}));
}
const DISPLAY={rawIron:'Raw Iron',rawCopper:'Raw Copper',rawGold:'Raw Gold',netheriteScrap:'Netherite Scrap',netheriteIngot:'Netherite Ingot',netheriteUpgrade:'Netherite Upgrade Template',ancientDebris:'Ancient Debris',goldenApple:'Golden Apple',goldNugget:'Gold Nugget',enchantedGear:'Enchanted Gear',enderPearl:'Ender Pearl',blazeRod:'Blaze Rod',magmaCream:'Magma Cream',eyeTrim:'Eye Armor Trim',spireTrim:'Spire Armor Trim'};
function label(name){if(DISPLAY[name])return DISPLAY[name];return String(name).replace(/([a-z])([A-Z])/g,'$1 $2').replace(/^./,s=>s.toUpperCase());}
window.MineWorldLoot={POOLS,roll,label};
})();
