/* MineWorld 5.0 — original, wiki-informed classic voxel pixel motifs.
 * These are independently drawn 16x16 procedural textures, not Mojang image assets.
 * Special face features are built from crisp pixel-space shapes and small fixed palettes. */
(()=>{
  'use strict';
  const base=window.MineWorldPixelMaterials;
  if(!base)throw Error('Missing prior pixel materials');
  const old=base.paint;
  const lim=x=>Math.max(0,Math.min(255,Math.round(x)));
  const h=(x,y,k)=>{
    let n=(Math.imul(x+43,374761393)^Math.imul(y+101,668265263)^Math.imul(k+67,2246822519))|0;
    n=Math.imul(n^(n>>>15),3266489917);return ((n^(n>>>16))>>>0)/4294967295;
  };
  const color=(r,g,b)=>[lim(r),lim(g),lim(b),255];
  const ink=(pal,x,y,seed=0)=>{
    const a=h(x>>2,y>>2,seed),b=h(x>>1,y>>1,seed+31),c=h(x,y,seed+221);
    return pal[a<.18?0:a>.79?3:b>.69?2:1].map((v,i)=>i<3?lim(v+(c>.968?10:0)):255);
  };
  const inside=(x,y,x1,y1,x2,y2)=>x>=x1&&y>=y1&&x<=x2&&y<=y2;
  const frame=(x,y,edge=2)=>x<edge||y<edge||x>=16-edge||y>=16-edge;
  const palette={
    brick:[[75,64,60,255],[126,71,62,255],[158,80,71,255],[186,103,88,255]],
    stoneBrick:[[70,71,68,255],[113,115,112,255],[139,141,135,255],[167,170,161,255]],
    netherBrick:[[35,22,25,255],[71,31,38,255],[94,39,43,255],[123,49,54,255]],
    sandstone:[[149,138,104,255],[199,184,140,255],[218,202,158,255],[240,226,182,255]],
    quartz:[[139,124,113,255],[204,194,179,255],[233,228,215,255],[250,245,230,255]]
  };
  function masonry(b,x,y){
    const group=b===8?'brick':b===53||b===130?'stoneBrick':b===72||b===74?'netherBrick':b===24||b===54?'sandstone':'quartz';
    const size=group==='brick'?[4,8]:group==='netherBrick'?[4,9]:[5,8];
    const rh=size[0],rw=size[1],row=Math.floor(y/rh),offset=row%2?Math.floor(rw/2):0;
    const local=(x+offset)%rw,within=y%rh;
    const grout=within===0||local===0;
    const darkEdge=within===1||local===1;
    const p=palette[group],shade=h(Math.floor((x+offset)/rw),row,b+11)>.57;
    if(grout)return p[0];
    if(darkEdge)return p[shade?1:0];
    if((b===54||b===74)&&inside(x,y,5,4,10,11)&&(x===5||x===10||y===4||y===11))return p[0];
    return ink(shade?[p[0],p[1],p[2],p[3]]:[p[0],p[1],p[1],p[2]],x,y,b);
  }
  function charcoal(x,y,seed){
    const chunk=h(x>>2,y>>2,seed),fl=h(x,y,seed+81);
    if(fl>.97)return color(84,56,103);
    if(chunk>.70&&(x%4===1||y%4===0))return color(68,37,83);
    if(chunk<.24)return color(17,16,26);
    return color(36+Math.round(chunk*20),27+Math.round(chunk*9),47+Math.round(chunk*17));
  }
  function netherrack(x,y,kind){
    const core=kind===50||kind===65?[[58,24,25,255],[89,37,37,255],[114,45,45,255],[142,60,58,255]]:
      kind===68||kind===69?[[24,24,29,255],[43,42,47,255],[58,55,59,255],[79,72,77,255]]:
      [[53,44,45,255],[82,66,65,255],[111,94,89,255],[135,118,107,255]];
    const fissure=((x+Math.floor(y/4))%7===0&&h(x>>2,y>>2,kind+3)>.50);
    return fissure?core[0]:ink(core,x,y,kind);
  }
  function magma(x,y){
    const rock=h(x>>2,y>>2,88),river=(x+Math.floor(y/3)*2)%7===0||y%6===1&&rock>.45;
    const dot=h(x>>1,y>>1,132)>.8;
    if(river)return color(250,183,58);
    if(dot)return color(223,101,31);
    return rock>.48?color(84,48,39):color(51,31,32);
  }
  function workingStation(b,face,x,y){
    const top=face===0,side=face===1;
    const edge=frame(x,y,2),grille=(x>3&&x<12&&y>5&&y<13);
    const metal=[[45,48,47,255],[91,97,95,255],[124,125,120,255],[159,159,152,255]];
    if(b===168){
      if(top){
        if(edge)return color(100,68,40);
        if(x===8||y===8)return color(117,79,47);
        const cut=(inside(x,y,3,3,6,6)||inside(x,y,10,3,12,6));
        return cut?color(100,68,48):ink([[119,78,45,255],[156,107,61,255],[179,128,75,255],[201,152,98,255]],x,y,168);
      }
      if(edge)return color(97,62,38);
      if((x===5||x===10)&&y>2&&y<14)return color(88,62,48);
      if(y>5&&y<12&&x>4&&x<12){
        const tile=(x+y*2)%5===0;
        return tile?color(186,197,190):color(84,90,88);
      }
      return ink([[88,59,40,255],[141,96,56,255],[168,123,75,255],[194,145,87,255]],x,y,168);
    }
    if(b===20||b===156||b===157){
      if(top)return masonry(53,x,y);
      if(edge)return ink(metal,x,y,b);
      if(side&&grille){
        const burning=b===156||b===157&&y>9;
        if(burning&&h(x>>1,y>>1,71)>.4)return color(238,113,49);
        if(x===4||x===11||y===6||y===12)return color(31,31,29);
        return color(20,22,24);
      }
      return ink(metal,x,y,b+17);
    }
    if(b===136||b===166){
      if(top){
        if(edge)return color(82,76,69);
        const plate=inside(x,y,3,3,12,12);
        if(plate&&((x>=5&&x<=9&&y>=6&&y<=9)||x===4||y===11))return color(72,85,88);
        return plate?color(177,165,147):color(127,94,60);
      }
      if(edge)return color(67,59,49);
      if(y>=5&&y<=12&&x>=3&&x<=12)return color(105,113,113);
      return ink(metal,x,y,b);
    }
    if(b===119||b===120){
      const wood=[[68,43,26,255],[116,70,36,255],[156,98,49,255],[181,121,60,255]];
      const edge=x<2||x>13||y<2||y>13;
      const clasp=x>=7&&x<=9&&y>=7&&y<=11;
      if(edge)return color(59,61,59);
      if(clasp)return y===9?color(95,87,58):color(215,194,98);
      if(y===5||y===6||x===4||x===12)return color(75,54,36);
      return ink(wood,x,y,b+31);
    }
    return null;
  }
  function special(b,face,x,y){
    // Distinct hand-shaped source pixels: no downloaded or copied game textures.
    if(b===21){
      const snow=[[198,211,222,255],[227,234,238,255],[242,246,247,255],[254,255,255,255]];
      return ink(snow,x,y,21);
    }
    if(b===22||b===23){
      const bright=b===22,edge=x===0||y===0||x===15||y===15;
      const fracture=(x===6&&y>=4&&y<=12)||(y===7&&x>=6&&x<=11)||
        (x===10&&y>=9&&y<=13);
      if(fracture)return bright?color(96,166,187):color(76,124,168);
      return edge?color(119,166,191):ink(bright?
        [[102,164,185,255],[151,204,221,255],[185,227,237,255],[213,240,247,255]]:
        [[75,121,156,255],[102,151,184,255],[138,182,211,255],[177,208,225,255]],x,y,b);
    }
    if(b===25||b===27){
      const red=b===27,p=red?[[121,59,43,255],[145,73,54,255],[170,84,60,255],[191,99,73,255]]:
        [[116,76,61,255],[148,103,81,255],[169,120,95,255],[192,145,120,255]];
      return ink(p,x,y,b);
    }
    if(b===60){
      const tie=face===0?(x===5||x===10):(y===5||y===11);
      const stem=face===0?(y%3===0):(x%3===0||x%5===1);
      const knots=h(x>>1,y>>1,60)>.72;
      return tie?color(121,98,52):stem?
        color(knots?160:182,knots?127:148,67):
        ink([[130,102,49,255],[192,151,62,255],[217,180,79,255],[244,213,102,255]],x,y,60);
    }
    if(b===86){
      const band=face===0?(x===3||x===12||y===3||y===12):
        (y%6===0||y%6===1);
      return band?color(167,150,124):
        ink([[152,145,125,255],[201,192,162,255],[221,212,182,255],[247,240,210,255]],x,y,86);
    }
    if(b===109){
      const rim=x<2||y<2||x>=14||y>=14;
      const groove=x===7||y===7;
      const lit=h(x>>2,y>>2,109)>.27;
      return rim?color(72,58,39):groove?color(111,83,43):
        lit?ink([[154,94,33,255],[198,139,50,255],[239,191,81,255],[255,225,125,255]],x,y,109):
        color(115,86,47);
    }
    if(b===118){
      const band=x<2||x>13||y===4||y===11;
      const clasp=(x===7||x===8)&&y>=5&&y<=10;
      return clasp?color(204,187,118):band?color(73,65,56):
        ink([[107,71,47,255],[143,98,64,255],[175,119,75,255],[204,152,93,255]],x,y,118);
    }

    if(b===169){
      const rim=x===0||y===0||x===15||y===15;
      if(face===0){
        if(y<=4)return color(226+(h(x,y,169)>.7?15:0),224,216);
        if(rim)return color(87,43,36);
        const fold=y===5||y===6||(y===12&&x>2&&x<13);
        return fold?color(149,37,49):ink([[113,27,39,255],[172,40,51,255],[189,48,61,255],[218,72,72,255]],x,y,169);
      }
      if(face===2)return ink([[61,43,28,255],[94,62,37,255],[125,87,48,255],[144,104,65,255]],x,y,169);
      if(y<=4)return ink([[115,28,37,255],[161,37,48,255],[192,54,64,255],[213,69,74,255]],x,y,169);
      if(y>=13)return color(73,48,29);
      return ink([[76,47,30,255],[101,64,39,255],[129,88,52,255],[151,110,68,255]],x,y,169);
    }
    if([8,24,53,54,72,74,130].includes(b))return masonry(b,x,y);
    if(b===51)return charcoal(x,y,b);
    if([50,65,68,69,70,71].includes(b))return netherrack(x,y,b);
    if(b===88)return magma(x,y);
    if([168,20,156,157,136,166,119,120].includes(b))return workingStation(b,face,x,y);
    if(b===169){
      // Red Bed: pillow, red wool blanket, planked underside — independent 16px artwork.
      if(face===0){
        if(y<5)return ink([[184,181,173,255],[219,217,205,255],[237,236,226,255],[250,250,241,255]],x,y,169);
        if(y===5||y===15)return color(114,48,45);
        const fold=(y===11&&x>2&&x<14),seam=(x===1||x===14);
        return fold?color(201,77,68):seam?color(130,36,42):
          ink([[103,33,36,255],[153,42,48,255],[182,47,53,255],[207,66,65,255]],x,y,169);
      }
      if(face===2)return ink([[79,49,30,255],[119,76,44,255],[143,96,55,255],[165,111,70,255]],x,y,169);
      const bedding=y<10,leg=(x<3||x>12)&&y>12;
      if(leg)return color(91,60,36);
      if(bedding)return ink([[105,31,35,255],[156,42,49,255],[180,48,54,255],[206,64,65,255]],x,y,169);
      return ink([[73,48,32,255],[112,71,40,255],[143,95,55,255],[171,117,75,255]],x,y,169);
    }
    if(b===121){
      const pits=h(x>>1,y>>1,121)>.81&&(x%3===0||y%3===1);
      const colorSet=[[156,156,123,255],[194,194,159,255],[209,212,179,255],[231,225,193,255]];
      return pits?colorSet[0]:ink(colorSet,x,y,121);
    }
    if(b===10||b===90){
      const p=b===10?[[110,82,50,255],[187,149,78,255],[221,185,109,255],[249,220,155,255]]:
        [[165,96,49,255],[214,147,69,255],[239,188,102,255],[253,221,149,255]];
      const bright=h(x>>2,y>>2,b)>.71;
      return bright?p[3]:ink(p,x,y,b);
    }
    if(b===9){
      if(frame(x,y,1))return color(183,212,218);
      if((x===3&&y<12)||(y===3&&x>2&&x<12)||(x===12&&y>5))return color(235,249,249);
      return color(194,221,227);
    }
    if(b===44){
      if(face===0){const rim=frame(x,y,3);return rim?color(49,108,46):color(100,157,67);}
      if(x%5===0)return color(40,104,43);
      if(y%6===4&&x%5===2)return color(201,203,117);
      return ink([[45,97,37,255],[69,128,49,255],[95,153,63,255],[119,172,82,255]],x,y,44);
    }
    if(b===55){
      const q=(((x>>2)+(y>>2))%4===0);
      return q?color(108,177,170):ink([[37,95,110,255],[62,132,144,255],[87,158,165,255],[124,191,187,255]],x,y,55);
    }
    if(b===64){
      const fleck=h(x>>1,y>>1,64)>.82;
      return fleck?color(34,153,168):ink([[9,24,40,255],[17,44,57,255],[27,65,69,255],[39,84,87,255]],x,y,64);
    }
    return null;
  }
  base.paint=function(b,f,x,y){
    x&=15;y&=15;
    return special(b,f,x,y)||old(b,f,x,y);
  };
  base.version='5.0-classic-pixel-shapes';
  base.modelPixels=16;
})();