# Receta — Oficina isométrica animada (agentes trabajando) en Canvas

Guía autocontenida para recrear la animación en **cualquier proyecto**. Es **Canvas 2D + `requestAnimationFrame`**, sin librerías. Incluye una versión **standalone** (un solo HTML, funciona con doble clic) y el **patrón React**.

---

## 1. Idea en 6 puntos
1. Un `<canvas>` con tamaño **lógico fijo** (960×600) escalado al contenedor.
2. Bucle `requestAnimationFrame`: cada frame → `update(dt)` (lógica) + redibujar todo.
3. Los personajes viven en una **rejilla de tiles** (`gx,gy`); una **proyección isométrica** los pasa a pantalla.
4. Se ordena todo por **profundidad** (`gx+gy`) para que se tapen bien.
5. Cada agente tiene una **máquina de estados** (sentado → va a estación → trabaja → vuelve; además charla / reunión / café).
6. El muñeco se dibuja con **cápsulas** (líneas gruesas con punta redonda) y se anima con **senos** (`Math.sin`).

**Fórmula clave (mundo → pantalla):**
```js
const TW=64, TH=32, OX=432, OY=118;   // ancho/alto de tile + origen
let panX=0, panY=0;                    // cámara arrastrable
const w2s = (gx, gy, gz=0) => ({
  x: OX + panX + (gx - gy) * (TW/2),
  y: OY + panY + (gx + gy) * (TH/2) - gz,  // gz = altura (paredes/muebles)
});
```

---

## 2. Versión standalone (copia/pega en un `.html`)

> Personaliza solo el array `AGENTS` (etiqueta, emoji, color) y, si quieres, los tiles de escritorios/estaciones.

