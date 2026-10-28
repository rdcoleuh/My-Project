/* Regression for selected-slot visibility with a partial imported HUD. */
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const smoke=fs.readFileSync(path.join(root,'scripts/browser-smoke.cjs'),'utf8');
test('background-only imported hotbar retains a centered square selected-slot frame',()=>{
 const reset='#hotbar.mw-pack-hotbar .hot-item.active:not(.mw-pack-selected){outline:0!important;box-shadow:none!important}';
 const rule='#hotbar.mw-pack-bar-image .hot-item.active:not(.mw-pack-selected):not(.mw-pack-slot)::after{';
 assert.ok(html.includes(reset),'existing generic selection reset is present');
 assert.ok(html.indexOf(rule)>html.indexOf(reset),'fallback must come after the outline reset');
 const body=html.slice(html.indexOf(rule),html.indexOf('}',html.indexOf(rule)));
 for(const property of ['content:""','aspect-ratio:1/1','border:2px solid #fff','pointer-events:none','z-index:2'])
  assert.ok(body.includes(property),property+' missing from the fallback frame');
 assert.ok(rule.includes(':not(.mw-pack-selected)'),'imported selection PNG must take precedence');
});
test('desktop and mobile Chrome exercise background-only synthetic HUD fallback',()=>{
 assert.ok(smoke.includes("generation:987654,hasPack:true"));
 assert.ok(smoke.includes("bar-image"));
 assert.ok(smoke.includes("a background-only HUD pack lost the selected-slot outline"));
 assert.ok(smoke.includes("mobile-background-only-selection-synthetic.png"));
 assert.ok(smoke.includes("desktop-background-only-selection-synthetic.png"));
 assert.ok(smoke.includes("window.MineWorldLocalTextures=window.__mineworldSmokePackOriginal"));
});
