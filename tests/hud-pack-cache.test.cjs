'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
function cacheFactory(){
 const start=html.indexOf('let statArtGeneration=-1;');
 const end=html.indexOf('function updateSurvivalHUD(){',start);
 assert.ok(start>=0&&end>start,'HUD sprite cache must be integrated in the game');
 const code=html.slice(start,end);
 return new Function('Promise','Map','return (function(){'+code+';return cachedStatArt;})()')(Promise,Map);
}
test('twenty HUD icons share imported sprite lookups and invalidate on pack change',async()=>{
 const get=cacheFactory();
 let calls=0,generation=1;
 const pack={get generation(){return generation;},hudIcon:async()=>{calls++;return 'imported-png';}};
 const icons=await Promise.all(Array.from({length:20},()=>get(pack,'heart','full')));
 assert.equal(calls,1);
 assert.ok(icons.every(x=>x==='imported-png'));
 await get(pack,'heart','half');
 assert.equal(calls,2);
 generation++;
 await get(pack,'heart','full');
 assert.equal(calls,3);
});
test('invalid imported sprite is cached as a safe fallback',async()=>{
 const get=cacheFactory();
 let calls=0;
 const pack={generation:1,hudIcon:()=>{calls++;throw Error('broken sprite');}};
 assert.equal(await get(pack,'food','half'),null);
 assert.equal(await get(pack,'food','half'),null);
 assert.equal(calls,1);
});
test('HUD tooltip does not grow with every update',()=>{
 assert.doesNotMatch(html,/\$\('hunger-text'\)\.title\s*\+=/);
 assert.match(html,/\$\('hunger-text'\)\.title='Hunger: '/);
});
test('classic fallback slots preserve imported sprites and keyboard focus',()=>{
 assert.match(html,/#hotbar:not\(\.mw-pack-bar-image\) \.hot-item:not\(\.mw-pack-slot\)::before/);
 assert.match(html,/#hotbar \.hot-item:focus-visible/);
 assert.match(html,/background-size:100% auto!important;background-position:center!important;image-rendering:pixelated!important/);
});
