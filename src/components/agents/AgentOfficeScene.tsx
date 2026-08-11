import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * Escena isométrica "oficina de agentes" en Canvas: los 13 agentes como personas
 * que trabajan, se reúnen, charlan y toman café. Autocontenido (simulación); si se
 * pasa `activeCodes` (p. ej. desde useAgentActivity), esos agentes se ponen a
 * trabajar en la escena para reflejar la actividad real.
 */
interface Props {
  activeCodes?: string[];
  className?: string;
}

type AState =
  | 'sit' | 'toStation' | 'atStation' | 'toChat' | 'chatting'
  | 'toMeeting' | 'meeting' | 'toCoffee' | 'coffeeStroll' | 'toDesk';

interface Station { i: number; j: number; emoji: string; label: string; }
interface Group { members: Agent[]; started: boolean; until: number; }
interface Agent {
  code: string; emoji: string; role: string; c: string;
  skin: string; hair: string; outfit: string; pants: string; glasses: boolean;
  person: string; phrases: string[]; autos: string[];
  home: { gx: number; gy: number }; deskIndex: number;
  gx: number; gy: number; tx: number; ty: number;
  state: AState; station: Station | null; dir: number; phase: number; until: number;
  chatWith: Agent | null; group: Group | null; arrived: boolean;
  coffee: boolean; strolls: number; sayText: string; sayUntil: number; nextSay: number;
  sx: number; sy: number;
}

