/* Regression: repeated furnace redraws must retain station-specific help. */
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const source=fs.readFileSync(require('node:path').join(__dirname,'../furnace-ui.js'),'utf8');
test('redraw retains smoker and blast furnace recipe restrictions',()=>{
 const redraw=source.slice(source.indexOf('function render(){'),source.indexOf('function open(position,kind=',source.indexOf('function render(){')));
 assert.match(redraw,/m\.kind==='smoker'\?'Food only'/);
 assert.match(redraw,/m\.kind==='blast'\?'Ores and metals only'/);
 assert.match(redraw,/cookDuration/);
});
test('redraw keeps gesture and XP instructions after quarter-second updates',()=>{
 const redraw=source.slice(source.indexOf('function render(){'),source.indexOf('function open(position,kind=',source.indexOf('function render(){')));
 assert.match(redraw,/Shift adds a stack/);
 assert.match(redraw,/Alt takes one/);
 assert.match(redraw,/Collect output for experience/);
 assert.match(source,/if\(drawClock>=\.25\).*render\(\)/);
});
