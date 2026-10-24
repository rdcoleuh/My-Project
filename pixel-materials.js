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
    // Tightly grouped pixel colors with coherent 2x2 and 4x4 clusters,
    // avoiding the continuous 'static' noise that made older blocks look blurry.
    const cluster=rnd(x>>2,y>>2,s+213)*.53+rnd(x>>1,y>>1,s+417)*.35+rnd(x,y,s+729)*.12;
    const delta=Math.round(((cluster-.48)*71*contrast)/9)*9;
    const fleck=rnd(x,y,s+311)>.979?-18:0;
    const c=base.map((v,i)=>clamp(v+delta*(i===0?1:i===1?.87:.81)+fleck));
    return [c[0],c[1],c[2],255];
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
    const base=dark?[73,75,79]:[126,127,124];
    const large=rnd(x>>2,y>>2,s+501),small=rnd(x>>1,y>>1,s+589);
    let c=large>.67?withShade(base,-29):large<.28?withShade(base,21):base;
    const crack=(small>.77&&((x+1)%4===0||y%4===1))||
      (rnd((x+1)>>2,(y+3)>>2,s+163)>.83&&x%3===1&&y%3===0);
    if(crack)c=withShade(base,-38);
    if(rnd(x,y,s+57)>.977)c=withShade(base,34);
    return tone(c,x,y,s+712,.30);
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
    const cluster=rnd(x>>2,y>>2,s+225),leaves=rnd(x>>1,y>>1,s+14);
    let c=cluster>.68?withShade(base,28):cluster<.26?withShade(base,-31):base;
    if(leaves>.86)c=withShade(base,32);
    if(rnd(x,y,s+630)>.971)c=withShade(base,-52);
    return tone(c,x,y,s,.27);
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
    // Irregular staggered rock cobbles, not the earlier repeated stone-brick grid.
    const rows=[0,5,10,15],row=y<5?0:y<10?1:y<15?2:3;
    const yLocal=y-rows[row],offset=[0,4,1,5][row],width=[6,7,5,6][row];
    const xx=x+offset,col=Math.floor(xx/width),local=xx%width;
    const rough=rnd(col,row,s+94),edge=(yLocal===0||local===0||
      (yLocal===4&&rough>.35)||(local===width-1&&rough>.48));
    const seam=local===1||yLocal===1;
    const center=rough>.62?[156,160,158]:rough<.32?[126,134,135]:[145,150,146];
    const c=edge?[69,72,72]:seam?withShade(center,-20):center;
    return tone(c,x,y,s,.31);
  }
  function oreMask(x,y,s){
    // Small bright multi-pixel mineral clusters on recognizably solid host stone.
    const g=rnd(x>>2,y>>2,s+105),n=rnd(x>>1,y>>1,s+449),v=rnd(x,y,s+313);
    const vein=(g>.59&&n>.37)||(g>.42&&n>.85)||(v>.97&&g>.44);
    const shadow=(g>.58&&n>.36&&v<.16);
    return vein?(shadow?1:2):0;
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
    if(b===121){
      const scratch=rnd(x>>2,y>>2,121)>.63&&(x%4===0||y%4===1);
      return tone(scratch?[180,176,137]:[216,214,169],x,y,121,.48);
    }
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


/* MineWorld 4.3 detail layer: independently drawn classic block motifs.
   Pixel masks authored for MineWorld; Minecraft source textures are NOT bundled. */
(()=>{
'use strict';
const atlas=window.MineWorldPixelMaterials;
const prior=atlas.paint;
function hash(x,y,s=1){
  let z=Math.imul(x+1137,374761393)^Math.imul(y+2929,668265263)^Math.imul(s+911,1274126177);
  z=Math.imul(z^(z>>>13),1274126177);
  return ((z^(z>>>16))>>>0)/4294967295;
}
function rgba(c){return [c[0],c[1],c[2],255]}
function shade(c,n){return rgba(c.map(v=>Math.max(0,Math.min(255,v+n))|0))}
function pattern(lines,name){
  const rows=lines.map(s=>s.replace(/ /g,''));
  if(rows.length!==16||rows.some(s=>s.length!==16||!/^[0-6]+$/.test(s)))throw Error('Invalid texture drawing '+name);
  return rows.join('');
}
const DIRT=pattern([
'2222 2112 3332 1223','2332 1112 3233 2312','3221 1233 3221 1112','1221 1332 2212 3321',
'2112 2211 2332 3322','2221 3231 1322 1212','3332 3222 1233 1221','2212 1112 2213 3322',
'1223 1113 2212 2133','1233 2122 3232 2122','2211 2233 3321 1221','3223 2312 2112 2223',
'3322 2122 2111 3231','2211 1222 2333 3212','1121 2322 3323 2211','2212 2231 1222 3312'
],'dirt');
const STONE=pattern([
'2222 2221 2222 3222','2232 2111 1223 3322','2332 1212 2222 2223','2322 1222 3332 2222',
'2222 3332 3222 2112','1212 3222 2221 1122','2112 2223 2232 1222','2222 2332 3322 2222',
'2212 2221 2332 2222','2111 1222 2222 3322','2222 2223 3221 2222','2332 2233 2212 2232',
'2222 3222 2211 1122','2212 2221 1122 2222','2112 2222 2222 2332','2222 3232 2212 2222'
],'stone');
const COBBLE=pattern([
'0012 2200 1122 0001','0123 3210 1223 3012','1233 3210 2333 3212','1233 3220 2333 3210',
'0122 2100 1232 2100','0001 1000 0121 0011','1222 1012 2211 1232','2333 2102 3320 2333',
'2333 2102 3320 2333','1222 1012 2211 1232','0011 0001 1000 0110','0122 2102 2210 1232',
'1233 3202 3320 2333','1233 3202 3320 2333','0122 2101 2210 1232','0001 1000 1110 0010'
],'cobble');
const ROCKPAL=[[74,76,76],[100,103,103],[128,130,129],[152,154,152],[177,178,172]];
const DEEPPAL=[[30,33,40],[49,53,60],[70,75,83],[93,99,107],[118,121,128]];
const DIRTYPAL=[[65,47,33],[90,64,43],[114,80,53],[141,99,64],[166,124,81]];
function sample(mask,palette,x,y){return rgba(palette[Number(mask[y*16+x])])}
function stone(x,y,deep=false){return sample(STONE,deep?DEEPPAL:ROCKPAL,x,y)}
function dirt(x,y,coarse=false){
  if(coarse&&hash(x>>1,y>>1,92)>.73)return rgba([113,110,102]);
  return sample(DIRT,DIRTYPAL,x,y);
}
function grass(x,y,arid=false){
  const pal=arid?[[77,101,39],[101,122,46],[125,145,53],[149,163,62],[176,183,71]]:
    [[32,87,31],[47,113,37],[67,138,47],[90,162,57],[116,182,69]];
  const n=hash(x>>1,y>>1,163)*.75+hash(x,y,191)*.25;
  return rgba(pal[n>.79?4:n>.58?3:n>.37?2:n>.18?1:0]);
}
function grassSide(x,y){
  const r=hash(x,0,177),max=r>.83?6:r>.64?5:r>.36?4:3;
  return y<max||(y===max&&hash(x,7,61)>.7)?grass(x,y):dirt(x,y);
}
function cobble(x,y,dark=false){
  return sample(COBBLE,dark?[[19,23,28],[39,43,49],[62,66,73],[91,95,101]]:
    [[59,63,65],[92,98,99],[130,138,136],[166,171,166]],x,y);
}
function bark(x,y,type){
  if(type==='birch'||type==='pale'){
    const stripe=(y%5===2&&hash(x>>1,y>>1,72)>.48)||(y%7===5&&hash(x>>2,y,79)>.62);
    if(stripe)return rgba(type==='birch'?[55,53,51]:[83,88,82]);
    const p=type==='birch'?[[147,143,134],[181,177,164],[215,209,194],[234,229,213]]:
      [[108,110,105],[149,152,145],[181,185,177],[214,216,204]];
    return rgba(p[(hash(x>>1,y>>1,85)*4)|0]);
  }
  const p=type==='spruce'?[[49,32,23],[70,45,29],[103,71,44],[140,97,55]]:
    type==='jungle'?[[64,42,27],[93,60,34],[123,81,45],[157,109,69]]:
    type==='acacia'?[[75,71,65],[103,98,85],[133,127,108],[167,161,136]]:
    type==='cherry'?[[97,56,68],[139,78,96],[181,107,125],[213,145,154]]:
    type==='crimson'?[[50,22,33],[82,31,44],[119,42,55],[163,65,78]]:
    type==='warped'?[[20,43,49],[30,72,80],[38,102,108],[59,143,141]]:
    [[57,42,29],[84,58,37],[117,82,48],[154,111,67]];
  const stripe=[0,1,2,1,0,1,2,3,2,1,0,1,3,2,1,0][x];
  return rgba(p[Math.max(0,Math.min(3,stripe+(hash(x>>1,y>>2,113)>.79?1:0)))]);
}
function logEnd(x,y,type){
  const p=type==='birch'?[[125,112,87],[157,141,109],[194,179,137],[220,208,162],[236,222,177]]:
    type==='spruce'?[[54,37,26],[83,57,34],[115,79,45],[147,108,66],[180,142,92]]:
    type==='cherry'?[[116,78,82],[150,103,108],[186,130,132],[219,170,169],[244,209,200]]:
    type==='crimson'?[[67,22,35],[94,35,50],[135,45,65],[173,67,85],[209,104,111]]:
    type==='warped'?[[16,58,69],[31,85,93],[42,122,126],[69,158,159],[105,194,188]]:
    [[74,50,32],[105,72,44],[145,104,65],[183,143,89],[211,175,117]];
  const d=Math.max(Math.abs(x-7.5),Math.abs(y-7.5));
  const ring=(Math.floor(d*1.2)+(hash(x>>1,y>>1,42)>.75?1:0))%4;
  return rgba(p[d>6?0:d<1.7?1:ring+1]);
}
function planks(x,y,dark=false){
  const p=dark?[[51,39,29],[75,54,37],[102,74,48],[136,97,64],[161,119,81]]:
    [[84,57,36],[124,87,52],[157,113,70],[190,145,94],[216,175,120]];
  const row=y>>2,line=y%4===0,join=(x+row*5)%16===0;
  if(line)return rgba(p[0]);if(join&&y%4>0)return rgba(p[1]);
  return rgba(p[hash(x>>2,y>>1,119)>.81?4:hash(x,y>>1,106)>.45?3:2]);
}
function leaves(x,y,type){
  const p={
    oak:[[23,64,26],[36,89,33],[55,115,43],[76,140,50],[95,169,63]],
    spruce:[[16,47,37],[26,69,49],[40,95,62],[57,119,74],[79,145,87]],
    birch:[[37,79,33],[58,112,42],[84,145,55],[109,173,69],[133,195,85]],
    jungle:[[15,65,25],[30,93,31],[47,124,40],[64,152,48],[91,179,62]],
    acacia:[[49,70,27],[76,98,34],[107,128,44],[136,154,54],[161,179,66]],
    mangrove:[[25,62,43],[39,90,56],[57,116,69],[77,142,86],[106,167,103]],
    cherry:[[134,65,90],[178,98,125],[214,132,156],[242,167,187],[253,207,214]],
    pale:[[74,101,91],[105,135,120],[139,166,152],[176,195,181],[212,222,209]]
  }[type];
  const n=hash(x>>2,y>>2,type.length*72)*.7+hash(x>>1,y>>1,141)*.3;
  return rgba(p[n>.83?4:n>.6?3:n>.39?2:n>.16?1:0]);
}
const oreDefs={
  18:['coal',[24,28,32]],19:['iron',[190,137,95]],95:['copper',[199,120,72]],
  96:['gold',[248,206,70]],97:['redstone',[218,46,49]],98:['lapis',[43,75,194]],
  99:['diamond',[62,211,218]],100:['emerald',[39,191,99]],
  101:['coal',[24,28,32]],102:['iron',[190,137,95]],103:['copper',[199,120,72]],
  104:['gold',[248,206,70]],105:['redstone',[218,46,49]],106:['lapis',[43,75,194]],
  107:['diamond',[62,211,218]],108:['emerald',[39,191,99]],
  83:['quartz',[230,213,189]],84:['gold',[239,189,65]]
};
const oreCenters={
 coal:[[3,3,2,2],[11,4,2,1],[5,12,2,2],[13,11,1,2]],
 iron:[[4,3,2,1],[11,4,2,2],[5,11,2,1],[12,12,1,2]],
 copper:[[4,4,2,2],[11,3,1,2],[5,12,2,2],[12,12,1,1]],
 gold:[[4,4,2,2],[12,4,1,2],[6,11,2,2],[13,12,1,1]],
 redstone:[[4,4,2,1],[11,3,1,2],[5,10,2,2],[12,12,2,1]],
 lapis:[[4,5,2,2],[11,4,2,1],[6,12,2,2],[13,11,1,1]],
 diamond:[[4,3,2,2],[11,5,2,1],[5,11,2,2],[13,12,1,1]],
 emerald:[[4,4,1,2],[11,3,1,1],[6,11,1,2],[13,12,1,1]],
 quartz:[[4,4,2,2],[10,5,2,1],[6,12,2,1],[12,12,1,1]]
};
function ore(x,y,type,c,deep){
  for(const [i,arr] of oreCenters[type].entries()){
    const [cx,cy,rx,ry]=arr;
    const dx=Math.abs(x-cx)/rx,dy=Math.abs(y-cy)/ry;
    if(dx+dy<=1.15+hash(i,cy,69)*.45){
      return shade(c,dx>.75||dy>.8?-48:(x+2*y+i)%5===0?36:0);
    }
  }
  return stone(x,y,deep);
}
function masonry(x,y,c){
  const off=(Math.floor(y/4)%2)*4;
  const grout=y%4===0||(x+off)%8===0;
  return shade(c,grout?-36:hash(x>>2,y>>2,27)>.6?12:-7);
}
function metal(x,y,c){
  const edge=x===0||x===15||y===0||y===15;
  const shine=x===2||y===2||x===13||y===13;
  return shade(c,edge?-38:shine?14:hash(x>>2,y>>2,18)>.7?20:0);
}
function draw(id,face,x,y){
  x=x&15;y=y&15;const top=face===0,bottom=face===2;
  if(id===1)return top?grass(x,y):bottom?dirt(x,y):grassSide(x,y);
  if(id===2)return dirt(x,y);
  if(id===3)return stone(x,y);
  if(id===61)return cobble(x,y);
  if(id===58)return stone(x,y,true);
  if(id===28)return top?grass(x,y,true):dirt(x,y);
  if(id===29)return dirt(x,y,true);
  if(id===50||id===65)return sample(DIRT,[[58,25,28],[85,29,33],[114,40,43],[145,54,56],[165,67,60]],x,y);
  if(id===68)return cobble(x,y,true);
  if(id===69)return masonry(x,y,[62,59,67]);
  if(id===121)return sample(STONE,[[145,145,102],[170,174,125],[204,205,159],[226,220,175],[239,236,194]],x,y);
  const trunks={5:'oak',15:'oak',30:'spruce',32:'birch',34:'acacia',36:'jungle',38:'jungle',40:'cherry',42:'pale',78:'crimson',80:'warped'};
  if(Object.hasOwn(trunks,id))return top||bottom?logEnd(x,y,trunks[id]):bark(x,y,trunks[id]);
  if(id===11||id===52)return planks(x,y,id===52);
  const foliage={6:'oak',12:'oak',13:'oak',14:'oak',31:'spruce',33:'birch',35:'acacia',37:'jungle',39:'mangrove',41:'cherry',43:'pale'};
  if(Object.hasOwn(foliage,id))return leaves(x,y,foliage[id]);
  if(Object.hasOwn(oreDefs,id)){const [kind,c]=oreDefs[id];return ore(x,y,kind,c,id>=101&&id<=108)}
  const bricks={53:[135,137,134],130:[203,197,154],131:[174,124,167],72:[94,38,43],74:[109,46,50]};
  if(Object.hasOwn(bricks,id))return masonry(x,y,bricks[id]);
  if(id===7)return rgba((y+(x>>2))%7===0?[80,147,197]:hash(x>>2,y>>1,78)>.55?[49,109,175]:[36,90,159]);
  if(id===66)return rgba((x+2*y)%11<4?[255,188,51]:hash(x>>1,y>>2,91)>.5?[250,124,26]:[216,72,17]);
  if(id===85)return shade([112,86,66],(x+Math.floor(y/2)*2)%7<3?16:-19);
  if(id>=110&&id<=117||id===135){
    const colors={110:[46,78,191],111:[44,170,99],112:[72,199,205],113:[179,109,65],114:[218,177,51],115:[192,196,192],116:[42,43,47],117:[176,44,49],135:[57,52,61]};
    return metal(x,y,colors[id]);
  }
  if(id===168){
    if(top){
      if(x<2||x>13||y<2||y>13)return rgba([91,62,40]);
      if(x===7||x===8||y===7||y===8)return rgba([99,67,45]);
      return shade([173,125,77],x<8?-10:y<8?7:0);
    }
    if(x<2||x>13||y<2||y>13)return rgba([93,61,40]);
    if(x>3&&x<13&&y>4&&y<12)return rgba((x+y)%6<2?[77,82,82]:[124,130,123]);
    return planks(x,y);
  }

  // Familiar, block-specific detailing for terrain, Nether, End and utility blocks.
  if(id===4||id===26||id===92){
    const palettes={
      4:[[173,161,127],[198,186,148],[222,210,164],[238,226,184],[249,240,201]],
      26:[[135,68,44],[165,82,51],[197,108,68],[224,132,84],[245,163,111]],
      92:[[76,74,68],[97,92,83],[120,116,107],[144,138,128],[164,153,144]]
    };
    const dots=hash(x>>1,y>>1,id+91);
    return rgba(palettes[id][dots>.9?4:dots>.68?3:dots>.32?2:dots>.1?1:0]);
  }
  if(id===21||id===22||id===23){
    if(id===21)return shade([239,242,241],hash(x>>2,y>>2,21)>.7?9:-5);
    const pale=id===22;
    const p=pale?[146,207,228]:[104,150,186];
    return shade(p,x===0||x===15||y===0||y===15?23:hash(x>>2,y>>2,id)>.75?17:-7);
  }
  if(id===24||id===54){
    const border=y===0||y===15||y===7;
    const detail=id===54&&x>=4&&x<=11&&y>=4&&y<=11&&(x===4||x===11||y===4||y===11);
    return shade([220,205,160],detail?-54:border?-22:hash(x>>2,y>>2,24)>.65?13:0);
  }
  if(id===25||id===27||id===47||id===57){
    const c={25:[162,117,97],27:[155,79,54],47:[77,66,58],57:[146,149,139]}[id];
    return shade(c,hash(x>>2,y>>2,id)>.67?16:hash(x>>1,y>>1,id+6)>.6?-11:0);
  }
  if(id===44||id===45){
    if(top){
      const edge=x<3||x>12||y<3||y>12;
      return rgba(edge?[44,110,46]:[109,158,69]);
    }
    const rib=x%4===1,joint=id===45&&y%6===0;
    const thorn=id===44&&y%7===3&&x%4===3;
    return rgba(thorn?[185,195,102]:joint?[85,134,52]:rib?[40,105,45]:[92,157,67]);
  }
  if(id===46)return rgba(hash(x>>2,y>>2,46)>.57?[62,110,48]:[86,143,61]);
  if(id===63)return rgba(hash(x>>2,y>>2,63)>.51?[151,122,94]:[104,81,65]);
  if(id===64){
    const glint=(x+y)%11===0&&hash(x,y,64)>.48;
    return rgba(glint?[41,140,167]:hash(x>>2,y>>2,64)>.5?[29,58,74]:[19,36,47]);
  }
  if(id===67){
    if(top)return cobble(x,y,true);
    const stripe=x%4===0,spot=hash(x>>2,y>>2,67)>.62;
    return shade([83,81,84],stripe?-25:spot?17:0);
  }
  if(id===70||id===71){
    const eye=id===70&&((x>3&&x<6&&y>6&&y<10)||(x>10&&x<13&&y>6&&y<10));
    const low=id===70&&x>6&&x<10&&y>10&&y<13;
    return rgba(eye||low?[60,51,46]:hash(x>>2,y>>2,id)>.5?[112,96,82]:[84,75,67]);
  }
  if(id===75||id===76){
    if(top){
      const p=id===75?[[75,25,36],[116,39,55],[142,49,65],[169,64,79]]:
        [[18,75,77],[32,116,116],[49,153,145],[80,175,165]];
      return rgba(p[Math.floor(hash(x>>1,y>>1,id)*4)]);
    }
    return id===75?shade([116,41,48],hash(x>>1,y>>1,75)>.55?14:-15):
      shade([41,96,101],hash(x>>1,y>>1,76)>.55?14:-13);
  }
  if(id===79||id===81){
    const p=id===79?[[74,22,38],[120,31,48],[153,48,65],[181,63,78]]:
      [[15,56,68],[29,87,95],[43,124,133],[63,148,149]];
    return rgba(p[Math.floor(hash(x>>1,y>>1,id)*4)]);
  }
  if(id===86){
    if(top){
      const d=Math.max(Math.abs(x-7.5),Math.abs(y-7.5));
      return shade([210,199,174],Math.floor(d)%2===0?-24:12);
    }
    return shade([210,198,173],x%4===0?-29:hash(x>>2,y>>2,86)>.65?12:0);
  }
  if(id===87||id===126||id===127){
    const purple=id===87;
    const star=hash(x,y,id)>.966;
    return rgba(star?[220,204,239]:purple?
      hash(x>>1,y>>2,id)>.55?[134,73,185]:[66,37,109]:
      hash(x>>1,y>>1,id)>.6?[48,67,119]:[14,23,47]);
  }
  if(id===88){
    const molten=(x+Math.floor(y/3)*2)%6<2||y%7===0;
    return rgba(molten?[241,124,30]:hash(x>>1,y>>1,88)>.5?[86,48,34]:[55,34,31]);
  }
  if(id===89||id===93||id===94){
    const p=id===89?[43,189,208]:id===93?[51,174,159]:[195,52,81];
    const stem=x%4===1||(x+y)%9===0;
    return rgba(stem?p:shade(p,-92));
  }
  if(id===90||id===10||id===109){
    const gold=id===90?[235,162,94]:id===10?[229,196,123]:[220,165,70];
    return shade(gold,hash(x>>2,y>>2,id)>.6?31:-23);
  }
  if(id===91){
    const gold=hash(x>>1,y>>1,91)>.85||(x+y)%13===0;
    return rgba(gold?[218,164,58]:[58,50,52]);
  }
  if(id===9){
    const border=x===0||x===15||y===0||y===15;
    const streak=(x===4&&y>=3&&y<=11)||(y===4&&x>=4&&x<=11);
    return rgba(border?[159,198,214]:streak?[229,247,251]:[190,218,225]);
  }
  if(id===51)return shade([39,27,51],hash(x>>2,y>>2,51)>.7?25:hash(x>>1,y>>1,52)>.5?6:-6);
  if(id===119||id===120){
    const rim=x<2||y<2||x>13||y>13||y===8;
    const lock=x>=7&&x<=9&&y>=6&&y<=10;
    return shade(rim?[86,57,34]:lock?[219,174,64]:[162,111,61],id===120?-30:0);
  }
  if(id===122||id===123||id===124||id===128||id===129){
    const p={122:[130,83,146],123:[195,139,184],124:[189,146,207],128:[231,213,169],129:[51,42,61]}[id];
    const core=(x>=5&&x<=10&&y>=5&&y<=10);
    return shade(p,core?24:hash(x>>2,y>>2,id)>.6?13:-19);
  }
  if(id===125){
    const border=x<3||x>12||y<3||y>12;
    const eye=top&&x>=5&&x<=10&&y>=5&&y<=10;
    return rgba(eye?[49,133,116]:border?[51,64,54]:[101,135,117]);
  }
  if(id===137||id===138){
    const wet=id===138,groove=x%4<2;
    return shade(wet?[79,55,37]:[105,72,44],groove?-26:10);
  }
  if(id===155||id>=156&&id<=167){
    const wood=[155,158,160,161,163,165].includes(id);
    const frame=x<2||x>13||y<2||y>13;
    const panel=x>3&&x<12&&y>4&&y<12;
    const mark=(x+y+id)%6<2;
    return rgba(frame?wood?[91,62,40]:[72,75,74]:
      panel?mark?wood?[95,88,71]:[68,81,91]:wood?[156,110,68]:[121,128,127]:
      wood?[132,95,55]:[112,111,107]);
  }
  if(id===8){
    const row=y>>2,off=row%2?4:0;
    const mortar=y%4===0||(x+off)%8===0;
    return shade([173,78,63],mortar?-45:hash(x>>2,y>>2,8)>.65?19:0);
  }

  // Crop stages, flowers, mushrooms and specialized workshop faces.
  if(id>=139&&id<=154){
    const crop=Math.floor((id-139)/4),stage=(id-139)%4;
    const planted=(x%5===2||x%5===3||x%7===1);
    const growing=y>=(13-stage*4)&&planted;
    const tip=stage>=2&&y<=5&&planted;
    const soil=[78,57,39],green=[61,135,44];
    const head=crop===0?[215,179,83]:crop===1?[217,116,43]:crop===2?[159,144,83]:[164,58,94];
    if(growing)return rgba(tip||stage===3&&y>8?head:shade(green,hash(x,y,id)>.5?18:-20).slice(0,3));
    return shade(soil,hash(x>>2,y>>2,id)>.65?12:-10);
  }
  if(id===16||id===77||id===82){
    const p=id===16?[157,49,64]:id===77?[170,49,71]:[34,146,151];
    const stem=(x%5===2||x%7===1)&&y>4;
    return rgba(stem?shade(p,hash(x,y,id)>.65?25:-11).slice(0,3):[46,48,36]);
  }
  if(id===17||id===48||id===49){
    const red=id===48,cap=id===49?[118,86,62]:red?[175,44,43]:[145,90,63];
    const spot=red&&hash(x>>1,y>>1,48)>.77,edge=y===0||y===15;
    return rgba(spot?[241,234,208]:edge?shade(cap,-36).slice(0,3):shade(cap,hash(x>>2,y>>2,id)>.55?11:-10).slice(0,3));
  }
  if(id===20){
    const mouth=!top&&x>=4&&x<=11&&y>=5&&y<=12,glow=mouth&&y>=9&&y<=11;
    const border=x===0||x===15||y===0||y===15;
    return rgba(mouth?(glow?[194,103,43]:[39,40,40]):border?[80,85,86]:
      hash(x>>2,y>>2,20)>.5?[143,147,148]:[111,118,121]);
  }
  if(id===55){
    const p=hash(x>>2,y>>2,55);
    return rgba(p>.76?[104,180,169]:p>.42?[78,155,153]:p>.18?[64,122,126]:[47,94,111]);
  }
  if(id===56){
    const pat=hash(x>>2,y>>2,56),oxidized=pat>.85;
    return rgba(oxidized?[79,153,132]:pat>.54?[217,145,93]:[179,102,69]);
  }
  if(id===59){
    const rim=x<=3||x>=12||y<=2||y>=13;
    const wick=x>=6&&x<=9&&y>=4&&y<=11;
    return rgba(rim?[63,53,44]:wick?[242,198,81]:[112,81,52]);
  }
  if(id===60){
    const belt=top?x===6||x===9:y===6||y===11;
    const grain=top?y%3===0:x%3===0;
    return rgba(belt?[115,98,64]:grain?[174,143,67]:[217,188,96]);
  }
  if(id===62){
    const lichen=(x+y)%7===0||hash(x>>1,y>>1,62)>.75;
    return rgba(lichen?[88,161,126]:[45,90,74]);
  }
  if(id===73){
    const nodule=hash(x>>1,y>>1,73)>.65;
    return rgba(nodule?[172,39,65]:hash(x>>2,y>>2,73)>.48?[110,24,41]:[65,24,31]);
  }
  if(id===118){
    const plank=x%5===0||y%5===0;
    const latch=x>=6&&x<=9&&y>=6&&y<=10;
    return rgba(latch?[197,150,61]:plank?[89,62,40]:[163,114,67]);
  }
  if(id===132){
    return rgba(x%4===0?[117,80,115]:hash(x>>2,y>>2,132)>.56?[187,141,182]:[159,106,156]);
  }
  if(id===133){
    const shell=x<3||y<3||x>12||y>12;
    const fold=x===8||y===8;
    return rgba(shell?[101,58,105]:fold?[138,77,145]:[181,119,180]);
  }
  if(id===134){
    const eye=face!==0&&((x>=3&&x<=5&&y>=5&&y<=7)||(x>=10&&x<=12&&y>=5&&y<=7));
    const mouth=face!==0&&x>=5&&x<=11&&y>=11&&y<=13;
    return rgba(eye?[185,93,202]:mouth?[25,22,30]:hash(x>>2,y>>2,134)>.57?[71,54,83]:[46,39,63]);
  }
  if(id===136){
    if(top){
      const edge=x<2||y<2||x>13||y>13,metal=x>4&&x<11&&y>3&&y<12;
      return rgba(edge?[83,55,44]:metal?[122,145,153]:[119,82,57]);
    }
    return rgba(x<3||x>12||y<3||y>12?[74,54,42]:[106,97,80]);
  }
  return prior(id,face,x,y);
}
atlas.paint=draw;
atlas.version='4.3-original-classic-pixels';
atlas.originalArt=true;
})();


/*
 * MineWorld 4.4 — original, finer classic-style 16px pixel art.
 * Deliberately drawn geometry and restricted color ramps, not third-party
 * textures or a pixel-for-pixel copy of Minecraft art.
 */
(()=>{
'use strict';
const atlas=window.MineWorldPixelMaterials;
const previous=atlas.paint;
const clamp=v=>Math.min(255,Math.max(0,Math.round(v)));
const rgba=a=>[a[0],a[1],a[2],255];
function h(x,y,z=0){
  let n=Math.imul((x|0)+371,374761393)^Math.imul((y|0)+733,668265263)^Math.imul((z|0)+881,1274126177);
  n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967295;
}
const lighter=(c,n)=>[clamp(c[0]+n),clamp(c[1]+n),clamp(c[2]+n)];
function pick(p,x,y,seed=0){
  const r=h(x>>2,y>>2,seed)*.48+h(x>>1,y>>1,seed+137)*.38+h(x,y,seed+539)*.14;
  const idx=Math.min(p.length-1,Math.floor(r*p.length));
  return rgba(p[idx]);
}
const DIRT_PALETTE=[[72,48,32],[96,66,43],[120,84,53],[143,102,65],[165,124,80]];
const GRASS_PALETTE=[[37,89,28],[52,115,36],[70,139,45],[94,163,55],[116,185,65]];
const ROCK_PALETTE=[[70,73,72],[94,96,95],[121,124,123],[146,149,146],[171,173,171]];
const DARK_ROCK=[[31,36,42],[50,55,63],[70,76,85],[92,99,105],[118,124,131]];
function dirt(x,y,coarse=false){
  const p=h(x>>1,y>>1,31)*.44+h(x>>2,y>>2,59)*.4+h(x,y,104)*.16;
  const r=Math.min(4,Math.floor(p*5));
  if(coarse&&h(x>>1,y>>1,101)>.74)return rgba([[93,89,79],[113,111,102],[138,133,120]][(h(x,y,77)*3)|0]);
  if(h(x,y,201)>.978)return rgba([182,133,82]);
  return rgba(DIRT_PALETTE[r]);
}
function grass(x,y,muted=false){
  const p=h(x>>2,y>>2,20)*.42+h(x>>1,y>>1,27)*.43+h(x,y,39)*.15;
  const c=GRASS_PALETTE[Math.min(4,Math.floor(p*5))];
  if(h(x,y,78)>.979)return rgba(muted?[166,175,74]:[132,193,79]);
  return rgba(muted?[clamp(c[0]+31),clamp(c[1]-18),clamp(c[2]+3)]:c);
}
function grassSide(x,y){
  // Ragged top dirt/grass silhouette, with scattered thin downward blades.
  const heights=[4,5,3,4,6,4,3,5,6,4,5,3,4,6,5,4];
  const fringe=heights[x];
  const dangling=(y===fringe+1&&(x%5===2||x===8||x===13));
  if(y<fringe||dangling)return grass(x,y);
  if(y===fringe)return rgba(h(x,0,7)>.55?[66,135,37]:[99,154,49]);
  return dirt(x,y);
}
function stone(x,y,dark=false){
  const palette=dark?DARK_ROCK:ROCK_PALETTE;
  let patch=h(x>>2,y>>2,dark?227:61),speck=h(x>>1,y>>1,dark?228:62);
  let i=patch>.7?1:patch<.29?3:2;
  if(speck>.86)i=Math.max(0,i-1);else if(speck<.13)i=Math.min(4,i+1);
  const crack=(h((x+2)>>2,(y+1)>>2,dark?801:802)>.79&&((x+1)%4===0||y%4===1));
  if(crack)i=0;
  if(h(x,y,801+Number(dark))>.971)i=4;
  return rgba(palette[i]);
}
const ROCKS=[
 [2.4,2.3,1.4],[8.4,1.5,1.1],[13.2,3.0,1.3],[4.9,7.1,1.5],
 [11.3,8.1,1.5],[2.0,13.1,1.1],[8.0,13.8,1.25],[14.9,13.2,1.2]
];
function cobble(x,y,black=false){
  // Jagged large stones outlined by narrow grout. Curves are tileable at edges.
  let a=Infinity,b=Infinity,k=0;
  for(let i=0;i<ROCKS.length;i++){
    const s=ROCKS[i];
    const dx=Math.min(Math.abs(x-s[0]),16-Math.abs(x-s[0]));
    const dy=Math.min(Math.abs(y-s[1]),16-Math.abs(y-s[1]));
    const dist=(dx*dx+dy*dy)/s[2]+(h(x>>1,y>>1,i+404)-.5)*.63;
    if(dist<a){b=a;a=dist;k=i;}else if(dist<b)b=dist;
  }
  const p=black?[[22,24,29],[37,40,46],[55,60,68],[77,81,90],[99,104,113]]:
    [[57,59,57],[74,78,78],[103,109,108],[131,136,132],[160,166,161]];
  if(b-a<2.2)return rgba(p[0]);
  const light=(h(x>>1,y>>1,k+215)>.68)+(h(x,y,k+223)>.77);
  const i=b-a<3.4?1:Math.min(4,2+light);
  return rgba(p[i]);
}
const WOOD={
  oak:[[54,36,25],[84,53,31],[117,77,43],[150,105,58],[185,141,84]],
  spruce:[[39,28,24],[62,43,31],[89,59,41],[120,85,54],[154,119,75]],
  birch:[[61,58,51],[132,129,114],[182,175,153],[218,210,184],[238,230,207]],
  jungle:[[56,37,25],[87,56,34],[120,79,44],[161,111,65],[185,137,85]],
  acacia:[[58,56,49],[84,79,68],[118,111,91],[152,142,120],[183,174,151]],
  cherry:[[89,44,58],[117,64,78],[152,87,101],[191,118,129],[226,165,164]],
  pale:[[71,71,67],[99,102,97],[142,146,137],[178,183,170],[214,216,201]],
  crimson:[[48,18,31],[75,25,40],[110,37,53],[148,53,72],[187,79,94]],
  warped:[[18,35,42],[25,57,67],[32,88,98],[43,120,122],[65,154,152]]
};
function logSide(x,y,type){
  const pal=WOOD[type]||WOOD.oak;
  if(type==='birch'||type==='pale'){
    const scar=(y===2||y===6||y===11)&&h(x>>1,y,type.length)>.29&&
      (x>1&&x<14&&(x%5!==0));
    const vertical=(x===4||x===11)&&h(x>>2,y>>2,139)>.68;
    if(scar)return rgba(pal[0]);
    if(vertical)return rgba(pal[1]);
    return rgba(pal[h(x>>1,y>>1,93)>.58?4:3]);
  }
  const fibers=[1,1,0,2,3,1,0,1,2,3,2,1,0,2,1,0];
  let i=fibers[x];
  if(h(x>>1,y>>2,type.length+803)>.83)i=Math.min(4,i+1);
  if((x===4||x===11)&&(y%5<3))i=0;
  if((x===7||x===13)&&h(x,y>>1,111)>.73)i=4;
  return rgba(pal[i]);
}
function logEnd(x,y,type){
  const pal=WOOD[type]||WOOD.oak;
  const dx=Math.abs(x-7.5),dy=Math.abs(y-7.5);
  const radius=Math.max(dx,dy)+(h(x>>1,y>>1,40)-.5)*.65;
  if(radius>6.65)return rgba(pal[0]);
  if(radius<1.3)return rgba(pal[1]);
  const r=Math.floor(radius*1.27)%3;
  return rgba(pal[[3,2,4][r]]);
}
function planks(x,y,material='oak'){
  const base=WOOD[material]||WOOD.oak;
  const row=Math.floor(y/4);
  if(y%4===0)return rgba(base[0]);
  const offset=[2,9,5,12][row],join=(x+offset)%15===0;
  if(join)return rgba(base[1]);
  const grain=h(x>>1,row,44)+h(x>>2,y>>1,49);
  if((x+y*2)%13===0)return rgba(base[1]);
  if(grain>1.45)return rgba(base[4]);
  return rgba(base[grain>.92?3:2]);
}
const LEAFPALETTE={
 oak:[[22,56,18],[35,84,26],[52,110,35],[76,143,44],[105,170,57]],
 spruce:[[13,42,28],[24,65,44],[34,88,55],[51,116,72],[75,144,88]],
 birch:[[41,73,25],[59,99,34],[81,125,44],[108,155,55],[134,181,72]],
 jungle:[[14,57,21],[27,82,27],[37,113,34],[52,142,43],[74,166,50]],
 acacia:[[53,65,25],[70,90,33],[92,117,39],[123,146,49],[154,176,61]],
 mangrove:[[20,58,34],[33,80,46],[44,110,58],[65,139,77],[90,167,95]],
 cherry:[[129,60,87],[168,86,113],[201,116,143],[230,150,174],[250,199,208]],
 pale:[[74,95,84],[102,125,108],[131,154,137],[165,186,165],[202,220,202]]
};
function leaves(x,y,name){
  const p=LEAFPALETTE[name]||LEAFPALETTE.oak;
  const shape=h(x>>2,y>>2,name.length*72);
  const cell=h(x>>1,y>>1,name.length*51+2);
  let i=shape>.7?3:shape<.27?1:2;
  if(cell>.8)i=Math.min(4,i+1);
  else if(cell<.15)i=Math.max(0,i-1);
  if(h(x,y,name.length*75)>.96)i=0;
  return rgba(p[i]);
}
const ORES={
  18:[['coal'],[24,26,29],[60,62,67]],
  19:[['iron'],[172,116,80],[231,175,126]],
  95:[['copper'],[193,111,68],[74,147,126]],
  96:[['gold'],[233,180,55],[255,223,113]],
  97:[['redstone'],[176,29,35],[246,60,50]],
  98:[['lapis'],[31,64,162],[66,114,224]],
  99:[['diamond'],[39,174,184],[93,232,225]],
  100:[['emerald'],[33,159,80],[89,218,121]],
  83:[['quartz'],[202,185,162],[251,237,216]],
  84:[['gold'],[227,166,53],[255,220,111]]
};
for(let i=101;i<=108;i++)ORES[i]=ORES[[18,19,95,96,97,98,99,100][i-101]];
const ORE_SPOTS=[
 [3,4,2,2],[11,3,2,1],[7,8,1,2],[12,11,2,2],[4,13,2,1]
];
function ore(x,y,id,deep=false,nether=false){
  const [name,lo,hi]=ORES[id],kind=name[0];
  const oreField=nether?rgba([118,47,46]):stone(x,y,deep);
  let best=Infinity,chosen=0;
  for(let i=0;i<ORE_SPOTS.length;i++){
    const [sx,sy,rx,ry]=ORE_SPOTS[i],dx=Math.abs(x-sx),dy=Math.abs(y-sy);
    const shape=(dx/rx)+(dy/ry)+h(x,y,id+i)*.55;
    if(shape<best){best=shape;chosen=i;}
  }
  const threshold=kind==='emerald'?.87:kind==='diamond'?1.15:kind==='redstone'?1.26:1.13;
  if(best>threshold)return oreField;
  if(best>.91)return rgba(lighter(lo,-39));
  if(h(x>>1,y>>1,id+chosen*11)>.55||best<.41)return rgba(hi);
  if(kind==='copper'&&h(x,y,613)>.67)return rgba(hi);
  return rgba(lo);
}
function flatGrain(x,y,pal,seed){
  const n=h(x>>1,y>>1,seed)*.62+h(x,y,seed+19)*.38;
  return rgba(pal[Math.min(pal.length-1,Math.floor(n*pal.length))]);
}
function craftingBench(x,y,face){
  if(face===0){
    // Four-tile cutting-board top with dark seams, corner squares and tool marks.
    const rim=x<2||x>13||y<2||y>13;
    const cross=x===7||x===8||y===7||y===8;
    if(rim)return rgba([94,60,35]);
    if(cross)return rgba([91,60,38]);
    const tool1=y===5&&x>=3&&x<=6||x===4&&y>=3&&y<=5;
    const tool2=y===10&&x>=10&&x<=12||x===12&&y>=10&&y<=12;
    if(tool1||tool2)return rgba([82,79,73]);
    return planks(x,y);
  }
  const frame=x<2||x>13||y<2||y>13;
  const shadow=x===3||x===12||y===3||y===12;
  const tool=(x===8&&y>=5&&y<=10)||(y===6&&x>=6&&x<=10)||(x===6&&y>=6&&y<=8);
  if(frame)return rgba([73,47,29]);
  if(shadow)return rgba([118,80,51]);
  if(tool)return rgba([87,94,95]);
  if(x>3&&x<12&&y>4&&y<12)return rgba([158,125,85]);
  return planks(x,y);
}
function furnace(x,y,face){
  if(face===0)return cobble(x,y);
  const edge=x<2||x>13||y<2||y>13;
  const mouth=x>=4&&x<=11&&y>=6&&y<=12;
  const dark=x>=5&&x<=10&&y>=7&&y<=11;
  if(dark)return rgba([28,27,28]);
  if(mouth)return rgba([58,58,58]);
  if(edge)return rgba([86,89,88]);
  return stone(x,y);
}
function diamondBlock(x,y,type){
  const colors={
    110:[[22,48,123],[38,74,181],[66,101,218],[38,68,154]],
    111:[[18,95,58],[37,157,97],[65,210,136],[25,124,69]],
    112:[[24,109,119],[61,184,199],[113,226,221],[43,140,164]],
    113:[[93,60,45],[166,102,70],[208,137,88],[125,74,50]],
    114:[[139,107,25],[226,169,53],[255,214,97],[181,132,37]],
    115:[[109,110,105],[179,184,180],[225,230,219],[144,150,151]],
    116:[[17,19,20],[39,43,48],[63,69,73],[28,31,34]],
    117:[[105,15,25],[173,37,47],[227,58,67],[130,23,31]]
  };
  const p=colors[type];
  const rim=(x===0||y===0||x===15||y===15);
  const glimmer=x===2||y===2;
  const cell=(Math.floor(x/4)+Math.floor(y/4))%2;
  return rgba(p[rim?0:glimmer?2:cell?1:3]);
}
function newArt(id,face,x,y){
  x&=15;y&=15;const top=face===0,bottom=face===2;
  if(id===1)return top?grass(x,y):bottom?dirt(x,y):grassSide(x,y);
  if(id===2)return dirt(x,y);
  if(id===28)return top?grass(x,y,true):dirt(x,y);
  if(id===29)return dirt(x,y,true);
  if(id===3)return stone(x,y);
  if(id===58)return stone(x,y,true);
  if(id===61)return cobble(x,y);
  if(id===68)return cobble(x,y,true);
  const trunks={5:'oak',15:'oak',30:'spruce',32:'birch',34:'acacia',36:'jungle',38:'jungle',40:'cherry',42:'pale',78:'crimson',80:'warped'};
  if(Object.hasOwn(trunks,id))return top||bottom?logEnd(x,y,trunks[id]):logSide(x,y,trunks[id]);
  if(id===11||id===52)return planks(x,y,id===52?'spruce':'oak');
  const foliage={6:'oak',12:'oak',13:'acacia',14:'birch',31:'spruce',33:'birch',35:'acacia',37:'jungle',39:'mangrove',41:'cherry',43:'pale'};
  if(Object.hasOwn(foliage,id))return leaves(x,y,foliage[id]);
  if(Object.hasOwn(ORES,id))return ore(x,y,id,id>=101&&id<=108,id===83||id===84);
  if(id===168)return craftingBench(x,y,face);
  if(id===20||id===156||id===157)return furnace(x,y,face);
  if(id>=110&&id<=117)return diamondBlock(x,y,id);
  if(id===4||id===26)return flatGrain(x,y,id===26?
    [[144,65,43],[178,88,53],[202,111,66],[220,134,85],[240,161,109]]:
    [[177,162,127],[200,186,147],[219,207,167],[235,222,185],[248,238,204]],id+200);
  if(id===92)return flatGrain(x,y,[[82,79,73],[102,99,94],[118,115,106],[140,139,130],[163,162,149]],id);
  if(id===9){
    const border=x===0||x===15||y===0||y===15;
    const reflection=(x===3&&y>=4&&y<=11)||(y===4&&x>=3&&x<=11);
    return rgba(border?[126,165,181]:reflection?[234,248,248]:[186,218,228]);
  }
  if(id===50||id===65){
    return flatGrain(x,y,[[68,26,29],[90,31,34],[111,38,41],[129,49,52],[150,57,59]],id);
  }
  if(id===51){
    const crack=h(x>>2,y>>2,51)>.7&&((x+y)%6===0||x%5===2);
    return rgba(crack?[93,43,107]:h(x>>1,y>>1,21)>.67?[51,29,66]:[31,24,42]);
  }
  if(id===70||id===71){
    const eye=id===70&&((x>=3&&x<=5&&y>=6&&y<=9)||(x>=10&&x<=12&&y>=6&&y<=9));
    return rgba(eye?[64,57,51]:h(x>>2,y>>2,id)>.57?[113,100,85]:[83,75,65]);
  }
  if(id===121){
    const pit=h(x>>2,y>>2,121)>.73&&(x%4===1||y%4===2);
    return rgba(pit?[166,165,121]:h(x>>2,y>>2,311)>.59?[223,216,170]:[203,202,159]);
  }
  if(id===7){
    const ripple=(y+(x>>2))%8===0;
    return rgba(ripple?[87,150,204]:h(x>>2,y>>1,7)>.55?[48,105,181]:[31,88,158]);
  }
  if(id===66){
    const seam=(x+2*y)%13<3;
    return rgba(seam?[254,205,62]:h(x>>1,y>>1,66)>.5?[245,128,31]:[206,64,13]);
  }
  if(id===53||id===130||id===131||id===72||id===74||id===69){
    const p={53:[139,144,141],130:[206,203,157],131:[174,112,163],72:[104,42,49],74:[102,37,45],69:[65,62,66]}[id];
    const offset=(Math.floor(y/4)%2)*4;
    const grout=y%4===0||(x+offset)%8===0;
    return rgba(lighter(p,grout?-37:h(x>>2,y>>2,id)>.64?13:-6));
  }
  return null;
}
atlas.paint=(id,face,x,y)=>newArt(id,face,x,y)||previous(id,face,x,y);
atlas.version='4.4-classic-block-details';
atlas.originalArt=true;
})();


/* MineWorld 4.5 — classic-inspired hand-drawn silhouettes, independently authored.
   Refines surface identity and face-specific details without third-party game assets. */
(()=>{
'use strict';
const atlas=window.MineWorldPixelMaterials,prior=atlas.paint;
const rgb=c=>[c[0],c[1],c[2],255];
const clamp=x=>Math.max(0,Math.min(255,Math.round(x)));
const shade=(c,n)=>rgb(c.map(v=>clamp(v+n)));
function h(x,y,s=0){let z=Math.imul(x+177,374761393)^Math.imul(y+83,668265263)^Math.imul(s+911,1274126177);z=Math.imul(z^(z>>>13),1274126177);return((z^(z>>>16))>>>0)/4294967295}
function pix(p,x,y,seed=0){
  const v=h(x>>2,y>>2,seed)*.44+h(x>>1,y>>1,seed+31)*.4+h(x,y,seed+83)*.16;
  return rgb(p[Math.min(p.length-1,Math.floor(v*p.length))]);
}
const DIRT=[[75,49,32],[97,64,40],[117,78,49],[137,96,61],[157,113,72],[177,132,85]];
const GRASS=[[39,89,28],[52,110,35],[67,131,43],[82,150,48],[103,169,57],[122,185,70]];
function earth(x,y){const r=pix(DIRT,x,y,2);if(h(x,y,8)>.974)return rgb([68,47,31]);if(h(x,y,9)>.977)return rgb([183,141,95]);return r}
function turf(x,y){
  const n=h(x>>2,y>>2,19),fine=h(x>>1,y>>1,21);
  const i=n>.76?1:n<.17?4:fine>.7?2:3;
  if(h(x,y,81)>.963)return rgb(GRASS[i===1?0:5]);
  return rgb(GRASS[i]);
}
function turfSide(x,y){
  const edge=[3,4,3,5,4,3,6,4,3,5,4,3,5,4,3,4][x];
  if(y<edge)return turf(x,y);
  if(y===edge&&(x%3!==0))return rgb([67,125,40]);
  if(y===edge+1&&(x===2||x===6||x===10||x===14))return rgb([69,125,41]);
  if(y===edge+2&&(x===6||x===14))return rgb([77,127,42]);
  return earth(x,y);
}
function rock(x,y,deep=false){
  const p=deep?[[39,42,48],[53,56,62],[69,72,79],[84,88,93],[103,106,111]]:
    [[81,82,82],[102,104,102],[121,123,122],[143,145,143],[161,162,159]];
  const a=h(x>>2,y>>2,30+(deep?15:0)),b=h(x>>1,y>>1,31+(deep?15:0));
  let i=a>.75?1:a<.21?3:2;
  if(b>.87)i=Math.max(0,i-1);
  if(b<.12)i=Math.min(4,i+1);
  if((x===3||x===9||y===5||y===13)&&h((x+1)>>2,(y+2)>>2,48+(deep?15:0))>.75)i=0;
  return rgb(p[i]);
}
function gravel(x,y){
  const v=h(x>>1,y>>1,54),fine=h(x,y,55);
  const pal=[[65,64,63],[91,89,86],[114,111,108],[142,140,135],[172,170,164],[195,193,187]];
  const i=v>.85?5:v>.64?4:v>.38?2:v>.17?3:1;
  return rgb(pal[fine>.94?0:i]);
}
function snow(x,y){
  const pal=[[181,193,201],[202,214,220],[222,231,234],[236,244,244],[250,253,250]];
  return pix(pal,x,y,72);
}
function ice(x,y,packed=false){
  const rim=(x===1||x===14||y===1||y===14),diagonal=((x+y)%11===0||((x-y+16)%13===0));
  if(rim)return rgb(packed?[108,152,190]:[123,179,206]);
  if(diagonal&&h(x>>2,y>>2,33)>.31)return rgb([221,246,248]);
  return pix(packed?[[98,157,189],[130,181,207],[160,202,220],[189,223,236]]:
    [[110,172,200],[149,200,220],[185,224,236],[213,241,245]],x,y,packed?36:37);
}
function water(x,y){
  const wave=((y+(x>>2))%7===0)||((y+(x>>1)+2)%9===0);
  if(wave&&h(x>>2,y>>2,7)>.28)return rgb([86,157,214]);
  return pix([[29,75,151],[37,91,170],[47,112,187],[60,128,196]],x,y,9);
}
function lava(x,y){
  const line=(y+(x>>2)*2)%9,bright=line===0||line===1;
  if(bright)return rgb([255,205,74]);
  if((x+2*y)%11<3)return rgb([248,152,37]);
  return pix([[164,47,15],[207,66,15],[235,95,22],[247,128,27]],x,y,66);
}
function obsidian(x,y){
  const line=((x+2*y)%11===0)&&h(x>>2,y>>2,51)>.4;
  const fleck=h(x>>1,y>>1,51);
  return rgb(line?[91,49,113]:fleck>.82?[58,40,80]:fleck<.19?[17,16,25]:[31,24,43]);
}
function moss(x,y){
  const p=[[35,78,33],[49,97,37],[63,114,43],[77,131,52],[102,146,65]];
  if(h(x,y,46)>.96)return rgb([24,64,28]);
  return pix(p,x,y,44);
}
function mud(x,y){
  const p=[[38,46,49],[49,55,56],[61,64,62],[72,72,66],[84,81,70]];
  if((x+y)%7===0&&h(x>>2,y>>2,47)>.63)return rgb([37,42,46]);
  return pix(p,x,y,47);
}
function netherrack(x,y){
  const p=[[57,22,26],[80,29,33],[101,35,40],[123,43,47],[143,52,53]];
  if(h(x>>2,y>>2,50)>.73&&(x%4===1||y%4===0))return rgb([59,24,29]);
  return pix(p,x,y,50);
}
function basalt(x,y,face){
  if(face===0||face===2){
    const ring=Math.max(Math.abs(x-7.5),Math.abs(y-7.5));
    const pal=[[36,39,42],[51,55,57],[71,75,77],[89,92,94]];
    return rgb(pal[Math.min(3,Math.floor(ring/2))]);
  }
  const stripe=x===2||x===7||x===12||((x+Math.floor(y/3))%9===0);
  return rgb(stripe?[39,41,43]:h(x>>1,y>>2,67)>.57?[86,87,88]:[65,67,68]);
}
function soulSand(x,y){
  const eye=(y===6||y===7)&&(x===4||x===11);
  const mouth=y>=10&&y<=12&&x>=6&&x<=9;
  if(eye||mouth)return rgb([54,46,40]);
  return pix([[70,61,52],[86,73,59],[103,88,71],[120,103,81]],x,y,70);
}
function glass(x,y){
  const edge=x===0||y===0||x===15||y===15;
  const gleam=(x===3&&y>=2&&y<=10)||(y===3&&x>=3&&x<=11)||(x===11&&y>=9&&y<=13);
  if(edge)return rgb([138,183,200]);
  if(gleam)return rgb([229,249,249]);
  return rgb([187,219,227]);
}
function bricks(x,y,base,w=8,ht=4){
  const row=Math.floor(y/ht),off=(row%2)*(w>>1),grout=y%ht===0||(x+off)%w===0;
  const n=h((x+off)>>2,y>>2,base[0]);
  if(grout)return shade(base,-46);
  if(n>.82)return shade(base,16);
  if(n<.15)return shade(base,-14);
  return rgb(base);
}
function ore(x,y,id,deep){
  const base=rock(x,y,deep);
  const colors={
    18:[[23,25,28],[54,56,61]],19:[[164,109,74],[232,173,124]],
    95:[[172,95,56],[66,142,121]],96:[[217,160,43],[255,224,102]],
    97:[[158,22,33],[250,55,46]],98:[[24,58,157],[71,117,224]],
    99:[[25,150,168],[105,231,224]],100:[[29,151,73],[95,225,115]],
    83:[[191,179,157],[250,237,216]],84:[[206,147,42],[253,217,96]]
  };
  const original=id>=101&&id<=108?[18,19,95,96,97,98,99,100][id-101]:id;
  const c=colors[original];if(!c)return base;
  const centers=[[3,3],[12,4],[7,8],[4,12],[12,12]];
  let closest=10;
  for(const [cx,cy] of centers){
    const dx=Math.abs(x-cx),dy=Math.abs(y-cy);
    const dist=dx+dy+(h(x,y,id+cx+cy)-.5)*.65;
    closest=Math.min(closest,dist);
  }
  const limit=original===100?1.45:original===99?1.85:2.15;
  if(closest>limit)return base;
  if(closest>limit-.55)return shade(c[0],-26);
  return rgb(h(x>>1,y>>1,id)>.55?c[1]:c[0]);
}
function paint(id,face,x,y){
  x&=15;y&=15;
  if(id===1)return face===0?turf(x,y):face===2?earth(x,y):turfSide(x,y);
  if(id===2)return earth(x,y);
  if(id===3)return rock(x,y);
  if(id===4)return pix([[179,164,126],[199,185,147],[217,203,162],[232,220,184],[244,233,199]],x,y,4);
  if(id===7)return water(x,y);
  if(id===9)return glass(x,y);
  if(id===21)return snow(x,y);
  if(id===22||id===23)return ice(x,y,id===23);
  if(id===46)return moss(x,y);
  if(id===47)return mud(x,y);
  if(id===50||id===65)return netherrack(x,y);
  if(id===51)return obsidian(x,y);
  if(id===53)return bricks(x,y,[143,146,145],8,4);
  if(id===57)return pix([[120,118,113],[141,139,132],[157,155,147],[175,173,164]],x,y,57);
  if(id===58)return rock(x,y,true);
  if(id===66)return lava(x,y);
  if(id===67)return basalt(x,y,face);
  if(id===70||id===71)return soulSand(x,y);
  if(id===72||id===74)return bricks(x,y,[114,46,49],8,4);
  if(id===92)return gravel(x,y);
  if(id===121)return pix([[162,158,119],[187,183,139],[204,202,155],[223,220,171],[236,233,187]],x,y,121);
  if((id>=95&&id<=108)||id===18||id===19||id===83||id===84)return ore(x,y,id,id>=101&&id<=108);
  return null;
}
atlas.paint=(id,face,x,y)=>paint(id,face,x,y)||prior(id,face,x,y);
atlas.version='4.5-classic-voxel-surface-pass';
atlas.originalArt=true;
})();


/* MineWorld 4.6 — correct podzol palette and actual glass cutout pixels.
   These details are original art, not Mojang's published texture files. */
(()=>{
 const atlas=window.MineWorldPixelMaterials,prior=atlas.paint;
 const hash=(x,y,s)=>{let h=Math.imul(x+127,374761393)^Math.imul(y+181,668265263)^Math.imul(s+117,1274126177);h=Math.imul(h^(h>>>13),1274126177);return ((h^(h>>>16))>>>0)/4294967295};
 atlas.paint=(id,f,x,y)=>{
  x&=15;y&=15;
  if(id===28){
    const n=hash(x>>1,y>>1,28);
    const c=[[73,56,37],[98,74,47],[124,96,58],[145,113,71],[170,136,84]][n>.88?4:n>.61?3:n>.39?2:n>.16?1:0];
    if(f===0)return [...c,255];
    if(f===1&&y<2+(hash(x,0,77)>.62?1:0))return [107,86,52,255];
    return prior(29,f,x,y);
  }
  if(id===9){
    const frame=x===0||x===15||y===0||y===15;
    const beveled=(x===1&&y<6)||(y===1&&x>8);
    const shine=(x===3&&y>=3&&y<=8)||(y===3&&x>=3&&x<=7)||
      (x===12&&y>=10&&y<=12)||(y===12&&x>=11&&x<=13);
    if(frame)return [152,196,204,255];
    if(beveled)return [193,227,233,255];
    if(shine)return [229,248,249,255];
    return [0,0,0,0];
  }
  return prior(id,f,x,y);
 };
 atlas.version='4.6-classic-material-finishing';
 atlas.hasTransparentGlass=true;
})();
