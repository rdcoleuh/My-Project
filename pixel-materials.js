/* MineWorld 4.1 — original hand-authored procedural pixel materials.
   Each surface has exactly 16 × 16 source pixels. No Minecraft files or art used. */
(() => {
  'use strict';
  const clamp=n=>Math.max(0,Math.min(255,Math.round(n)));
  function rnd(x,y,s){
    let h=(Math.imul((x|0)+137,374761393)^Math.imul((y|0)+911,668265263)^Math.imul((s|0)+787,1442695041))|0;
    h=Math.imul(h^(h>>>13),1274126177);return ((h^(h>>>16))>>>0)/4294967295;
  }
  function scatter(x,y,s){return rnd(x,y,s)*.24+rnd(x>>1,y>>1,s+43)*.37+rnd(x>>2,y>>2,s+174)*.39;}
  function tone(base,x,y,s,contrast=1){
    const p=(scatter(x,y,s)-.47)*76*contrast;
    const fl=rnd(x,y,s+311)>.967?-24:0;
    return [clamp(base[0]+p+fl),clamp(base[1]+p+fl*.79),clamp(base[2]+p+fl*.7),255];
  }
  function withShade(base,delta){return [clamp(base[0]+delta),clamp(base[1]+delta),clamp(base[2]+delta)];}
  function earth(x,y,variant=0){
    const base=variant===1?[100,75,53]:variant===2?[96,67,48]:[121,84,57];
    const cluster=scatter(x,y,11+variant*91);
    let c=tone(base,x,y,39+variant,1.05);
    if(cluster>.64)c=tone([82,59,42],x,y,variant+51,.65);
    if(rnd(x,y,variant+88)>.96)c=tone([171,120,72],x,y,variant+19,.35);
    return c;
  }
  function grass(x,y,variant=0){
    const palettes=[[94,148,55],[71,120,51],[138,153,64],[75,138,68],[104,151,77]];
    const c=palettes[variant%palettes.length],patch=scatter(x,y,761+variant);
    let base=patch>.70?withShade(c,-24):patch<.35?withShade(c,15):c;
    if(rnd(x>>1,y>>1,202+variant)>.945)base=withShade(c,28);
    return tone(base,x,y,88+variant*.3,.58);
  }
  function stone(x,y,dark=false,s=0){
    const base=dark?[71,75,81]:[124,126,125],cluster=scatter(x,y,501+s);
    let c=cluster>.65?withShade(base,-28):cluster<.32?withShade(base,19):base;
    const crack=rnd(x>>2,y>>1,s+163)>.69&&(x%4===0||(y%4===0&&x%2===0));
    if(crack)c=withShade(base,-36);
    if(rnd(x,y,s+57)>.965)c=withShade(base,31);
    return tone(c,x,y,s+712,.55);
  }
  function sand(x,y,red=false){
    const base=red?[187,100,65]:[218,204,152];
    let c=tone(base,x,y,red?918:38,.35);
    const fleck=rnd(x,y,red?73:29);
    if(fleck>.962)c=tone(withShade(base,-35),x,y,601,.15);
    else if(fleck<.035)c=tone(withShade(base,19),x,y,602,.16);
    return c;
  }
  function logFace(x,y,base,side,s){
    if(!side){
      const a=Math.max(Math.abs(x-7.5),Math.abs(y-7.5));
      const w=Math.floor(a/2);
      const shade=w%2===0?19:-14;
      const knot=(Math.abs(x-7.5)<=1.6&&Math.abs(y-7.5)<=2.1)?-29:0;
      return tone(withShade(base,shade+knot),x,y,s+100,.29);
    }
    const thread=rnd(x>>1,y>>2,s+881)>.49?1:0;
    const stripe=(x===2||x===3||x===7||x===12||((x+y/4|0)%11===0))?-26:0;
    const grain=thread?9:-7;
    const darkSplice=(x===7&&y>=5&&y<=11)?-36:0;
    return tone(withShade(base,stripe+grain+darkSplice),x,y,s,.39);
  }
  function leaves(x,y,base,s){
    const n=scatter(x,y,s+225),b=rnd(x>>1,y>>1,s+14);
    let c=base;
    if(n>.65)c=withShade(base,18);
    if(n<.34)c=withShade(base,-25);
    if(b>.84)c=withShade(base,28);
    if(rnd(x,y,s+630)>.973)c=withShade(base,-55);
    return tone(c,x,y,s,.58);
  }
  function plank(x,y,base,s){
    const row=Math.floor(y/4),seam=y%4===0,offset=row%2?8:0;
    const join=((x+offset)%15===0)&&y%4>0;
    const streak=(rnd(x>>1,row,s+7)>.67)?11:-6;
    const pin=((x+offset)%15===2)&&y%4===2;
    const c=withShade(base,seam?-37:join?-29:pin?-34:streak);
    return tone(c,x,y,s+290,.45);
  }
  function brick(x,y,base,s,height=5,width=8){
    const row=Math.floor(y/height),offset=row%2?(width>>1):0;
    const grout=y%height===0||(x+offset)%width===0;
    let c=grout?withShade(base,-43):base;
    if(!grout&&rnd(x>>2,y>>1,s+79)>.83)c=withShade(base,17);
    return tone(c,x,y,s,.47);
  }
  function cobble(x,y,s=71){
    const row=Math.floor(y/5),off=row%2?3:0;
    const grout=y%5===0||(x+off)%6===0;
    const depth=(x+off)%6>=4||y%5===4;
    let c=grout?[62,66,64]:depth?[114,119,118]:[151,154,150];
    return tone(c,x,y,s,.5);
  }
  function oreMask(x,y,s){
    const g=rnd(x>>2,y>>2,s+105);
    const n=rnd(x>>1,y>>1,s+449),v=rnd(x,y,s+313);
    const a=(g>.62&&n>.37)||(g>.48&&n>.78)||(v>.94&&g>.44);
    const edge=g>.60&&n>.3&&v<.12;
    return a?(edge?1:2):0;
  }
  function ore(x,y,base,metal,s){
    const m=oreMask(x,y,s);
    if(m===2){
      const c=rnd(x>>1,y>>1,s+550)>.48?withShade(metal,32):metal;
      return tone(c,x,y,s+23,.22);
    }
    if(m===1)return tone(withShade(metal,-44),x,y,s+.5,.25);
    return stone(x,y,base==='deep',s+19);
  }
  function mineralBlock(x,y,base,s){
    const seam=x===0||y===0||x===15||y===15||x===1||y===1;
    const diagonal=((x+y)%9===0&&rnd(x>>1,y>>1,s)>.4);
    const c=withShade(base,seam?-41:diagonal?25:0);
    return tone(c,x,y,s,.38);
  }
  function farms(x,y,hydrated){
    const groove=x%4===0||x%4===1;
    const base=hydrated?[84,57,40]:[107,69,44];
    return tone(withShade(base,groove?-26:7),x,y,176,.63);
  }
  function crop(x,y,id){
    const kind=Math.floor((id-139)/4),growth=(id-139)%4;
    const stem=(x%5===2||(x+3)%6===0)&&y>=(13-growth*3);
    const leaf=stem&&(rnd(x,y,id)> .18);
    const base=kind===0?[73,153,52]:kind===1?[63,163,67]:kind===2?[66,143,68]:[78,151,57];
    if(stem||leaf){
      const accent=growth===3?kind===0?[217,177,81]:kind===1?[232,114,49]:kind===2?[184,157,98]:[169,70,89]:base;
      return tone((y>11&&growth>=3)?accent:base,x,y,id,.44);
    }
    return tone([68,52,35],x,y,id,.48);
  }
  function paint(b,face,x,y){
    x=x&15;y=y&15;
    const top=face===0,bottom=face===2;
    if(b===1){
      if(top)return grass(x,y);
      if(bottom)return earth(x,y);
      const overhang=2+Math.floor(rnd(x>>1,0,199)*3);
      const blade=(y<overhang+(rnd(x,3,217)>.82?2:0));
      if(blade)return grass(x,y,1);
      return earth(x,y);
    }
    if(b===2)return earth(x,y);
    if(b===3)return stone(x,y);
    if(b===4)return sand(x,y);
    if(b===26)return sand(x,y,true);
    if(b===92)return tone([119,115,106],x,y,201,.9);
    if(b===28){if(top)return grass(x,y,1);return earth(x,y,1)}
    if(b===29)return earth(x,y,2);
    if(b===5||b===15||[30,32,34,36,38,40,42].includes(b)){
      const colors={5:[112,79,49],15:[130,101,72],30:[90,66,45],32:[200,190,160],34:[121,100,75],36:[125,91,58],38:[111,81,75],40:[147,98,114],42:[150,151,139]};
      const base=colors[b];
      const result=logFace(x,y,base,!(top||bottom),b);
      if(b===32&&face===1&&(x===3||x===4||x===11||x===12)&&rnd(y>>1,0,999)>.35)return tone([49,53,51],x,y,30,.26);
      return result;
    }
    if(b===11||b===52)return plank(x,y,b===52?[84,68,61]:[171,122,74],b);
    const leavesColor={6:[68,130,53],12:[153,55,40],13:[195,106,39],14:[208,173,52],31:[43,96,57],33:[93,147,61],35:[134,143,70],37:[48,125,47],39:[63,107,78],41:[233,161,191],43:[152,178,171]};
    if(Object.hasOwn(leavesColor,b))return leaves(x,y,leavesColor[b],b);
    if(b===7){
      let base=[47,111,169];
      const ripple=((y+Math.floor(Math.sin(x*.65)*1.3))%6===0)&&rnd(x>>2,y>>1,77)>.24;
      if(ripple)base=[93,169,210];
      if(rnd(x,y,8)>.965)base=[141,195,223];
      return tone(base,x,y,224,.34);
    }
    if(b===66){
      const line=((y+(x>>2))%7===0)||(Math.floor(y/4)+Math.floor(x/5))%8===0;
      const base=line?[255,187,62]:[236,81,22];
      if(rnd(x>>1,y>>1,328)>.78)return tone([252,124,17],x,y,409,.4);
      return tone(base,x,y,406,.55);
    }
    if(b===8)return brick(x,y,[177,78,60],b,4,8);
    if(b===53)return brick(x,y,[136,141,143],b,5,8);
    if(b===61)return cobble(x,y);
    if(b===58)return stone(x,y,true,133);
    if(b===57)return tone([152,152,142],x,y,11,.60);
    if(b===24||b===54){
      let c=sand(x,y,false);
      if(!top&&!bottom&&(y===3||y===10))c=tone([186,176,136],x,y,24,.22);
      if(b===54&&x>=4&&x<=11&&y>=4&&y<=11&&(x===4||x===11||y===4||y===11))c=[151,139,105,255];
      return c;
    }
    if(b===25||b===27)return tone(b===25?[162,112,89]:[148,73,55],x,y,b,.42);
    if(b===21)return tone([231,237,232],x,y,21,.28);
    if(b===22||b===23){
      const seam=(x+y)%12===0;
      return tone(seam?[209,239,239]:b===23?[105,153,185]:[153,205,228],x,y,b,.45);
    }
    if(b===9){
      const edge=x<2||y<2||x>13||y>13;
      const diagonal=(x===4&&y>=3&&y<=10)||(y===4&&x>=4&&x<=10)||(x===11&&y>=7&&y<=12);
      return edge?[163,198,204,255]:diagonal?[226,247,248,255]:tone([187,216,222],x,y,9,.16);
    }
    if(b===18||b===19)return ore(x,y,'stone',b===18?[38,42,45]:[188,127,86],b);
    const orePalette={95:[194,125,76],96:[241,202,69],97:[202,48,49],98:[53,82,197],99:[74,214,209],100:[48,198,113],
      101:[37,40,47],102:[181,115,78],103:[194,125,76],104:[241,202,69],105:[202,48,49],106:[53,82,197],107:[74,214,209],108:[48,198,113]};
    if(Object.hasOwn(orePalette,b))return ore(x,y,b>=101?'deep':'stone',orePalette[b],b);
    if(b===83||b===84)return ore(x,y,'stone',b===83?[237,219,193]:[241,178,58],b+162);
    if(b===85){const swirl=((x+Math.floor(y/3)*2)%7<2);return tone(swirl?[148,122,91]:[94,83,75],x,y,382,.5);}
    if(b===51){
      const vein=rnd(x>>2,y>>2,51)>.79&&(x+y)%5===0;
      return tone(vein?[73,39,103]:[35,27,45],x,y,51,.55);
    }
    if(b===50||b===65||b===70||b===71||b===67||b===68){
      const palette={50:[121,54,48],65:[119,45,48],70:[102,85,77],71:[82,77,74],67:[87,85,90],68:[50,49,54]};
      return stone(x,y,b===68||b===67,b+8).map((v,i)=>i===3?255:clamp(v*.28+palette[b][i]*.72));
    }
    if(b===72||b===74)return brick(x,y,[101,40,43],b,5,8);
    if(b===130)return brick(x,y,[194,196,156],b,5,8);
    if(b===131)return brick(x,y,[172,116,171],b,5,8);
    if(b===121)return tone([212,211,169],x,y,121,.63);
    if(b===132)return plank(x,y,[153,92,147],b);
    if(b===137||b===138)return farms(x,y,b===138);
    if(b>=139&&b<=154)return crop(x,y,b);
    if(b===75||b===76){if(top)return tone(b===75?[131,48,62]:[46,132,125],x,y,b,.95);return tone(b===75?[117,49,58]:[43,104,99],x,y,b,.79);}
    if(b===79||b===81)return leaves(x,y,b===79?[145,44,62]:[45,112,119],b);
    if(b===78||b===80)return logFace(x,y,b===78?[137,56,79]:[48,131,139],!(top||bottom),b);
    if(b===119||b===120){
      const latch=x>=7&&x<=9&&y>=6&&y<=10;
      const rim=x<2||x>=14||y<2||y>=14;
      const c=latch?[199,180,100]:rim?[70,45,27]:[156,103,52];
      return tone(b===120?withShade(c,-40):c,x,y,239,.42);
    }
    if(b===168){
      const edge=x<2||x>13||y<2||y>13;
      if(top){const center=(x>5&&x<11&&y>4&&y<12);return tone(edge?[77,50,31]:center?[129,84,55]:[187,141,88],x,y,168,.43);}
      const tool=x>3&&x<12&&y>4&&y<12;
      return tone(edge?[78,53,35]:tool?[107,120,119]:[156,111,66],x,y,168,.38);
    }
    if(b===20||b===156||b===157){
      const furnace=face===1&&x>3&&x<12&&y>4&&y<13;
      return tone(furnace?[39,33,32]:[137,137,132],x,y,b,.73);
    }
    if(b>=110&&b<=117){
      const minerals={110:[37,67,179],111:[41,174,95],112:[80,198,199],113:[178,110,66],114:[212,177,57],115:[192,196,190],116:[40,42,46],117:[175,43,46]};
      return mineralBlock(x,y,minerals[b],b);
    }
    // Additional distinct 16-pixel materials for every remaining placeable block.
    if(b===10||b===90||b===109){
      const light=rnd(x>>2,y>>2,b)>.48;
      const c=b===109?(light?[238,192,72]:[126,88,49]):b===90?(light?[241,190,102]:[217,130,79]):(light?[239,211,144]:[174,135,85]);
      const darker=(x%5===0||y%6===0)?-18:0;
      return tone(withShade(c,darker),x,y,b,.44);
    }
    if(b===16||b===17||b===62||b===73||b===77||b===82||b===93||b===94){
      const palettes={16:[163,58,70],17:[185,165,129],62:[61,157,140],73:[164,49,63],77:[188,46,68],82:[33,169,166],93:[35,172,160],94:[185,42,76]};
      const c=palettes[b],leaf=(rnd(x>>1,y>>1,b+25)>.42);
      const stem=(x%5===2||x%7===3);
      return tone(leaf?c:stem?withShade(c,-29):[51,43,39],x,y,b,.62);
    }
    if(b===44||b===45){
      if(top){
        const rim=x<3||x>12||y<3||y>12;
        return tone(rim?[42,106,46]:[98,150,61],x,y,b,.4);
      }
      const stripe=b===44?x%5===1:x%4===1;
      const joint=b===45&&y%6===0;
      const spike=b===44&&y%8===3&&x%5===2;
      const c=spike?[182,189,104]:joint?[87,137,56]:stripe?[38,102,45]:[87,153,69];
      return tone(c,x,y,b,.43);
    }
    if(b===46||b===47){
      const c=b===46?[66,111,55]:[77,67,58];
      return tone(c,x,y,b,.93);
    }
    if(b===48||b===49){
      const red=b===48,spot=rnd(x>>1,y>>1,b+112)>.88;
      const cap=red?[174,53,52]:[131,99,65];
      return tone(spot?[233,220,197]:cap,x,y,b,.48);
    }
    if(b===55||b===56){
      if(b===55)return brick(x,y,[77,153,149],b,5,8);
      return mineralBlock(x,y,[179,113,69],b);
    }
    if(b===59||b===89||b===128){
      const frame=x<3||x>12||y<2||y>13;
      const glow=b===89?[43,189,199]:b===128?[233,216,178]:[249,202,91];
      const c=frame?[74,68,55]:glow;
      return tone(c,x,y,b,.29);
    }
    if(b===60){
      const tie=top?x===5||x===10:y===5||y===11;
      const straw=top?y%3===0:x%3===0;
      const c=tie?[122,101,60]:straw?[184,146,70]:[223,191,99];
      return tone(c,x,y,b,.5);
    }
    if(b===63){
      const r=rnd(x>>2,y>>2,b);
      return tone(r>.57?[144,118,92]:[88,75,63],x,y,b,.82);
    }
    if(b===64){
      const bright=rnd(x>>1,y>>1,b)> .90||(x+y)%13===0;
      return tone(bright?[35,134,156]:[25,44,58],x,y,b,.52);
    }
    if(b===69)return brick(x,y,[70,63,68],b,6,7);
    if(b===86){
      const stripe=face===1?(x%5===0||x%5===1):(y%4===0);
      return tone(stripe?[181,170,145]:[220,212,182],x,y,b,.33);
    }
    if(b===87||b===126||b===127){
      const purple=b===87,glow=rnd(x>>1,y>>2,b+414)>.67;
      const spark=rnd(x,y,b+288)>.967;
      const c=spark?[206,198,251]:purple?glow?[133,72,196]:[77,38,137]:glow?[58,64,111]:[17,25,49];
      return tone(c,x,y,b,.65);
    }
    if(b===88){
      const crack=(x+Math.floor(y/3)*2)%6<2||y%7===0;
      return tone(crack?[233,117,34]:[68,39,33],x,y,b,.5);
    }
    if(b===91){
      const gold=rnd(x>>1,y>>1,221)>.88||(x+y)%11===0;
      return tone(gold?[212,158,63]:[51,47,51],x,y,b,.49);
    }
    if(b===118)return tone((x%5===0||y%5===0)?[97,67,45]:[164,116,66],x,y,b,.54);
    if(b===122||b===123){
      const band=y%6===0,tip=b===123&&y<5;
      return tone(tip?[222,175,194]:band?[101,63,101]:[151,112,153],x,y,b,.55);
    }
    if(b===124){
      const core=(Math.abs(x-8)+Math.abs(y-8)<7);
      return tone(core?[231,198,246]:[123,69,155],x,y,b,.48);
    }
    if(b===125){
      const eye=top&&Math.abs(x-8)<4&&Math.abs(y-8)<4;
      const rim=x<3||y<3||x>12||y>12;
      return tone(eye?[75,154,143]:rim?[49,61,49]:[89,130,111],x,y,b,.42);
    }
    if(b===129||b===134){
      const scales=rnd(x>>1,y>>1,b+21)>.72;
      return tone(scales?[84,66,94]:[50,40,57],x,y,b,.64);
    }
    if(b===133||b===135){
      const a=b===133?[139,87,146]:[57,54,63];
      const inset=(x>=3&&x<=12&&y>=3&&y<=12);
      return mineralBlock(x,y,inset?a:withShade(a,-35),b);
    }
    if(b===136||b===155||b>=158&&b<=167){
      const wood=[136,155,158,160,161,163,165].includes(b);
      const ring=x<2||x>13||y<2||y>13;
      const tool=(x>3&&x<12&&y>4&&y<12);
      const base=wood?[144,104,64]:[119,122,119];
      const center=wood?[105,83,69]:[76,86,91];
      const stripes=(x+y+b)%6===0;
      return tone(ring?withShade(base,-40):tool?(stripes?withShade(center,22):center):base,x,y,b,.45);
    }
    return null; // Retain the existing individually-authored fallback for other special blocks.
  }
  window.MineWorldPixelMaterials={paint,version:'4.1',size:16};
})();
