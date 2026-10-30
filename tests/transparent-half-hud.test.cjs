/* Transparent imported half sprites must preserve the fallback empty outline. */
'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const smoke=fs.readFileSync(path.join(root,'scripts/browser-smoke.cjs'),'utf8');
test('half hearts and food prefer imported empty underlays with procedural fallback',()=>{
 const renderer=html.slice(html.indexOf('function updateSurvivalHUD(){'),
   html.indexOf('function setGameMode(next)'));
 assert.match(renderer,/if\(fill==='half'\)\{[\s\S]*?image\.classList\.add\('mw-pack-stat-layer'\);[\s\S]*?icon\.appendChild\(image\);/);
 assert.match(renderer,/const emptySrc=await cachedStatArt\(pack,glyph,'empty'\)/);
 assert.match(renderer,/const emptyUnderlay=emptySrc\?document\.createElement\('img'\):[\s\S]*?window\.MineWorldHudArt\?\.paint\(glyph,'empty'\)/);
 assert.match(renderer,/if\(!icon\.isConnected\|\|pack!==window\.MineWorldLocalTextures\|\|/);
 assert.match(renderer,/if\(emptyUnderlay\)icon\.replaceChildren\(emptyUnderlay\)/);
 assert.match(renderer,/else icon\.replaceChildren\(image\)/);
 assert.match(html,/\.mw-pack-stat-layer\{position:absolute;inset:0;pointer-events:none\}/);
 assert.match(html,/#hunger-text \.mw-pack-stat-clipped\{clip-path:inset\(0 0 0 50%\)!important\}/);
});
test('desktop and mobile Chrome smoke check real imported full-only half-heart overlay',()=>{
 assert.match(smoke,/mode==='half-no-empty'/);
 assert.match(smoke,/makeTestArchive\('half-no-empty'\)/);
 assert.match(smoke,/halfLayer\.count===2&&halfLayer\.outlineAlpha===255&&halfLayer\.emptyOutline/);
 assert.match(smoke,/mobile-half-heart-no-empty-synthetic\.png/);
 assert.match(smoke,/desktop-half-heart-no-empty-synthetic\.png/);
});
