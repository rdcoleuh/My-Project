/* MineWorld 5.6: original 64x64 player skin. Each painted square is one texel.
 * No borrowed skins or artwork. Saves to the same browser as the world library. */
(()=>{
'use strict';
const SIZE=64,STORE='mineworld-avatar-skin-v1';
const PARTS={
 head:{label:'Head',top:[8,0,8,8],bottom:[16,0,8,8],left:[0,8,8,8],right:[16,8,8,8],front:[8,8,8,8],back:[24,8,8,8]},
 torso:{label:'Jacket',top:[20,16,8,4],bottom:[28,16,8,4],left:[16,20,4,12],right:[28,20,4,12],front:[20,20,8,12],back:[32,20,8,12]},
 armR:{label:'Right arm',top:[44,16,4,4],bottom:[48,16,4,4],left:[40,20,4,12],right:[48,20,4,12],front:[44,20,4,12],back:[52,20,4,12]},
 armL:{label:'Left arm',top:[36,48,4,4],bottom:[40,48,4,4],left:[32,52,4,12],right:[40,52,4,12],front:[36,52,4,12],back:[44,52,4,12]},
 legR:{label:'Right leg',top:[4,16,4,4],bottom:[8,16,4,4],left:[0,20,4,12],right:[8,20,4,12],front:[4,20,4,12],back:[12,20,4,12]},
 legL:{label:'Left leg',top:[20,48,4,4],bottom:[24,48,4,4],left:[16,52,4,12],right:[24,52,4,12],front:[20,52,4,12],back:[28,52,4,12]}
};
const FACES=['right','left','top','bottom','back','front'],data=new Uint8ClampedArray(SIZE*SIZE*4);
const documentRef=document,sheet=documentRef.createElement('canvas');sheet.width=sheet.height=SIZE;
const sheetCtx=sheet.getContext('2d',{willReadFrequently:true});
let gl=null,tex=null,part='head',side='front',brush='#e99549',drawing=false,saved=true;
const $=id=>documentRef.getElementById(id);
const rgb=hex=>[1,3,5].map(k=>parseInt(hex.slice(k,k+2),16));
function setAbsolute(x,y,c){
 const i=(y*SIZE+x)*4;
 data[i]=c[0];data[i+1]=c[1];data[i+2]=c[2];data[i+3]=255;
}
function defaultSkin(){
 data.fill(0);
 const colors={head:[205,160,122],torso:[43,115,112],armR:[174,104,52],armL:[174,104,52],legR:[54,66,92],legL:[54,66,92]};
 for(const [name,p] of Object.entries(PARTS))for(const face of FACES){
  const [x,y,w,h]=p[face];
  for(let iy=0;iy<h;iy++)for(let ix=0;ix<w;ix++){
   let color=colors[name];
   if(name==='head'){
    if(face==='top'||iy<2&&ix%3!==2)color=[58,51,45];
    if(face==='front'&&iy===4&&(ix===2||ix===5))color=[31,78,92];
    if(face==='front'&&iy===6&&(ix===3||ix===4))color=[163,97,84];
   }else if(name==='torso'&&((ix===2||ix===w-3)&&iy>=3))color=[222,139,70];
   else if(name.startsWith('arm')&&iy>8)color=[216,163,121];
   else if(name.startsWith('leg')&&iy>8)color=[33,39,48];
   setAbsolute(x+ix,y+iy,color);
  }
 }
 saved=false;refresh();
}
function refresh(){
 const image=sheetCtx.createImageData(SIZE,SIZE);image.data.set(data);sheetCtx.putImageData(image,0,0);
 if(gl&&tex){gl.bindTexture(gl.TEXTURE_2D,tex);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,sheet);}
 renderEditor();
}
function load(){
 try{const raw=localStorage.getItem(STORE);if(!raw)return false;
  const decoded=atob(raw);if(decoded.length!==data.length)return false;
  for(let i=0;i<data.length;i++)data[i]=decoded.charCodeAt(i);
  saved=true;refresh();return true;
 }catch(_){return false}
}
function save(){
 try{let text='';for(let i=0;i<data.length;i++)text+=String.fromCharCode(data[i]);
  localStorage.setItem(STORE,btoa(text));saved=true;status('Saved! Your skin is shared across all your worlds.');return true;
 }catch(_){status('Could not save. Export the PNG as a backup.');return false}
}
function paint(partName,sideName,x,y,color){
 const box=PARTS[partName]?.[sideName];if(!box||!Number.isInteger(x)||!Number.isInteger(y)||x<0||y<0||x>=box[2]||y>=box[3])return false;
 const hex=/^#[0-9a-fA-F]{6}$/.test(color)?color:'#e99549';
 setAbsolute(box[0]+x,box[1]+y,rgb(hex));saved=false;refresh();return true;
}
function uv(partName,face,corner){
 const r=(PARTS[partName]||PARTS.torso)[FACES[face]];
 const [a,b]=[[0,0],[0,1],[1,1],[1,0]][corner];
 return [(r[0]+.5+(r[2]-1)*a)/SIZE,(r[1]+.5+(r[3]-1)*b)/SIZE];
}
function makeTexture(context){
 gl=context;tex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,tex);
 gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);
 refresh();return tex;
}
const style=documentRef.createElement('style');
style.textContent=[
 '#mw-skin-modal{position:absolute;inset:0;z-index:6000;display:none;align-items:center;justify-content:center;background:#09160bed;padding:12px;color:#f1f8eb;box-sizing:border-box}',
 '#mw-skin-modal.open{display:flex}',
 '#mw-skin-panel{width:min(710px,100%);max-height:calc(100dvh - 24px);overflow:auto;background:#253728;border:2px solid #aacc9a;border-radius:8px;padding:14px;font:14px/1.5 system-ui;box-sizing:border-box}',
 '#mw-skin-head{display:flex;align-items:center;justify-content:space-between;gap:10px}',
 '#mw-skin-head strong{font-size:19px}',
 '#mw-skin-panel p{margin:6px 0 12px;font-size:12px;color:#daead3}',
 '#mw-skin-panel select,#mw-skin-panel button,#mw-skin-panel input{color:white;background:#304d36;border:1px solid #9bb49a;border-radius:4px;padding:8px;min-height:36px;font:inherit}',
 '#mw-skin-panel button{cursor:pointer}',
 '#mw-skin-panel input[type=color]{padding:2px;width:54px}',
 '#mw-skin-controls,#mw-skin-actions,#mw-skin-palette{display:flex;gap:7px;flex-wrap:wrap;margin:8px 0}',
 '#mw-skin-main{display:flex;gap:14px;flex-wrap:wrap;align-items:flex-start}',
 '#mw-skin-editor{image-rendering:pixelated;display:block;max-width:min(320px,100%);max-height:44vh;border:2px solid #8fa88b;touch-action:none}',
 '#mw-skin-sheet{image-rendering:pixelated;width:150px;height:150px;border:1px solid #8fa88b}',
 '#mw-skin-palette button{width:30px;height:30px;min-height:30px;padding:0;border:2px solid white}',
 '#mw-skin-status{font-size:12px;color:#d4f3b6;display:block}',
 '#mw-skin-import{max-width:100%;font-size:12px}',
 '@media(max-width:550px){#mw-skin-panel{padding:10px}#mw-skin-sheet{width:100px;height:100px}}'
].join('\n');
documentRef.head.appendChild(style);
const modal=documentRef.createElement('div');modal.id='mw-skin-modal';modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');modal.setAttribute('aria-label','Customize player skin');
modal.innerHTML=[
 '<div id="mw-skin-panel">',
 '<div id="mw-skin-head"><strong>🎨 Skin Studio · 64×64 pixels</strong><button type="button" id="mw-skin-close">✕ Close</button></div>',
 '<p>Customize each pixel of your original skin. Choose a body part and face, then draw with your mouse or finger. It appears in third-person views.</p>',
 '<div id="mw-skin-controls">',
 '<label>Body <select id="mw-skin-part"></select></label>',
 '<label>Side <select id="mw-skin-side"><option value="front">Front</option><option value="back">Back</option><option value="left">Left</option><option value="right">Right</option><option value="top">Top</option><option value="bottom">Bottom</option></select></label>',
 '<label>Brush <input id="mw-skin-color" type="color" value="#e99549"></label></div>',
 '<div id="mw-skin-palette"></div>',
 '<div id="mw-skin-main"><canvas id="mw-skin-editor" aria-label="Editable skin pixel grid"></canvas><div><small>Complete skin map</small><canvas id="mw-skin-sheet" width="64" height="64"></canvas></div></div>',
 '<div id="mw-skin-actions"><button id="mw-skin-save">✓ Save skin</button><button id="mw-skin-export">↓ Export PNG</button><label>Import 64×64 PNG <input id="mw-skin-import" type="file" accept="image/png"></label><button id="mw-skin-reset">↻ Reset</button></div>',
 '<small id="mw-skin-status" role="status">Ready to paint.</small></div>'
].join('');
documentRef.body.appendChild(modal);
for(const [name,p] of Object.entries(PARTS)){const option=documentRef.createElement('option');option.value=name;option.textContent=p.label;$('mw-skin-part').appendChild(option);}
for(const color of ['#f1cba0','#c8885c','#965837','#553b2c','#292b34','#ffffff','#2f777b','#e99549','#6aace0','#6f3c9a','#7bb653','#c93c51']){
 const btn=documentRef.createElement('button');btn.type='button';btn.style.backgroundColor=color;btn.setAttribute('aria-label','Paint '+color);
 btn.addEventListener('click',()=>{brush=color;$('mw-skin-color').value=color});$('mw-skin-palette').appendChild(btn);
}
const editor=$('mw-skin-editor'),preview=$('mw-skin-sheet');
function status(text){$('mw-skin-status').textContent=text}
function renderEditor(){
 if(!editor||!preview)return;
 const r=PARTS[part][side];editor.width=r[2]*26;editor.height=r[3]*26;
 const ec=editor.getContext('2d');if(!ec)return;
 for(let y=0;y<r[3];y++)for(let x=0;x<r[2];x++){
  const i=((r[1]+y)*SIZE+r[0]+x)*4;
  ec.fillStyle='rgb('+data[i]+','+data[i+1]+','+data[i+2]+')';
  ec.fillRect(x*26,y*26,26,26);ec.strokeStyle='#26342d8a';ec.strokeRect(x*26+.5,y*26+.5,26,26);
 }
 const pc=preview.getContext('2d');if(pc){const img=pc.createImageData(64,64);img.data.set(data);pc.putImageData(img,0,0);}
}
function pointerPaint(e){
 const bounds=editor.getBoundingClientRect(),r=PARTS[part][side];
 if(!bounds.width||!bounds.height)return;
 const x=Math.floor((e.clientX-bounds.left)*r[2]/bounds.width),y=Math.floor((e.clientY-bounds.top)*r[3]/bounds.height);
 if(paint(part,side,x,y,brush))status('Unsaved changes · tap Save skin.');
}
editor.addEventListener('pointerdown',e=>{drawing=true;editor.setPointerCapture(e.pointerId);pointerPaint(e);e.preventDefault()});
editor.addEventListener('pointermove',e=>{if(drawing){pointerPaint(e);e.preventDefault()}});
for(const action of ['pointerup','pointercancel','lostpointercapture'])editor.addEventListener(action,()=>drawing=false);
$('mw-skin-part').addEventListener('change',e=>{part=e.target.value;renderEditor()});
$('mw-skin-side').addEventListener('change',e=>{side=e.target.value;renderEditor()});
$('mw-skin-color').addEventListener('input',e=>brush=e.target.value);
$('mw-skin-close').addEventListener('click',()=>modal.classList.remove('open'));
$('mw-skin-save').addEventListener('click',save);
$('mw-skin-reset').addEventListener('click',()=>{if(confirm('Reset your skin? Export a PNG first if you want a backup.')){defaultSkin();status('Reset. Save to keep this change.')}});
$('mw-skin-export').addEventListener('click',()=>{const a=documentRef.createElement('a');a.href=sheet.toDataURL('image/png');a.download='mineworld-skin.png';a.click()});
$('mw-skin-import').addEventListener('change',async e=>{
 const file=e.target.files?.[0];if(!file)return;
 if(file.type!=='image/png'||file.size>2500000){status('Choose a PNG smaller than 2.5 MB.');return;}
 const url=URL.createObjectURL(file),image=new Image();
 try{
  await new Promise((ok,no)=>{image.onload=ok;image.onerror=no;image.src=url});
  if(image.width!==64||image.height!==64)throw Error('PNG must be 64×64 pixels.');
  const temp=documentRef.createElement('canvas');temp.width=temp.height=64;
  const c=temp.getContext('2d');c.drawImage(image,0,0);
  const imported=c.getImageData(0,0,64,64).data;
  for(let i=0;i<imported.length;i+=4){data[i]=imported[i];data[i+1]=imported[i+1];data[i+2]=imported[i+2];data[i+3]=255;}
  saved=false;refresh();status('Imported. Choose Save skin to keep.');
 }catch(err){status('Import failed: '+(err.message||'Invalid image'))}
 finally{URL.revokeObjectURL(url);e.target.value='';}
});
modal.addEventListener('pointerdown',e=>{if(e.target===modal)modal.classList.remove('open')});
documentRef.addEventListener('keydown',e=>{if(e.code==='Escape'&&modal.classList.contains('open')){e.stopImmediatePropagation();e.preventDefault();modal.classList.remove('open')}},true);
defaultSkin();load();
window.MineWorldSkin=Object.freeze({parts:PARTS,uv,makeTexture,paint,save,open(){renderEditor();modal.classList.add('open')},close(){modal.classList.remove('open')},
 get pixels(){return new Uint8ClampedArray(data)},get canvas(){return sheet},get saved(){return saved}});
})();