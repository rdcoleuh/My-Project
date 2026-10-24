/* MineWorld 5.1: fast original weather overlay, no external textures/assets. */
(()=>{'use strict';
 const make=()=>{
  let context=null,lastDraw=-1,wasWet=false,lastLabel='';
  function update(state,dimension,biome,gameMode){
   const type=dimension==='overworld'?(state?.type||'clear'):'clear';
   const cold=/snow|frozen|ice|grove|cold|taiga/i.test(biome||'');
   const label=type==='clear'?'Clear':cold?'Snow':type==='thunder'?'Thunderstorm':'Rain';
   const status=document.getElementById('weather-status');
   if(status){
    status.classList.toggle('hidden',type==='clear');
    if(type!=='clear')status.textContent=(cold?'❄':type==='thunder'?'⛈':'☔')+' '+label;
   }
   const button=document.getElementById('weather-cycle');
   if(button){
    button.textContent='☁ Weather: '+(state?.type||'clear');
    button.disabled=gameMode!=='creative';
    button.title=gameMode==='creative'?'Switch between clear, rain and storms':'Weather changes naturally in Survival';
   }
   lastLabel=label;return label;
  }
  function draw(canvas,time,state,dimension,biome,isTouch,currentFPS){
   const wet=dimension==='overworld'&&state?.type!=='clear';
   if(!wet){
    if(wasWet&&context)context.clearRect(0,0,canvas.width,canvas.height);
    wasWet=false;return;
   }
   wasWet=true;
   if(time-lastDraw<(isTouch?.11:.075))return;
   lastDraw=time;
   if(!context)context=canvas.getContext('2d',{alpha:true});
   if(!context)return;
   const w=Math.max(1,Math.min(850,Math.round(canvas.clientWidth*.65)));
   const h=Math.max(1,Math.min(620,Math.round(canvas.clientHeight*.65)));
   if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
   context.clearRect(0,0,w,h);
   const cold=/snow|frozen|ice|grove|cold|taiga/i.test(biome||'');
   const storm=state.type==='thunder';
   const count=isTouch?(currentFPS>0&&currentFPS<25?25:55):(currentFPS>0&&currentFPS<28?40:100);
   context.beginPath();
   context.strokeStyle=storm?'rgba(180,205,234,.56)':'rgba(197,219,243,.43)';
   context.fillStyle='rgba(236,246,255,.80)';
   context.lineWidth=cold?1.7:1.15;
   for(let i=0;i<count;i++){
    const seedX=(i*73.61+i*i*.83)%w,seedY=(i*43.33+i*i*.54)%h;
    const x=((seedX+time*(cold?4.5:47))%w+w)%w;
    const y=((seedY+time*(cold?23:165)+i*.62)%h+h)%h;
    if(cold){context.moveTo(x+1.3,y);context.arc(x,y,1.1,0,Math.PI*2);}
    else{context.moveTo(x,y);context.lineTo(x-(storm?5:3),y+(storm?15:11));}
   }
   if(cold)context.fill();else context.stroke();
  }
  return Object.freeze({draw,update});
 };
 window.MineWorldWeatherVisual=make();
})();