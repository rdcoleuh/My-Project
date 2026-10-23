/* MineWorld original procedural 16x16 voxel pixel-art atlas. No external assets. */
(() => {
  'use strict';
  const SIZE=16, COLUMNS=8, ROWS=8;
  const clamp=(n)=>Math.max(0,Math.min(255,Math.round(n)));
  function hash(a,b,c){let x=(Math.imul(a+17,374761393)^Math.imul(b+29,668265263)^Math.imul(c+73,1442695041))|0;x=Math.imul(x^(x>>>13),1274126177);return ((x^(x>>>16))>>>0)/4294967295}
  function tileColor(b,face,x,y){
    const n=hash(x,y,b*13+face*101),m=hash(Math.floor(x/3),Math.floor(y/3),b+face*17);
    const v=(n-.5)*32+(m-.5)*13;
    let c=[130,130,130];
    switch(b){
      case 1:
        if(face===0)c=[91+v*.6,150+v,57+v*.55];
        else if(face===2)c=[113+v,77+v*.67,49+v*.53];
        else if(y<3+(hash(x,0,b)*2|0))c=[83+v*.5,137+v,51+v*.5];
        else c=[115+v,78+v*.73,51+v*.65];
        break;
      case 2:c=[116+v,79+v*.75,55+v*.54];break;
      case 3: {let dark=(hash(Math.floor(x/2),Math.floor(y/2),4)>.76)?-28:0;c=[128+v+dark,132+v+dark,137+v+dark];break}
      case 4:c=[216+v*.62,201+v*.64,151+v*.55];break;
      case 5:case 15:{
        const pale=b===15;
        if(face===0||face===2){
          const stripe=(Math.max(Math.abs(x-7.5),Math.abs(y-7.5))%4<1.5)?-19:7;
          c=pale?[155+stripe+v*.3,125+stripe+v*.35,93+stripe+v*.25]:[145+stripe+v*.3,103+stripe+v*.35,61+stripe+v*.2];
        }else{
          const stripe=((x+Math.floor(Math.sin(y*1.8)*.8))%5===0)?-24:((x+1)%5===0?15:0);
          c=pale?[164+stripe+v*.35,138+stripe+v*.33,107+stripe+v*.3]:[121+stripe+v*.35,85+stripe+v*.33,51+stripe+v*.2];
        }break}
      case 6:case 12:case 13:case 14:{
        const tones={6:[65,135,57],12:[163,50,40],13:[214,117,36],14:[214,177,58]};
        const t=tones[b],bright=(hash(Math.floor(x/2),Math.floor(y/2),b)>.68)?23:-7;
        c=[t[0]+v*.65+bright,t[1]+v*.7+bright,t[2]+v*.6+bright];break}
      case 7:c=[42+v*.48,118+v*.5,184+v*.45+(y%4===0?12:0)];break;
      case 8:{
        const row=Math.floor(y/5),off=(row%2)*7,vertical=((x+off)%9===0),horizontal=(y%5===0);
        c=(vertical||horizontal)?[106+v*.25,99+v*.25,88+v*.25]:[164+v*.75,72+v*.55,57+v*.42];break}
      case 9:{
        const border=x===0||x===15||y===0||y===15;
        c=border?[177+v*.3,215+v*.3,217+v*.3]:[198+v*.2,225+v*.2,224+v*.2];
        if((x===3&&y>2&&y<12)||(y===3&&x>3&&x<11))c=[244,250,252];break}
      case 10:{
        const glow=m>.55?26:-13;
        c=[221+v*.6+glow,179+v*.45+glow,91+v*.35+glow];break}
      case 11:{
        const plank=(y%4===0),nail=(x===2||x===13)&&(y%8===2);
        c=plank?[94+v*.4,67+v*.3,43+v*.2]:[178+v*.5,130+v*.42,78+v*.35];
        if(nail)c=[82,64,46];break}
      case 16:c=n>.78?[173+v*.5,64+v*.3,78+v*.3]:[85+v*.5,124+v*.4,62+v*.4];break;
      case 17:c=(x>4&&x<12&&y<9)?[212+v*.5,190+v*.4,148+v*.4]:[111+v*.5,75+v*.38,53+v*.35];break;
    }
    return [clamp(c[0]),clamp(c[1]),clamp(c[2]),255];
  }
  function create(gl){
    const canvas=document.createElement('canvas');canvas.width=SIZE*COLUMNS;canvas.height=SIZE*ROWS;
    const ctx=canvas.getContext('2d',{willReadFrequently:true});if(!ctx)throw Error('2D canvas textures unavailable');
    const img=ctx.createImageData(canvas.width,canvas.height);
    for(let b=1;b<=17;b++)for(let f=0;f<3;f++){
      const tile=b*3+f,col=tile%COLUMNS,row=Math.floor(tile/COLUMNS);
      for(let y=0;y<SIZE;y++)for(let x=0;x<SIZE;x++){
        const i=((row*SIZE+y)*canvas.width+col*SIZE+x)*4;
        const c=tileColor(b,f,x,y);for(let k=0;k<4;k++)img.data[i+k]=c[k];
      }
    }
    ctx.putImageData(img,0,0);
    window.MineWorldAtlas.dataURL=canvas.toDataURL('image/png');
    const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,canvas);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);
    return texture;
  }
  function uv(b,face,corner){
    const tile=b*3+face,x=tile%COLUMNS,y=Math.floor(tile/COLUMNS);
    const corners=[[0,0],[0,1],[1,1],[1,0]];
    const [u,v]=corners[corner];
    return [(x*SIZE+.5+u*(SIZE-1))/(SIZE*COLUMNS),(y*SIZE+.5+v*(SIZE-1))/(SIZE*ROWS)];
  }
  window.MineWorldAtlas={create,uv,tileColor};
})();