```html
<!doctype html><html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Oficina de agentes</title>
<style>
  :root{ --bg:#eef1f6; --panel:#fff; --border:rgba(15,23,42,.1); --text:#0f172a; --muted:#5a677b; --accent:#f97316; }
  @media (prefers-color-scheme:dark){ :root{ --bg:#070a12; --panel:#0f1522; --border:rgba(148,163,184,.14); --text:#e7ecf3; --muted:#93a1b5; } }
  *{box-sizing:border-box} body{margin:0;font-family:system-ui,sans-serif;background:var(--bg);color:var(--text);padding:24px}
  .shell{max-width:1040px;margin:0 auto}
  .bar{display:flex;gap:12px;align-items:center;margin:12px 0;padding:10px 14px;border:1px solid var(--border);border-radius:12px;background:var(--panel)}
  .btn{border:1px solid var(--border);background:var(--panel);color:var(--text);font:inherit;font-size:13px;font-weight:600;padding:8px 14px;border-radius:9px;cursor:pointer}
  .btn.primary{background:var(--accent);color:#fff;border-color:transparent}
  .stage{position:relative;border:1px solid var(--border);border-radius:16px;overflow:hidden;background:var(--panel)}
  canvas{display:block;width:100%;height:auto}
  .tip{position:absolute;pointer-events:none;transform:translate(-50%,-100%);background:var(--text);color:var(--bg);font-size:12px;font-weight:600;padding:6px 9px;border-radius:8px;white-space:nowrap;opacity:0;transition:opacity .12s}
  .tip small{display:block;font-weight:500;opacity:.7;font-size:10px;margin-top:1px}
</style></head><body><div class="shell">
  <div class="bar"><b id="live">En la oficina</b><span style="margin-left:auto"></span>
    <button class="btn" id="pause">Pausar</button><button class="btn primary" id="task">Dar una tarea</button></div>
  <div class="stage" id="stage"><canvas id="cv"></canvas><div class="tip" id="tip"></div></div>
</div>
<script>
(function(){
  const W=960,H=600,cv=document.getElementById('cv'),ctx=cv.getContext('2d');
  const stage=document.getElementById('stage'),tip=document.getElementById('tip'),liveEl=document.getElementById('live');
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const COLS=12,ROWS=9,TW=64,TH=32,OX=432,OY=118,WALL=116;
  let panX=0,panY=0;
  const w2s=(gx,gy,gz=0)=>({x:OX+panX+(gx-gy)*(TW/2),y:OY+panY+(gx+gy)*(TH/2)-gz});

  // ── CONFIG: personaliza aquí ──────────────────────────────────────────────
  const AGENTS=[
    {code:'A-01',emoji:'🗂️',role:'Administración',c:'#f97316',person:'Ana'},
    {code:'A-02',emoji:'📊',role:'Analítica',c:'#3b82f6',person:'Beto'},
    {code:'A-03',emoji:'💰',role:'Finanzas',c:'#14b8a6',person:'Caro'},
    {code:'A-04',emoji:'🛡️',role:'Seguridad',c:'#64748b',person:'Dani'},
    {code:'A-05',emoji:'📣',role:'Marketing',c:'#d946ef',person:'Eva'},
    {code:'A-06',emoji:'⚙️',role:'Operaciones',c:'#0ea5e9',person:'Fede'},
    {code:'A-07',emoji:'🩺',role:'Soporte',c:'#ec4899',person:'Gaby'},
    {code:'A-08',emoji:'⚖️',role:'Legal',c:'#6366f1',person:'Hugo'},
    {code:'A-09',emoji:'🧠',role:'Producto',c:'#8b5cf6',person:'Ivy'},
  ];
  const PHRASES=['Procesando…','Listo ✔','Revisando','Generando…','Analizando'];
  const CHAT=['¿Cómo va?','¡Vamos bien!','¿Un café? ☕','Buen trabajo 👏'];
  const SKIN=['#f7d7b8','#eab68f','#cf9a6d','#a56a43','#7a4a2f'];
  const HAIR=['#241c17','#4a3524','#6b4423','#b8b8bd','#111827','#8a8f98','#d9a441'];
  const OUTFITS=['blazer','tee','jacket','polo','hoodie','vest'];
  const PANTS=['#2b3140','#3b4557','#374151','#4b5563'];

  const desks=[]; [{j:3,c:[2,4,6,8,10]},{j:5,c:[2,4,6,8]},{j:7,c:[2,4,6,8]}].forEach(r=>r.c.forEach(i=>desks.push({i,j:r.j})));
  const stations=[{i:2,j:1,e:'🖥️',l:'Servidor'},{i:6,j:1,e:'📋',l:'Tablero'},{i:10,j:1,e:'☕',l:'Café'}];
  const MEET={gx:6,gy:8};

  const A=AGENTS.map((a,k)=>{const d=desks[k],gx=d.i+0.5,gy=d.j+0.9;return{...a,
    skin:SKIN[k%SKIN.length],hair:HAIR[(k*3)%HAIR.length],outfit:OUTFITS[k%OUTFITS.length],pants:PANTS[k%PANTS.length],glasses:k%3===0,
    home:{gx,gy},di:k,gx,gy,tx:gx,ty:gy,state:'sit',station:null,dir:1,phase:Math.random()*6.28,until:0,
    chatWith:null,group:null,arrived:false,coffee:false,strolls:0,say:'',sayU:0,nextSay:0,sx:0,sy:0};});

  const isDark=()=>{const t=document.documentElement.dataset.theme;return t?t==='dark':matchMedia('(prefers-color-scheme:dark)').matches;};
  const SPEED=1.9;
  const move=(a,dt)=>{const dx=a.tx-a.gx,dy=a.ty-a.gy,d=Math.hypot(dx,dy);if(d<0.03){a.gx=a.tx;a.gy=a.ty;return true;}const s=Math.min(d,SPEED*dt);a.gx+=dx/d*s;a.gy+=dy/d*s;if(Math.abs(dx)>0.001)a.dir=dx>0?1:-1;return false;};
  const task=a=>{if(a.state!=='sit')return;const s=stations[Math.floor(Math.random()*stations.length)];a.station=s;a.tx=s.i+0.5;a.ty=s.j+0.95;a.state='toStation';};
  const chat=()=>{const id=A.filter(x=>x.state==='sit');if(id.length<2)return;const a=id[Math.random()*id.length|0];let b;do{b=id[Math.random()*id.length|0];}while(b===a);a.chatWith=b;b.chatWith=a;a.arrived=b.arrived=false;a.tx=5.3;a.ty=6.2;b.tx=6.7;b.ty=6.2;a.state=b.state='toChat';};
  const meeting=()=>{const id=A.filter(x=>x.state==='sit');if(id.length<4)return;const n=3+(Math.random()*2|0),p=id.slice(),m=[];for(let i=0;i<n&&p.length;i++)m.push(p.splice(Math.random()*p.length|0,1)[0]);const g={m,started:false,until:0};const seats=[{gx:MEET.gx-1.2,gy:MEET.gy},{gx:MEET.gx+1.2,gy:MEET.gy},{gx:MEET.gx,gy:MEET.gy-.95},{gx:MEET.gx,gy:MEET.gy+1.05}];m.forEach((x,i)=>{x.group=g;x.arrived=false;x.tx=seats[i].gx;x.ty=seats[i].gy;x.state='toMeeting';});};
  const stroll=a=>{a.tx=2+Math.random()*8;a.ty=3+Math.random()*4.5;};
  const coffee=()=>{const id=A.filter(x=>x.state==='sit');if(!id.length)return;const a=id[Math.random()*id.length|0],c=stations[2];a.tx=c.i+0.5;a.ty=c.j+0.95;a.state='toCoffee';};

  function update(dt,t){let w=0,ch=0,me=0,co=0;
    for(const a of A){
      if(a.state==='toStation'){if(move(a,dt)){a.state='atStation';a.until=t+2.8+Math.random()*3.6;a.say=(a.tag?a.tag+' · ':'')+PHRASES[Math.random()*PHRASES.length|0];a.sayU=a.until;}}
      else if(a.state==='atStation'){if(t>=a.until){a.tx=a.home.gx;a.ty=a.home.gy;a.state='toDesk';}}
      else if(a.state==='toChat'){if(move(a,dt)){a.arrived=true;if(a.chatWith&&a.chatWith.arrived){const u=t+4.5+Math.random()*3;a.state='chatting';a.until=u;a.nextSay=t;a.chatWith.state='chatting';a.chatWith.until=u;a.chatWith.nextSay=t+1.4;}}}
      else if(a.state==='chatting'){if(a.chatWith)a.dir=a.chatWith.gx>=a.gx?1:-1;if(t>=a.nextSay){a.say=CHAT[Math.random()*CHAT.length|0];a.sayU=t+1.9;a.nextSay=t+3;}if(t>=a.until){a.tx=a.home.gx;a.ty=a.home.gy;a.state='toDesk';a.chatWith=null;a.arrived=false;}}
      else if(a.state==='toMeeting'){if(move(a,dt)){a.arrived=true;const g=a.group;if(g&&!g.started&&g.m.every(x=>x.arrived)){g.started=true;g.until=t+6+Math.random()*4;g.m.forEach(x=>{x.state='meeting';x.until=g.until;x.nextSay=t+Math.random()*2;});}}}
      else if(a.state==='meeting'){a.dir=MEET.gx>=a.gx?1:-1;if(t>=a.nextSay){a.say=CHAT[Math.random()*CHAT.length|0];a.sayU=t+2;a.nextSay=t+3+Math.random()*2;}if(t>=a.until){a.tx=a.home.gx;a.ty=a.home.gy;a.state='toDesk';a.group=null;a.arrived=false;}}
      else if(a.state==='toCoffee'){if(move(a,dt)){a.coffee=true;a.state='coffeeStroll';a.strolls=2+(Math.random()*2|0);a.say='☕';a.sayU=t+2;stroll(a);}}
      else if(a.state==='coffeeStroll'){if(move(a,dt)){a.strolls--;if(a.strolls>0)stroll(a);else{a.tx=a.home.gx;a.ty=a.home.gy;a.state='toDesk';}}}
      else if(a.state==='toDesk'){if(move(a,dt)){a.state='sit';a.dir=1;a.coffee=false;}}
      if(a.state==='atStation')w++;else if(a.state==='chatting')ch++;else if(a.state==='meeting')me++;else if(a.state==='coffeeStroll'||a.state==='toCoffee')co++;
    }
    const p=[];if(w)p.push(w+' trabajando');if(me)p.push(me+' en reunión');if(ch)p.push(ch+' charlando');if(co)p.push(co+' en café');
    liveEl.textContent=p.length?p.join(' · '):(A.length+' en la oficina');
  }

  // ── helpers de dibujo ──
  const poly=(pts,f,s,lw)=>{ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();if(f){ctx.fillStyle=f;ctx.fill();}if(s){ctx.strokeStyle=s;ctx.lineWidth=lw||1;ctx.stroke();}};
  const rr=(x,y,w,h,r)=>{ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();};
  const cap=(x1,y1,x2,y2,w,c)=>{ctx.strokeStyle=c;ctx.lineWidth=w;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();};
  const dot=(x,y,r,c)=>{ctx.fillStyle=c;ctx.beginPath();ctx.arc(x,y,r,0,6.2832);ctx.fill();};
  const shade=(hex,f)=>{const n=parseInt(hex.slice(1),16);let r=(n>>16)&255,g=(n>>8)&255,b=n&255;const to=f<0?0:255,tt=Math.abs(f);r=Math.round(r+(to-r)*tt);g=Math.round(g+(to-g)*tt);b=Math.round(b+(to-b)*tt);return`rgb(${r},${g},${b})`;};
  const bubble=(X,y,txt,dk)=>{ctx.font='600 10px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';const w=Math.max(30,ctx.measureText(txt).width+14),h=17;ctx.fillStyle=dk?'#e7ecf3':'#fff';ctx.strokeStyle='rgba(0,0,0,.2)';ctx.lineWidth=1;rr(X-w/2,y-h,w,h,8);ctx.fill();ctx.stroke();ctx.beginPath();ctx.moveTo(X-4,y-1.5);ctx.lineTo(X,y+3.5);ctx.lineTo(X+4,y-1.5);ctx.closePath();ctx.fillStyle=dk?'#e7ecf3':'#fff';ctx.fill();ctx.fillStyle='#0f172a';ctx.fillText(txt,X,y-h/2-1);};

  function walls(dk){const wr=dk?'#141d2e':'#dfe5ee',wl=dk?'#0f1626':'#d3dae6';const b0=w2s(0,0),b1=w2s(COLS,0);poly([b0,b1,{x:b1.x,y:b1.y-WALL},{x:b0.x,y:b0.y-WALL}],wr);const sky=dk?'#24406b':'#bfe0ff';[[2.4,4],[6.4,8],[9.4,11]].forEach(s=>{const p0=w2s(s[0],0),p1=w2s(s[1],0);poly([{x:p0.x,y:p0.y-WALL+20},{x:p1.x,y:p1.y-WALL+20},{x:p1.x,y:p1.y-44},{x:p0.x,y:p0.y-44}],sky,dk?'#0b1120':'#fff',2);});const l0=w2s(0,0),l1=w2s(0,ROWS);poly([l0,l1,{x:l1.x,y:l1.y-WALL},{x:l0.x,y:l0.y-WALL}],wl);
    const base=w2s(8.5,0),cx=base.x,cy=base.y-WALL+38,r=14;ctx.fillStyle=dk?'#0b1120':'#fff';ctx.strokeStyle=dk?'#2a3a55':'#c2ccdb';ctx.lineWidth=2;ctx.beginPath();ctx.arc(cx,cy,r,0,6.2832);ctx.fill();ctx.stroke();const now=new Date(),h=now.getHours()%12,m=now.getMinutes(),ha=((h+m/60)/12)*6.2832-Math.PI/2,ma=(m/60)*6.2832-Math.PI/2;ctx.strokeStyle=dk?'#cbd5e1':'#334155';ctx.lineCap='round';ctx.lineWidth=2.2;ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx+Math.cos(ha)*r*.5,cy+Math.sin(ha)*r*.5);ctx.stroke();ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx+Math.cos(ma)*r*.82,cy+Math.sin(ma)*r*.82);ctx.stroke();}
  function floor(dk){const a=dk?'#0e1626':'#e7ecf4',b=dk?'#0c1322':'#dfe5ef';for(let i=0;i<COLS;i++)for(let j=0;j<ROWS;j++)poly([w2s(i,j),w2s(i+1,j),w2s(i+1,j+1),w2s(i,j+1)],(i+j)%2?a:b);}
  function table(dk){const p=w2s(MEET.gx,MEET.gy,0);ctx.fillStyle=dk?'rgba(0,0,0,.25)':'rgba(15,23,42,.08)';ctx.beginPath();ctx.ellipse(p.x,p.y+5,36,17,0,0,6.2832);ctx.fill();ctx.fillStyle=dk?'#22304a':'#e4e9f2';ctx.beginPath();ctx.ellipse(p.x,p.y-6,36,17,0,0,6.2832);ctx.fill();}
  function desk(di,dk){const d=desks[di],o=A[di],occ=o&&o.state==='sit';const f0=w2s(d.i+.05,d.j+.85,0),f1=w2s(d.i+.95,d.j+.85,0);poly([f0,f1,{x:f1.x,y:f1.y-34},{x:f0.x,y:f0.y-34}],dk?'#141f31':'#c9d2df');poly([w2s(d.i+.05,d.j+.15,34),w2s(d.i+.95,d.j+.15,34),w2s(d.i+.95,d.j+.85,34),w2s(d.i+.05,d.j+.85,34)],dk?'#1c2942':'#eef2f8');const m=w2s(d.i+.5,d.j+.25,34);
    if(occ){const g=ctx.createRadialGradient(m.x+15,m.y-13,2,m.x+15,m.y-13,26);g.addColorStop(0,'rgba(255,214,120,.55)');g.addColorStop(1,'rgba(255,214,120,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(m.x+15,m.y-13,26,0,6.2832);ctx.fill();}
    ctx.strokeStyle=dk?'#2a3852':'#8a97ab';ctx.lineWidth=1.6;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(m.x+15,m.y-2);ctx.lineTo(m.x+15,m.y-12);ctx.lineTo(m.x+9,m.y-16);ctx.stroke();ctx.fillStyle=occ?'#ffd66e':(dk?'#33415a':'#b7c1d1');ctx.beginPath();ctx.arc(m.x+9,m.y-16,3,0,6.2832);ctx.fill();
    ctx.fillStyle=dk?'#060b16':'#334155';rr(m.x-13,m.y-30,26,18,3);ctx.fill();ctx.fillStyle=occ?'rgba(120,180,255,1)':(dk?'rgba(96,165,250,.22)':'rgba(150,200,255,.5)');rr(m.x-10,m.y-27,20,12,2);ctx.fill();}
  function station(s,dk){const p=w2s(s.i+.5,s.j+.5,0);ctx.fillStyle=dk?'#1a2740':'#fff';rr(p.x-26,p.y-58,52,52,10);ctx.fill();ctx.font='26px serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(s.e,p.x,p.y-34);ctx.font='600 11px system-ui';ctx.fillStyle=dk?'#93a1b5':'#5a677b';ctx.fillText(s.l,p.x,p.y-14);}
  function human(a,t,dk){const walk=/^to|Stroll$/.test(a.state)||a.state==='toDesk',work=a.state==='atStation',sit=a.state==='sit';const p=w2s(a.gx,a.gy,0);const bob=(walk&&!reduce)?Math.abs(Math.sin(t*8+a.phase))*3:0,X=p.x,Y=p.y-bob;const sw=(walk&&!reduce)?Math.sin(t*8+a.phase)*4:0,tw=((work||sit)&&!reduce)?Math.sin(t*11+a.phase)*1.6:0;
    ctx.fillStyle='rgba(0,0,0,.2)';ctx.beginPath();ctx.ellipse(X,p.y,12,5,0,0,6.2832);ctx.fill();
    if(sit){ctx.fillStyle=dk?'#0c1424':'#aeb8c7';rr(X-9,Y-30,18,15,4);ctx.fill();}
    if(work&&!reduce){const pr=24+Math.sin(t*4)*4,g=ctx.createRadialGradient(X,Y-22,4,X,Y-22,pr);g.addColorStop(0,a.c+'55');g.addColorStop(1,a.c+'00');ctx.fillStyle=g;ctx.beginPath();ctx.arc(X,Y-22,pr,0,6.2832);ctx.fill();}
    ctx.save();ctx.translate(X,Y);ctx.scale(a.dir,1);
    if(sit){cap(-4,-15,-4,-3,6,a.pants);cap(4,-15,4,-3,6,a.pants);dot(-4,-2.5,2.4,'#20242c');dot(4,-2.5,2.4,'#20242c');}
    else{cap(-3,-14,-3-sw,0,6,a.pants);cap(3,-14,3+sw,0,6,a.pants);dot(-3-sw,0,2.4,'#20242c');dot(3+sw,0,2.4,'#20242c');}
    cap(0,-15,0,-30,15,a.c);const sh=-28;
    if(work||sit){const hy=-20+tw;cap(-6,sh,-8,hy,5,a.c);cap(6,sh,8,hy,5,a.c);dot(-8,hy,2.4,a.skin);dot(8,hy,2.4,a.skin);}
    else if(walk){cap(-6,sh,-6-sw,-16,5,a.c);cap(6,sh,6+sw,-16,5,a.c);dot(-6-sw,-16,2.4,a.skin);dot(6+sw,-16,2.4,a.skin);}
    else{cap(-6,sh,-8,-16,5,a.c);cap(6,sh,8,-16,5,a.c);dot(-8,-16,2.4,a.skin);dot(8,-16,2.4,a.skin);}
    const D=shade(a.c,-.34),L=shade(a.c,.4);
    if(a.outfit==='polo'){poly([{x:-3,y:-30},{x:-1,y:-30},{x:-2,y:-26}],D);poly([{x:3,y:-30},{x:1,y:-30},{x:2,y:-26}],D);cap(0,-29,0,-22,1.3,D);}
    else if(a.outfit==='blazer'){poly([{x:-7,y:-30},{x:-1,y:-29},{x:-3,y:-19}],D);poly([{x:7,y:-30},{x:1,y:-29},{x:3,y:-19}],D);cap(0,-30,0,-20,2.2,'#b23a4b');}
    else if(a.outfit==='hoodie'){ctx.fillStyle=D;ctx.beginPath();ctx.ellipse(0,-30,8,3.4,0,Math.PI,0);ctx.fill();cap(-5,-21,5,-21,3,D);cap(-1.6,-29,-1.6,-24,1,L);cap(1.6,-29,1.6,-24,1,L);}
    else if(a.outfit==='vest'){cap(0,-16,0,-29,10,D);}
    else if(a.outfit==='jacket'){cap(0,-30,0,-15,1.2,L);}
    else{ctx.strokeStyle=D;ctx.lineWidth=1.4;ctx.beginPath();ctx.arc(0,-30,3,.15*Math.PI,.85*Math.PI);ctx.stroke();}
    cap(0,-30,0,-33,6,a.skin);dot(0,-40,7.4,a.skin);
    ctx.fillStyle=a.hair;ctx.beginPath();ctx.arc(0,-40,7.9,Math.PI*1.04,Math.PI*2-.04);ctx.fill();ctx.fillRect(-7.7,-41,15.4,3);
    const blink=!reduce&&(((t+a.phase*1.7)%4)<.12);if(blink){cap(-3,-39.4,-1.6,-39.4,1.4,'#20222b');cap(1.6,-39.4,3,-39.4,1.4,'#20222b');}else{dot(-2.6,-39.6,.95,'#20222b');dot(2.6,-39.6,.95,'#20222b');}
    ctx.strokeStyle='#9c5b46';ctx.lineWidth=.9;ctx.beginPath();ctx.arc(0,-37,2,.12*Math.PI,.88*Math.PI);ctx.stroke();
    if(a.glasses){ctx.strokeStyle='#2b2f38';ctx.lineWidth=1;ctx.beginPath();ctx.arc(-2.6,-39.6,2.1,0,6.2832);ctx.moveTo(4.7,-39.6);ctx.arc(2.6,-39.6,2.1,0,6.2832);ctx.stroke();}
    ctx.restore();
    // chapita emoji + spinner + café + nombre + burbuja
    ctx.fillStyle=dk?'#0f1522':'#fff';ctx.strokeStyle=a.c;ctx.lineWidth=1.5;rr(X-11,Y-62,22,18,7);ctx.fill();ctx.stroke();ctx.font='12px serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(a.emoji,X,Y-53);
    if(work){const r=7,cx=X+13,cy=Y-53;ctx.strokeStyle='rgba(16,185,129,.3)';ctx.lineWidth=2.4;ctx.beginPath();ctx.arc(cx,cy,r,0,6.2832);ctx.stroke();ctx.strokeStyle='#10b981';const a0=reduce?0:t*6;ctx.beginPath();ctx.arc(cx,cy,r,a0,a0+1.7);ctx.stroke();}
    if(a.coffee){const hx=X+9*a.dir,hy=Y-16;ctx.fillStyle=dk?'#e7ecf3':'#fff';rr(hx-3,hy-3,6,6,1.5);ctx.fill();ctx.fillStyle='#6f4a26';rr(hx-3,hy-3,6,2,1);ctx.fill();}
    ctx.font='700 9px system-ui';const nw=Math.max(26,ctx.measureText(a.person).width+10);ctx.fillStyle=dk?'rgba(12,18,30,.9)':'rgba(255,255,255,.94)';ctx.strokeStyle=a.c;ctx.lineWidth=1;rr(X-nw/2,p.y+6,nw,13,6);ctx.fill();ctx.stroke();ctx.fillStyle=dk?'#dbe4f0':'#243244';ctx.fillText(a.person,X,p.y+12.7);
    if(a.say&&t<a.sayU)bubble(X,Y-64,a.say,dk);
    a.sx=X;a.sy=Y-30;}

  let last=performance.now()/1000,paused=false,raf=0;
  function frame(now){const t=now/1000,dt=Math.min(.05,t-last);last=t;const dk=isDark();if(!paused)update(dt,t);
    ctx.clearRect(0,0,W,H);walls(dk);floor(dk);
    const e=[];e.push({k:MEET.gx+MEET.gy-.25,d:()=>table(dk)});desks.forEach((d,i)=>e.push({k:d.i+d.j-0.15,d:()=>desk(i,dk)}));stations.forEach(s=>e.push({k:s.i+s.j-0.15,d:()=>station(s,dk)}));A.forEach(a=>e.push({k:a.gx+a.gy,d:()=>human(a,t,dk)}));
    e.sort((p,q)=>p.k-q.k).forEach(x=>x.d());raf=requestAnimationFrame(frame);}

  function auto(){if(!paused){const id=A.filter(a=>a.state==='sit'),r=Math.random();if(r<.14&&id.length>=6)meeting();else if(r<.34&&id.length>=5)chat();else if(r<.46&&id.length>=3)coffee();else if(id.length>6)task(id[Math.random()*id.length|0]);}setTimeout(auto,1200+Math.random()*1800);}
  document.getElementById('task').onclick=()=>{const id=A.filter(a=>a.state==='sit');if(id.length)task(id[Math.random()*id.length|0]);};
  const pb=document.getElementById('pause');pb.onclick=()=>{paused=!paused;pb.textContent=paused?'Reanudar':'Pausar';};

  // cámara arrastrable + tooltip
  let scale=1,drag=null;stage.style.cursor='grab';
  stage.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY,px:panX,py:panY};stage.style.cursor='grabbing';tip.style.opacity='0';});
  const end=()=>{if(drag){drag=null;stage.style.cursor='grab';}};stage.addEventListener('pointerup',end);
  stage.addEventListener('pointermove',e=>{if(drag){panX=Math.max(-190,Math.min(190,drag.px+(e.clientX-drag.x)/scale));panY=Math.max(-120,Math.min(150,drag.py+(e.clientY-drag.y)/scale));return;}
    const r=cv.getBoundingClientRect(),mx=(e.clientX-r.left)/scale,my=(e.clientY-r.top)/scale;let hit=null,best=900;for(const a of A){const dx=a.sx-mx,dy=a.sy-my,d=dx*dx+dy*dy;if(d<best){best=d;hit=a;}}
    if(hit){tip.style.left=(hit.sx*scale)+'px';tip.style.top=((hit.sy-34)*scale)+'px';const st=hit.state==='atStation'?('Trabajando en '+hit.station.l):hit.state==='chatting'?'Charlando':hit.state==='meeting'?'En reunión':(hit.state==='toCoffee'||hit.state==='coffeeStroll')?'Café ☕':hit.state==='sit'?'En su escritorio':'Caminando…';tip.innerHTML=hit.person+'<small>'+hit.role+' · '+hit.code+' · '+st+'</small>';tip.style.opacity='1';}else tip.style.opacity='0';});
  stage.addEventListener('pointerleave',()=>{tip.style.opacity='0';end();});

  function resize(){const w=stage.clientWidth;scale=w/W;const dpr=Math.min(2,devicePixelRatio||1);cv.width=W*scale*dpr;cv.height=H*scale*dpr;cv.style.height=(H*scale)+'px';ctx.setTransform(scale*dpr,0,0,scale*dpr,0,0);}
  new ResizeObserver(resize).observe(stage);resize();
  if(!reduce){setTimeout(()=>task(A[1]),500);setTimeout(()=>task(A[4]),1100);}auto();requestAnimationFrame(frame);
})();
</script></body></html>
```