export function AgentOfficeScene({ activeCodes, className }: Props) {
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const liveRef = useRef<HTMLSpanElement>(null);
  const taskBtnRef = useRef<HTMLButtonElement>(null);
  const pauseBtnRef = useRef<HTMLButtonElement>(null);
  const activeRef = useRef<string[]>([]);
  const [paused, setPaused] = useState(false);

  useEffect(() => { activeRef.current = activeCodes ?? []; }, [activeCodes]);

  useEffect(() => {
    const stage = stageRef.current, cv = canvasRef.current, tip = tipRef.current, live = liveRef.current;
    if (!stage || !cv || !tip || !live) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

    const W = 960, H = 600, COLS = 12, ROWS = 9, TW = 64, TH = 32, OX = 432, OY = 118, WALL = 116;
    let panX = 0, panY = 0, pausedLocal = false;
    const w2s = (gx: number, gy: number, gz = 0) => ({ x: OX + panX + (gx - gy) * (TW / 2), y: OY + panY + (gx + gy) * (TH / 2) - gz });

    const DEFS = [
      { code: 'AG-01', emoji: '🗂️', role: 'Asistente Administrador', c: '#f97316', person: 'Ana Admin' },
      { code: 'AG-02', emoji: '🛼', role: 'Entrenador — Patinaje', c: '#3b82f6', person: 'Coach Caro' },
      { code: 'AG-03', emoji: '🚴', role: 'Experto en Ciclismo', c: '#06b6d4', person: 'Diego Bici' },
      { code: 'AG-04', emoji: '🥗', role: 'Nutricionista IA', c: '#22c55e', person: 'Nadia Nutri' },
      { code: 'AG-05', emoji: '🏋️', role: 'Preparador Físico', c: '#ef4444', person: 'Fabián Fit' },
      { code: 'AG-06', emoji: '🩺', role: 'Medicina Deportiva', c: '#ec4899', person: 'Dra. Rojas' },
      { code: 'AG-07', emoji: '💰', role: 'Asesor Financiero', c: '#14b8a6', person: 'Fer Finanzas' },
      { code: 'AG-08', emoji: '🛡️', role: 'Agente de Seguridad', c: '#64748b', person: 'Sergio Seg.' },
      { code: 'AG-09', emoji: '📣', role: 'Marketing', c: '#d946ef', person: 'Mara Mkt' },
      { code: 'AG-10', emoji: '🏆', role: 'Analista de Resultados', c: '#eab308', person: 'Rafa Result.' },
      { code: 'AG-11', emoji: '⚙️', role: 'Operaciones', c: '#0ea5e9', person: 'Olivia Ops' },
      { code: 'AG-12', emoji: '⚖️', role: 'Legal y Cumplimiento', c: '#6366f1', person: 'Lucía Legal' },
      { code: 'AG-13', emoji: '🧠', role: 'Psicología Deportiva', c: '#8b5cf6', person: 'Pablo Mente' },
    ];
    const SKIN = ['#f7d7b8', '#eab68f', '#cf9a6d', '#a56a43', '#7a4a2f', '#f2c9a0'];
    const HAIR = ['#241c17', '#4a3524', '#3b2a1e', '#6b4423', '#b8b8bd', '#111827', '#8a8f98', '#d9a441'];
    const STYLES = ['blazer', 'tee', 'jacket', 'polo', 'tee', 'polo', 'blazer', 'jacket', 'hoodie', 'polo', 'vest', 'blazer', 'hoodie'];
    const PANTS = ['#2b3140', '#3b4557', '#374151', '#4b5563', '#3f4a5a', '#3b4557', '#2b3140', '#2f3947', '#3b4557', '#4b5563', '#374151', '#2b3140', '#3b4557'];
    const GLASSES = [true, false, false, false, false, false, true, false, false, false, true, true, false];
    const PHRASES: string[][] = [
      ['Actualizando el club…', 'Resumen listo ✔'], ['Ajusto la técnica', 'Plan de la semana'], ['Ruta de hoy 🚴', 'Cross-training'],
      ['Plan de comidas 🥗', 'Hidratación'], ['Rutina de fuerza 💪', 'A entrenar'], ['Revisando lesiones', 'Todo en orden'],
      ['Generando factura…', 'Cuadrando caja'], ['Revisando accesos', 'Sin alertas ✔'], ['Post para redes 📣', 'Nueva campaña'],
      ['Cargando resultados 🏆', 'Ranking al día'], ['Chequeo de equipo ⚙️', 'Capacidad OK'], ['Revisando permisos', 'Contrato OK ⚖️'],
      ['Sesión de enfoque 🧠', 'Mente lista'],
    ];
    const AUTOS: string[][] = [
      ['AUTO-16', 'AUTO-20'], ['AUTO-01', 'AUTO-12'], [], [], [], ['AUTO-14'],
      ['AUTO-07', 'AUTO-36'], ['AUTO-30', 'AUTO-33'], ['AUTO-21', 'AUTO-24'],
      ['AUTO-26', 'AUTO-12'], ['AUTO-04', 'AUTO-06'], [], [],
    ];
    const CHAT = ['¿Cómo va todo?', '¡Vamos bien!', '¿Viste los tiempos?', 'Buen trabajo 👏', '¿Un café? ☕'];
    const MEET = { gx: 6, gy: 8 };

    const deskTiles: { i: number; j: number }[] = [];
    [{ j: 3, cols: [2, 4, 6, 8, 10] }, { j: 5, cols: [2, 4, 6, 8] }, { j: 7, cols: [2, 4, 6, 8] }]
      .forEach(r => r.cols.forEach(i => deskTiles.push({ i, j: r.j })));
    const stations: Station[] = [
      { i: 2, j: 1, emoji: '🖥️', label: 'Servidor' }, { i: 6, j: 1, emoji: '📋', label: 'Tablero' }, { i: 10, j: 1, emoji: '☕', label: 'Café' },
    ];
    const plants = [{ i: 0.5, j: 8.4, e: '🪴' }, { i: 11.3, j: 8.2, e: '🪴' }, { i: 11.2, j: 2, e: '🌿' }];

    const A: Agent[] = DEFS.map((d, k) => {
      const t = deskTiles[k], gx = t.i + 0.5, gy = t.j + 0.9;
      return {
        code: d.code, emoji: d.emoji, role: d.role, c: d.c,
        skin: SKIN[k % SKIN.length], hair: HAIR[(k * 3) % HAIR.length], outfit: STYLES[k], pants: PANTS[k], glasses: GLASSES[k],
        person: d.person, phrases: PHRASES[k], autos: AUTOS[k], home: { gx, gy }, deskIndex: k,
        gx, gy, tx: gx, ty: gy, state: 'sit', station: null, dir: 1, phase: Math.random() * 6.28, until: 0,
        chatWith: null, group: null, arrived: false, coffee: false, strolls: 0, sayText: '', sayUntil: 0, nextSay: 0, sx: 0, sy: 0,
      };
    });

    const isDark = () => {
      const th = document.documentElement.dataset.theme;
      return th ? th === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
    };

    const SPEED = 1.9;
    const giveTask = (a: Agent) => {
      if (a.state !== 'sit') return;
      const s = stations[Math.floor(Math.random() * stations.length)];
      a.station = s; a.tx = s.i + 0.5 + (Math.random() * 0.5 - 0.25); a.ty = s.j + 0.95; a.state = 'toStation';
    };
    const startChat = () => {
      const idle = A.filter(x => x.state === 'sit'); if (idle.length < 2) return;
      const a = idle[Math.floor(Math.random() * idle.length)]; let b: Agent; do { b = idle[Math.floor(Math.random() * idle.length)]; } while (b === a);
      a.chatWith = b; b.chatWith = a; a.arrived = false; b.arrived = false; a.tx = 5.3; a.ty = 6.2; b.tx = 6.7; b.ty = 6.2; a.state = 'toChat'; b.state = 'toChat';
    };
    const startMeeting = () => {
      const idle = A.filter(x => x.state === 'sit'); if (idle.length < 4) return;
      const n = 3 + Math.floor(Math.random() * 2), pool = idle.slice(), members: Agent[] = [];
      for (let i = 0; i < n && pool.length; i++) members.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
      const g: Group = { members, started: false, until: 0 };
      const seats = [{ gx: MEET.gx - 1.2, gy: MEET.gy }, { gx: MEET.gx + 1.2, gy: MEET.gy }, { gx: MEET.gx, gy: MEET.gy - 0.95 }, { gx: MEET.gx, gy: MEET.gy + 1.05 }];
      members.forEach((m, i) => { m.group = g; m.arrived = false; m.tx = seats[i].gx; m.ty = seats[i].gy; m.state = 'toMeeting'; });
    };
    const pickStroll = (a: Agent) => { a.tx = 2 + Math.random() * 8; a.ty = 3 + Math.random() * 4.5; };
    const startCoffee = () => {
      const idle = A.filter(x => x.state === 'sit'); if (!idle.length) return;
      const a = idle[Math.floor(Math.random() * idle.length)], cafe = stations[2]; a.tx = cafe.i + 0.5; a.ty = cafe.j + 0.95; a.state = 'toCoffee';
    };

    const moveToward = (a: Agent, dt: number) => {
      const dx = a.tx - a.gx, dy = a.ty - a.gy, d = Math.hypot(dx, dy);
      if (d < 0.03) { a.gx = a.tx; a.gy = a.ty; return true; }
      const st = Math.min(d, SPEED * dt); a.gx += dx / d * st; a.gy += dy / d * st; if (Math.abs(dx) > 0.001) a.dir = dx > 0 ? 1 : -1; return false;
    };

    const update = (dt: number, t: number) => {
      let working = 0, chatting = 0, meeting = 0, coffee = 0;
      // reflejar actividad real: agentes con código activo se ponen a trabajar
      const act = activeRef.current;
      if (act.length) for (const a of A) if (a.state === 'sit' && act.includes(a.code) && Math.random() < 0.5) giveTask(a);
      for (const a of A) {
        if (a.state === 'toStation') { if (moveToward(a, dt)) { a.state = 'atStation'; a.until = t + 2.8 + Math.random() * 3.6; const code = a.autos.length ? a.autos[Math.floor(Math.random() * a.autos.length)] + ' · ' : ''; a.sayText = code + a.phrases[Math.floor(Math.random() * a.phrases.length)]; a.sayUntil = a.until; } }
        else if (a.state === 'atStation') { if (t >= a.until) { a.tx = a.home.gx; a.ty = a.home.gy; a.state = 'toDesk'; } }
        else if (a.state === 'toChat') { if (moveToward(a, dt)) { a.arrived = true; if (a.chatWith && a.chatWith.arrived) { const u = t + 4.5 + Math.random() * 3; a.state = 'chatting'; a.until = u; a.nextSay = t; a.chatWith.state = 'chatting'; a.chatWith.until = u; a.chatWith.nextSay = t + 1.4; } } }
        else if (a.state === 'chatting') { if (a.chatWith) a.dir = a.chatWith.gx >= a.gx ? 1 : -1; if (t >= a.nextSay) { a.sayText = CHAT[Math.floor(Math.random() * CHAT.length)]; a.sayUntil = t + 1.9; a.nextSay = t + 3; } if (t >= a.until) { a.tx = a.home.gx; a.ty = a.home.gy; a.state = 'toDesk'; a.chatWith = null; a.arrived = false; } }
        else if (a.state === 'toMeeting') { if (moveToward(a, dt)) { a.arrived = true; const g = a.group; if (g && !g.started && g.members.every(m => m.arrived)) { g.started = true; g.until = t + 6 + Math.random() * 4; g.members.forEach(m => { m.state = 'meeting'; m.until = g.until; m.nextSay = t + Math.random() * 2.2; }); } } }
        else if (a.state === 'meeting') { a.dir = MEET.gx >= a.gx ? 1 : -1; if (t >= a.nextSay) { a.sayText = CHAT[Math.floor(Math.random() * CHAT.length)]; a.sayUntil = t + 2; a.nextSay = t + 3 + Math.random() * 2.5; } if (t >= a.until) { a.tx = a.home.gx; a.ty = a.home.gy; a.state = 'toDesk'; a.group = null; a.arrived = false; } }
        else if (a.state === 'toCoffee') { if (moveToward(a, dt)) { a.coffee = true; a.state = 'coffeeStroll'; a.strolls = 2 + Math.floor(Math.random() * 2); a.sayText = '☕'; a.sayUntil = t + 2; pickStroll(a); } }
        else if (a.state === 'coffeeStroll') { if (moveToward(a, dt)) { a.strolls--; if (a.strolls > 0) pickStroll(a); else { a.tx = a.home.gx; a.ty = a.home.gy; a.state = 'toDesk'; } } }
        else if (a.state === 'toDesk') { if (moveToward(a, dt)) { a.state = 'sit'; a.dir = 1; a.coffee = false; } }
        if (a.state === 'atStation') working++; else if (a.state === 'chatting') chatting++; else if (a.state === 'meeting') meeting++; else if (a.state === 'coffeeStroll' || a.state === 'toCoffee') coffee++;
      }
      const parts: string[] = [];
      if (working) parts.push(`${working} trabajando`); if (meeting) parts.push(`${meeting} en reunión`); if (chatting) parts.push(`${chatting} charlando`); if (coffee) parts.push(`${coffee} en café`);
      live.textContent = parts.length ? parts.join(' · ') : '13 en la oficina';
    };

    // ── helpers de dibujo ──
    const poly = (pts: { x: number; y: number }[], fill?: string, stroke?: string, lw?: number) => {
      ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.closePath();
      if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 1; ctx.stroke(); }
    };
    const rr = (x: number, y: number, w: number, h: number, r: number) => { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); };
    const cap = (x1: number, y1: number, x2: number, y2: number, w: number, color: string) => { ctx.strokeStyle = color; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); };
    const dot = (x: number, y: number, r: number, color: string) => { ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.fill(); };
    const shade = (hex: string, f: number) => { const n = parseInt(hex.slice(1), 16); let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255; const to = f < 0 ? 0 : 255, tt = Math.abs(f); r = Math.round(r + (to - r) * tt); g = Math.round(g + (to - g) * tt); b = Math.round(b + (to - b) * tt); return `rgb(${r},${g},${b})`; };
    const bubble = (X: number, y: number, text: string, dark: boolean) => {
      ctx.font = '600 10px ui-sans-serif,system-ui,sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const w = Math.max(30, ctx.measureText(text).width + 14), h = 17;
      ctx.fillStyle = dark ? '#e7ecf3' : '#ffffff'; ctx.strokeStyle = dark ? 'rgba(0,0,0,.25)' : 'rgba(15,23,42,.14)'; ctx.lineWidth = 1;
      rr(X - w / 2, y - h, w, h, 8); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(X - 4, y - 1.5); ctx.lineTo(X, y + 3.5); ctx.lineTo(X + 4, y - 1.5); ctx.closePath(); ctx.fillStyle = dark ? '#e7ecf3' : '#ffffff'; ctx.fill();
      ctx.fillStyle = '#0f172a'; ctx.fillText(text, X, y - h / 2 - 1);
    };

    const drawWalls = (dark: boolean) => {
      const wallR = dark ? '#141d2e' : '#dfe5ee', wallL = dark ? '#0f1626' : '#d3dae6';
      const b0 = w2s(0, 0), b1 = w2s(COLS, 0); poly([b0, b1, { x: b1.x, y: b1.y - WALL }, { x: b0.x, y: b0.y - WALL }], wallR);
      const sky = dark ? '#24406b' : '#bfe0ff';
      [[2.4, 4], [6.4, 8], [9.4, 11]].forEach(s => { const p0 = w2s(s[0], 0), p1 = w2s(s[1], 0); poly([{ x: p0.x, y: p0.y - WALL + 20 }, { x: p1.x, y: p1.y - WALL + 20 }, { x: p1.x, y: p1.y - 44 }, { x: p0.x, y: p0.y - 44 }], sky, dark ? '#0b1120' : '#fff', 2); });
      const l0 = w2s(0, 0), l1 = w2s(0, ROWS); poly([l0, l1, { x: l1.x, y: l1.y - WALL }, { x: l0.x, y: l0.y - WALL }], wallL);
      poly([b0, b1, { x: b1.x, y: b1.y - 8 }, { x: b0.x, y: b0.y - 8 }], dark ? '#0b1120' : '#c7cfdc');
      poly([l0, l1, { x: l1.x, y: l1.y - 8 }, { x: l0.x, y: l0.y - 8 }], dark ? '#080e1a' : '#bcc5d3');
      // reloj de pared con la hora real
      const base = w2s(8.5, 0), cx = base.x, cy = base.y - WALL + 38, r = 14;
      ctx.fillStyle = dark ? '#0b1120' : '#fff'; ctx.strokeStyle = dark ? '#2a3a55' : '#c2ccdb'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 6.2832); ctx.fill(); ctx.stroke();
      const now = new Date(), h12 = now.getHours() % 12, mm = now.getMinutes();
      const ha = ((h12 + mm / 60) / 12) * 6.2832 - Math.PI / 2, ma = (mm / 60) * 6.2832 - Math.PI / 2;
      ctx.strokeStyle = dark ? '#cbd5e1' : '#334155'; ctx.lineCap = 'round';
      ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(ha) * r * 0.5, cy + Math.sin(ha) * r * 0.5); ctx.stroke();
      ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(ma) * r * 0.82, cy + Math.sin(ma) * r * 0.82); ctx.stroke();
    };
    const drawFloor = (dark: boolean) => {
      const a = dark ? '#0e1626' : '#e7ecf4', b = dark ? '#0c1322' : '#dfe5ef';
      for (let i = 0; i < COLS; i++) for (let j = 0; j < ROWS; j++) poly([w2s(i, j), w2s(i + 1, j), w2s(i + 1, j + 1), w2s(i, j + 1)], (i + j) % 2 ? a : b);
      poly([w2s(1.6, 2.4), w2s(9.4, 2.4), w2s(9.4, 8), w2s(1.6, 8)], dark ? 'rgba(249,115,22,.06)' : 'rgba(249,115,22,.07)');
    };
    const drawTable = (dark: boolean) => {
      const p = w2s(MEET.gx, MEET.gy, 0);
      ctx.fillStyle = dark ? 'rgba(0,0,0,.25)' : 'rgba(15,23,42,.08)'; ctx.beginPath(); ctx.ellipse(p.x, p.y + 5, 36, 17, 0, 0, 6.2832); ctx.fill();
      ctx.fillStyle = dark ? '#22304a' : '#e4e9f2'; ctx.beginPath(); ctx.ellipse(p.x, p.y - 6, 36, 17, 0, 0, 6.2832); ctx.fill();
      ctx.strokeStyle = dark ? '#0b1120' : '#c7cfdc'; ctx.lineWidth = 1; ctx.stroke();
      ctx.font = '13px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('📊', p.x, p.y - 7);
    };
    const drawDesk = (di: number, dark: boolean) => {
      const d = deskTiles[di], owner = A[di], occ = owner && owner.state === 'sit';
      const f0 = w2s(d.i + 0.05, d.j + 0.85, 0), f1 = w2s(d.i + 0.95, d.j + 0.85, 0);
      poly([f0, f1, { x: f1.x, y: f1.y - 34 }, { x: f0.x, y: f0.y - 34 }], dark ? '#141f31' : '#c9d2df');
      poly([w2s(d.i + 0.05, d.j + 0.15, 34), w2s(d.i + 0.95, d.j + 0.15, 34), w2s(d.i + 0.95, d.j + 0.85, 34), w2s(d.i + 0.05, d.j + 0.85, 34)], dark ? '#1c2942' : '#eef2f8');
      const m = w2s(d.i + 0.5, d.j + 0.25, 34);
      if (occ) { const g = ctx.createRadialGradient(m.x + 15, m.y - 13, 2, m.x + 15, m.y - 13, 26); g.addColorStop(0, 'rgba(255,214,120,.55)'); g.addColorStop(1, 'rgba(255,214,120,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(m.x + 15, m.y - 13, 26, 0, 6.2832); ctx.fill(); }
      ctx.strokeStyle = dark ? '#2a3852' : '#8a97ab'; ctx.lineWidth = 1.6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(m.x + 15, m.y - 2); ctx.lineTo(m.x + 15, m.y - 12); ctx.lineTo(m.x + 9, m.y - 16); ctx.stroke();
      ctx.fillStyle = occ ? '#ffd66e' : (dark ? '#33415a' : '#b7c1d1'); ctx.beginPath(); ctx.arc(m.x + 9, m.y - 16, 3, 0, 6.2832); ctx.fill();
      ctx.fillStyle = dark ? '#060b16' : '#334155'; rr(m.x - 13, m.y - 30, 26, 18, 3); ctx.fill();
      ctx.fillStyle = occ ? (dark ? 'rgba(125,195,255,.9)' : 'rgba(120,180,255,1)') : (dark ? 'rgba(96,165,250,.22)' : 'rgba(150,200,255,.5)'); rr(m.x - 10, m.y - 27, 20, 12, 2); ctx.fill();
      const c = w2s(d.i + 0.5, d.j + 0.95, 0); ctx.font = '9px ui-monospace,Menlo,monospace'; ctx.fillStyle = dark ? '#43526c' : '#9aa6b6'; ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText(owner.code, c.x, c.y + 2);
    };
    const drawStation = (s: Station, dark: boolean) => {
      const p = w2s(s.i + 0.5, s.j + 0.5, 0);
      ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.3)'; ctx.shadowBlur = 10; ctx.shadowOffsetY = 4; ctx.fillStyle = dark ? '#1a2740' : '#fff'; rr(p.x - 26, p.y - 58, 52, 52, 10); ctx.fill(); ctx.restore();
      ctx.font = '26px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(s.emoji, p.x, p.y - 34);
      ctx.font = '600 11px ui-sans-serif,system-ui,sans-serif'; ctx.fillStyle = dark ? '#93a1b5' : '#5a677b'; ctx.fillText(s.label, p.x, p.y - 14);
    };
    const drawHuman = (a: Agent, t: number, dark: boolean) => {
      const walking = a.state === 'toStation' || a.state === 'toDesk' || a.state === 'toChat' || a.state === 'toMeeting' || a.state === 'toCoffee' || a.state === 'coffeeStroll';
      const working = a.state === 'atStation', sitting = a.state === 'sit';
      const p = w2s(a.gx, a.gy, 0);
      const bob = (walking && !reduce) ? Math.abs(Math.sin(t * 8 + a.phase)) * 3 : 0;
      const X = p.x, Y = p.y - bob;
      const legSwing = (walking && !reduce) ? Math.sin(t * 8 + a.phase) * 4 : 0;
      const typeWob = ((working || sitting) && !reduce) ? Math.sin(t * 11 + a.phase) * 1.6 : 0;
      const pants = a.pants, hands = a.skin;
      ctx.fillStyle = 'rgba(0,0,0,.20)'; ctx.beginPath(); ctx.ellipse(X, p.y, 12, 5, 0, 0, 6.2832); ctx.fill();
      if (sitting) { ctx.fillStyle = dark ? '#0c1424' : '#aeb8c7'; rr(X - 9, Y - 30, 18, 15, 4); ctx.fill(); cap(X, Y - 14, X, Y - 2, 4, dark ? '#0c1424' : '#aeb8c7'); }
      if (working && !reduce) { const pr = 24 + Math.sin(t * 4) * 4; const g = ctx.createRadialGradient(X, Y - 22, 4, X, Y - 22, pr); g.addColorStop(0, a.c + '55'); g.addColorStop(1, a.c + '00'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(X, Y - 22, pr, 0, 6.2832); ctx.fill(); }
      ctx.save(); ctx.translate(X, Y); ctx.scale(a.dir, 1);
      if (sitting) { cap(-4, -15, -4, -3, 6, pants); cap(4, -15, 4, -3, 6, pants); dot(-4, -2.5, 2.4, '#20242c'); dot(4, -2.5, 2.4, '#20242c'); }
      else { cap(-3, -14, -3 - legSwing, 0, 6, pants); cap(3, -14, 3 + legSwing, 0, 6, pants); dot(-3 - legSwing, 0, 2.4, '#20242c'); dot(3 + legSwing, 0, 2.4, '#20242c'); }
      cap(0, -15, 0, -30, 15, a.c);
      const shY = -28;
      if (working || sitting) { const hy = -20 + typeWob; cap(-6, shY, -8, hy, 5, a.c); cap(6, shY, 8, hy, 5, a.c); dot(-8, hy, 2.4, hands); dot(8, hy, 2.4, hands); }
      else if (walking) { cap(-6, shY, -6 - legSwing, -16, 5, a.c); cap(6, shY, 6 + legSwing, -16, 5, a.c); dot(-6 - legSwing, -16, 2.4, hands); dot(6 + legSwing, -16, 2.4, hands); }
      else { cap(-6, shY, -8, -16, 5, a.c); cap(6, shY, 8, -16, 5, a.c); dot(-8, -16, 2.4, hands); dot(8, -16, 2.4, hands); }
      const dk = shade(a.c, -0.34), ltc = shade(a.c, 0.4);
      if (a.outfit === 'polo') { poly([{ x: -3, y: -30 }, { x: -1, y: -30 }, { x: -2, y: -26 }], dk); poly([{ x: 3, y: -30 }, { x: 1, y: -30 }, { x: 2, y: -26 }], dk); cap(0, -29, 0, -22, 1.3, dk); dot(0, -25, 0.8, dk); }
      else if (a.outfit === 'blazer') { poly([{ x: -7, y: -30 }, { x: -1, y: -29 }, { x: -3, y: -19 }], dk); poly([{ x: 7, y: -30 }, { x: 1, y: -29 }, { x: 3, y: -19 }], dk); cap(0, -30, 0, -20, 2.2, '#b23a4b'); }
      else if (a.outfit === 'hoodie') { ctx.fillStyle = dk; ctx.beginPath(); ctx.ellipse(0, -30, 8, 3.4, 0, Math.PI, 0); ctx.fill(); cap(-5, -21, 5, -21, 3, dk); cap(-1.6, -29, -1.6, -24, 1, ltc); cap(1.6, -29, 1.6, -24, 1, ltc); }
      else if (a.outfit === 'vest') { cap(0, -16, 0, -29, 10, dk); dot(0, -26, 0.8, ltc); dot(0, -22, 0.8, ltc); }
      else if (a.outfit === 'jacket') { cap(0, -30, 0, -15, 1.2, ltc); poly([{ x: -6, y: -30 }, { x: -1, y: -29 }, { x: -3, y: -26 }], dk); poly([{ x: 6, y: -30 }, { x: 1, y: -29 }, { x: 3, y: -26 }], dk); }
      else { ctx.strokeStyle = dk; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(0, -30, 3, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke(); }
      cap(0, -30, 0, -33, 6, a.skin); dot(0, -40, 7.4, a.skin);
      ctx.fillStyle = a.hair; ctx.beginPath(); ctx.arc(0, -40, 7.9, Math.PI * 1.04, Math.PI * 2 - 0.04); ctx.fill(); ctx.fillRect(-7.7, -41, 15.4, 3);
      const blink = !reduce && (((t + a.phase * 1.7) % 4) < 0.12);
      if (blink) { cap(-3, -39.4, -1.6, -39.4, 1.4, '#20222b'); cap(1.6, -39.4, 3, -39.4, 1.4, '#20222b'); }
      else { dot(-2.6, -39.6, 0.95, '#20222b'); dot(2.6, -39.6, 0.95, '#20222b'); }
      ctx.strokeStyle = '#9c5b46'; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.arc(0, -37, 2, 0.12 * Math.PI, 0.88 * Math.PI); ctx.stroke();
      if (a.glasses) { ctx.strokeStyle = '#2b2f38'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(-2.6, -39.6, 2.1, 0, 6.2832); ctx.moveTo(4.7, -39.6); ctx.arc(2.6, -39.6, 2.1, 0, 6.2832); ctx.stroke(); cap(-0.6, -39.6, 0.6, -39.6, 1, '#2b2f38'); }
      ctx.restore();
      ctx.fillStyle = dark ? '#0f1522' : '#ffffff'; ctx.strokeStyle = a.c; ctx.lineWidth = 1.5; rr(X - 11, Y - 62, 22, 18, 7); ctx.fill(); ctx.stroke();
      ctx.font = '12px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(a.emoji, X, Y - 53);
      if (working) { const r = 7, cx = X + 13, cy = Y - 53; ctx.strokeStyle = 'rgba(16,185,129,.3)'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 6.2832); ctx.stroke(); ctx.strokeStyle = '#10b981'; const a0 = reduce ? 0 : t * 6; ctx.beginPath(); ctx.arc(cx, cy, r, a0, a0 + 1.7); ctx.stroke(); }
      if (a.coffee) { const hx = X + 9 * a.dir, hy = Y - 16; ctx.fillStyle = dark ? '#e7ecf3' : '#ffffff'; rr(hx - 3, hy - 3, 6, 6, 1.5); ctx.fill(); ctx.strokeStyle = '#9a6a3a'; ctx.lineWidth = 1; ctx.stroke(); ctx.fillStyle = '#6f4a26'; rr(hx - 3, hy - 3, 6, 2, 1); ctx.fill(); }
      ctx.font = '700 9px ui-sans-serif,system-ui,sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const nw = Math.max(26, ctx.measureText(a.person).width + 10);
      ctx.fillStyle = dark ? 'rgba(12,18,30,.9)' : 'rgba(255,255,255,.94)'; ctx.strokeStyle = a.c; ctx.lineWidth = 1; rr(X - nw / 2, p.y + 6, nw, 13, 6); ctx.fill(); ctx.stroke();
      ctx.fillStyle = dark ? '#dbe4f0' : '#243244'; ctx.fillText(a.person, X, p.y + 12.7);
      if (a.sayText && t < a.sayUntil) bubble(X, Y - 64, a.sayText, dark);
      a.sx = X; a.sy = Y - 30;
    };

    let last = performance.now() / 1000, raf = 0;
    const frame = (now: number) => {
      const t = now / 1000, dt = Math.min(0.05, t - last); last = t; const dark = isDark();
      if (!pausedLocal) update(dt, t);
      ctx.clearRect(0, 0, W, H); drawWalls(dark); drawFloor(dark);
      const ents: { key: number; draw: () => void }[] = [];
      ents.push({ key: MEET.gx + MEET.gy - 0.25, draw: () => drawTable(dark) });
      deskTiles.forEach((d, di) => ents.push({ key: (d.i + 0.5) + (d.j + 0.5) - 0.15, draw: () => drawDesk(di, dark) }));
      stations.forEach(s => ents.push({ key: (s.i + 0.5) + (s.j + 0.5) - 0.15, draw: () => drawStation(s, dark) }));
      plants.forEach(pl => ents.push({ key: pl.i + pl.j, draw: () => { const p = w2s(pl.i, pl.j, 0); ctx.font = '24px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.fillText(pl.e, p.x, p.y); } }));
      A.forEach(a => ents.push({ key: a.gx + a.gy, draw: () => drawHuman(a, t, dark) }));
      ents.sort((p, q) => p.key - q.key).forEach(e => e.draw());
      raf = requestAnimationFrame(frame);
    };

    const autoTimer = { id: 0 as ReturnType<typeof setTimeout> | 0 };
    const autoLoop = () => {
      if (!pausedLocal) {
        const idle = A.filter(a => a.state === 'sit'), r = Math.random();
        if (r < 0.14 && idle.length >= 6) startMeeting();
        else if (r < 0.34 && idle.length >= 5) startChat();
        else if (r < 0.46 && idle.length >= 3) startCoffee();
        else if (idle.length > (reduce ? 9 : 6)) giveTask(idle[Math.floor(Math.random() * idle.length)]);
      }
      autoTimer.id = setTimeout(autoLoop, 1200 + Math.random() * 1800);
    };

    // ── interacción: cámara (drag) + tooltip ──
    let scale = 1;
    let drag: { x: number; y: number; px: number; py: number } | null = null;
    stage.style.cursor = 'grab';
    const onDown = (e: PointerEvent) => { drag = { x: e.clientX, y: e.clientY, px: panX, py: panY }; stage.style.cursor = 'grabbing'; tip.style.opacity = '0'; try { stage.setPointerCapture(e.pointerId); } catch { /* noop */ } };
    const endDrag = () => { if (drag) { drag = null; stage.style.cursor = 'grab'; } };
    const onMove = (e: PointerEvent) => {
      if (drag) { panX = Math.max(-190, Math.min(190, drag.px + (e.clientX - drag.x) / scale)); panY = Math.max(-120, Math.min(150, drag.py + (e.clientY - drag.y) / scale)); return; }
      const r = cv.getBoundingClientRect(), mx = (e.clientX - r.left) / scale, my = (e.clientY - r.top) / scale;
      let hit: Agent | null = null, best = 30 * 30;
      for (const a of A) { const dx = a.sx - mx, dy = a.sy - my, d = dx * dx + dy * dy; if (d < best) { best = d; hit = a; } }
      if (hit) {
        tip.style.left = (hit.sx * scale) + 'px'; tip.style.top = ((hit.sy - 34) * scale) + 'px';
        const st = hit.state === 'atStation' ? 'Trabajando en ' + (hit.station ? hit.station.label : '')
          : hit.state === 'chatting' ? 'Charlando' : hit.state === 'meeting' ? 'En reunión'
            : (hit.state === 'toCoffee' || hit.state === 'coffeeStroll') ? 'Café ☕'
              : hit.state === 'sit' ? 'En su escritorio' : 'Caminando…';
        tip.innerHTML = hit.person + '<small>' + hit.role + ' · ' + hit.code + ' · ' + st + '</small>'; tip.style.opacity = '1';
      } else tip.style.opacity = '0';
    };
    const onLeave = () => { tip.style.opacity = '0'; endDrag(); };
    stage.addEventListener('pointerdown', onDown); stage.addEventListener('pointerup', endDrag);
    stage.addEventListener('pointermove', onMove); stage.addEventListener('pointerleave', onLeave);

    const resize = () => { const w = stage.clientWidth; scale = w / W; const dpr = Math.min(2, window.devicePixelRatio || 1); cv.width = Math.round(W * scale * dpr); cv.height = Math.round(H * scale * dpr); cv.style.height = (H * scale) + 'px'; ctx.setTransform(scale * dpr, 0, 0, scale * dpr, 0, 0); };
    const ro = new ResizeObserver(resize); ro.observe(stage); resize();

    const onTask = () => { const idle = A.filter(a => a.state === 'sit'); if (idle.length) giveTask(idle[Math.floor(Math.random() * idle.length)]); };
    const onPause = () => { pausedLocal = !pausedLocal; setPaused(pausedLocal); };
    taskBtnRef.current?.addEventListener('click', onTask);
    pauseBtnRef.current?.addEventListener('click', onPause);

    if (!reduce) { setTimeout(() => giveTask(A[1]), 500); setTimeout(() => giveTask(A[6]), 1100); setTimeout(() => giveTask(A[10]), 1700); }
    autoLoop(); raf = requestAnimationFrame(frame);

    const tBtn = taskBtnRef.current, pBtn = pauseBtnRef.current;
    return () => {
      cancelAnimationFrame(raf); if (autoTimer.id) clearTimeout(autoTimer.id); ro.disconnect();
      stage.removeEventListener('pointerdown', onDown); stage.removeEventListener('pointerup', endDrag);
      stage.removeEventListener('pointermove', onMove); stage.removeEventListener('pointerleave', onLeave);
      tBtn?.removeEventListener('click', onTask); pBtn?.removeEventListener('click', onPause);
    };
  }, []);

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card px-4 py-2.5 text-sm">
        <span className="inline-flex items-center gap-2 font-semibold">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span ref={liveRef}>13 en la oficina</span>
        </span>
        <span className="ml-auto flex gap-2">
          <button ref={pauseBtnRef} type="button" className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold hover:-translate-y-0.5 transition-transform">
            {paused ? 'Reanudar' : 'Pausar'}
          </button>
          <button ref={taskBtnRef} type="button" className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:-translate-y-0.5 transition-transform">
            Dar una tarea
          </button>
        </span>
      </div>
      <div ref={stageRef} className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <canvas ref={canvasRef} className="block w-full" />
        <div ref={tipRef} className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg bg-foreground px-2.5 py-1.5 text-xs font-semibold text-background opacity-0 shadow-lg transition-opacity [&>small]:mt-0.5 [&>small]:block [&>small]:font-normal [&>small]:opacity-70" />
      </div>
      <p className="text-center text-xs text-muted-foreground">
        🖱️ Arrastra para mover la cámara · las luces se encienden en los puestos ocupados · las burbujas muestran la automatización (AUTO-XX).
      </p>
    </div>
  );
}