---

## 3. Cómo alimentarlo con datos reales
Deja la simulación como fallback y, cuando llegue actividad real (webhook, WebSocket, polling…),
dispara `task(agente)` del agente correspondiente:
```js
function onRealActivity(agentCode){ const a = A.find(x=>x.code===agentCode); if(a && a.state==='sit') task(a); }
```
También puedes poner un `tag` en cada agente (p. ej. un id de job) y mostrarlo en la burbuja
(el código ya usa `a.tag` si existe).

---

## 4. Patrón React (TypeScript)
Envuelve TODO el bloque `(function(){…})()` dentro de un `useEffect`:
```tsx
export function OfficeScene({ activeCodes }: { activeCodes?: string[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef  = useRef<HTMLDivElement>(null);
  const activeRef = useRef<string[]>([]);
  useEffect(() => { activeRef.current = activeCodes ?? []; }, [activeCodes]);

  useEffect(() => {
    const cv = canvasRef.current!, stage = stageRef.current!;
    const ctx = cv.getContext('2d')!;
    // … pega aquí w2s, A[], update, draw, frame, auto, listeners …
    // en update(): const act = activeRef.current; if (act.length) for (const a of A)
    //   if (a.state==='sit' && act.includes(a.code) && Math.random()<0.5) task(a);
    let raf = requestAnimationFrame(frame); const id = setTimeout(auto, 800);
    const ro = new ResizeObserver(resize); ro.observe(stage); resize();
    return () => { cancelAnimationFrame(raf); clearTimeout(id); ro.disconnect(); /* + removeEventListener */ };
  }, []);

  return (
    <div>
      {/* barra con botones */}
      <div ref={stageRef} style={{ position:'relative' }}>
        <canvas ref={canvasRef} style={{ width:'100%' }} />
        {/* div tooltip */}
      </div>
    </div>
  );
}
```
Claves del port: refs en vez de `getElementById`; leer props "vivas" con un `ref` (no dependencias del effect); **limpiar** `rAF`, timers, `ResizeObserver` y listeners en el return.

---

## 5. Tips y gotchas
- **Emojis en Canvas**: `ctx.fillText('🖥️', x, y)` con `font` que incluya `serif` (mejor soporte de emoji).
- **HiDPI**: fija `canvas.width/height = lógico * scale * devicePixelRatio` y usa `ctx.setTransform`.
- **Profundidad**: ordena por `gx+gy`; usa pequeños offsets (`-0.15`) para desempatar mueble vs persona.
- **Billboarding**: los personajes son 2D "de frente"; voltea con `ctx.scale(dir,1)`.
- **Animación barata y orgánica**: `Math.sin(t*vel + phaseAleatoria)` para caminar/teclear/pulsar.
- **Tema en vivo**: recalcula colores **cada frame** leyendo `prefers-color-scheme`/`data-theme`.
- **Accesibilidad**: respeta `prefers-reduced-motion` (desactiva los `sin()` y deja estados estáticos).
- **Rendimiento**: 10-20 personajes van sobrados; para cientos, cachea el piso/paredes en un canvas aparte.

---

*Basado en la escena `/oficina` de SpeedSkateTrack (componente `AgentOfficeScene.tsx`).*
