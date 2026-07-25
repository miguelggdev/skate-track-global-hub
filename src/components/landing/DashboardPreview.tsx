import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const tabs = [
  { label: 'Admin', role: 'Administrador', emoji: '🏟️' },
  { label: 'Coach', role: 'Entrenador', emoji: '⛸️' },
  { label: 'Atleta', role: 'Deportista', emoji: '🥇' },
  { label: 'Finanzas', role: 'Gestor Financiero', emoji: '💰' },
];

const dashboards = [
  // Admin
  <div className="p-5 space-y-4">
    <div className="grid grid-cols-4 gap-3">
      {[
        { label: 'Atletas', v: '142', i: '👥', g: 'from-blue-500 to-cyan-400', t: '+8 este mes' },
        { label: 'Asistencia', v: '91%', i: '✅', g: 'from-emerald-500 to-teal-400', t: '↑ 3%' },
        { label: 'Ingresos', v: '$48K', i: '💰', g: 'from-amber-500 to-orange-400', t: '78% meta' },
        { label: 'Medallas', v: '38', i: '🏅', g: 'from-purple-500 to-violet-400', t: 'Temporada 2026' },
      ].map((k) => (
        <div key={k.label} className="rounded-xl bg-white/5 border border-white/8 p-3">
          <div className="flex items-center justify-between mb-1"><span className="text-lg">{k.i}</span><span className="text-slate-600 text-[9px]">{k.t}</span></div>
          <div className={`text-xl font-black text-transparent bg-clip-text bg-gradient-to-r ${k.g}`}>{k.v}</div>
          <div className="text-slate-500 text-[10px] mt-0.5">{k.label}</div>
        </div>
      ))}
    </div>
    <div className="grid grid-cols-3 gap-3">
      <div className="col-span-2 rounded-xl bg-white/5 border border-white/8 p-3 h-24 flex items-end gap-1">
        {[30,55,40,70,50,90,65,80,72,95,88,100].map((h, i) => (
          <div key={i} style={{ height: `${h}%` }} className={`flex-1 rounded-t-sm ${i === 11 ? 'bg-gradient-to-t from-blue-600 to-cyan-400' : 'bg-blue-600/25'}`} />
        ))}
      </div>
      <div className="rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 p-3">
        <div className="text-[10px] text-blue-400 font-semibold mb-1">🤖 Agente Admin</div>
        <div className="text-slate-300 text-[10px] leading-relaxed">8 pagos vencidos • 3 sesiones hoy • Competencia en 5 días</div>
      </div>
    </div>
    <div className="rounded-xl bg-white/5 border border-white/8 p-3">
      <div className="text-slate-400 text-[10px] font-semibold mb-2">ALERTAS ACTIVAS</div>
      <div className="space-y-1.5">
        {[{c:'orange',t:'Juan P. — 3 inasistencias consecutivas'},{c:'red',t:'Pago Carlos G. — 45 días vencido'},{c:'blue',t:'Evaluación médica: 5 atletas pendientes'}].map((a,i)=>(
          <div key={i} className="flex items-center gap-2"><div className={`w-1.5 h-1.5 rounded-full bg-${a.c}-400 flex-shrink-0`}/><span className="text-slate-300 text-[10px]">{a.t}</span></div>
        ))}
      </div>
    </div>
  </div>,
  // Coach
  <div className="p-5 space-y-4">
    <div className="grid grid-cols-4 gap-3">
      {[{l:'Sesiones Hoy',v:'3',i:'📅'},{l:'Mis Atletas',v:'24',i:'👟'},{l:'Asistencia',v:'87%',i:'📊'},{l:'Evaluaciones',v:'5 pend.',i:'🎯'}].map(k=>(
        <div key={k.l} className="rounded-xl bg-white/5 border border-white/8 p-3"><div className="text-xl mb-1">{k.i}</div><div className="text-white font-bold text-base">{k.v}</div><div className="text-slate-500 text-[10px]">{k.l}</div></div>
      ))}
    </div>
    <div className="rounded-xl bg-white/5 border border-white/8 p-3">
      <div className="text-slate-400 text-[10px] font-semibold mb-2">ENTRENAMIENTOS HOY</div>
      <div className="space-y-2">
        {[{t:'16:00',n:'Técnica',a:12,c:'cyan'},{t:'17:30',n:'Juvenil Resistencia',a:18,c:'blue'},{t:'18:30',n:'Avanzado Sprint',a:8,c:'purple'}].map(s=>(
          <div key={s.t} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2">
            <div className="flex items-center gap-2"><span className={`w-2 h-2 rounded-full bg-${s.c}-400`}/><span className="text-white text-xs font-medium">{s.t} · {s.n}</span></div>
            <span className="text-slate-400 text-[10px]">{s.a} atletas</span>
          </div>
        ))}
      </div>
    </div>
    <div className="rounded-xl bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 p-3 flex items-start gap-2">
      <span className="text-base">⛸️</span>
      <div className="text-slate-300 text-[10px] leading-relaxed"><span className="text-cyan-400 font-semibold">Entrenador IA: </span>María García mejoró 1.2s en 300m. Semáforo: 18 verde, 4 amarillo, 2 rojo.</div>
    </div>
  </div>,
  // Atleta
  <div className="p-5 space-y-4">
    <div className="flex items-center gap-4 rounded-xl bg-white/5 border border-white/8 p-4">
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-2xl shadow-lg">🛼</div>
      <div>
        <div className="text-white font-bold text-base">Juan Pérez</div>
        <div className="text-slate-400 text-xs">Categoría Juvenil · Nivel Avanzado</div>
        <div className="flex gap-2 mt-1">
          <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-medium">🏅 5 medallas</span>
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-medium">📅 92% asistencia</span>
        </div>
      </div>
    </div>
    <div className="grid grid-cols-3 gap-3">
      {[{l:'Mejor 300m',v:'29.4s',c:'from-blue-500 to-cyan-400'},{l:'Mejor 1000m',v:'1:28.3',c:'from-purple-500 to-violet-400'},{l:'Ranking',v:'#3',c:'from-amber-500 to-orange-400'}].map(k=>(
        <div key={k.l} className="rounded-xl bg-white/5 border border-white/8 p-3 text-center"><div className={`text-lg font-black text-transparent bg-clip-text bg-gradient-to-r ${k.c}`}>{k.v}</div><div className="text-slate-500 text-[9px] mt-0.5">{k.l}</div></div>
      ))}
    </div>
    <div className="rounded-xl bg-white/5 border border-white/8 p-3 h-16 flex items-end gap-1">
      {[60,65,70,68,72,75,74,79,78,82,85,88].map((h,i)=>(
        <div key={i} style={{height:`${h}%`}} className={`flex-1 rounded-t-sm ${i>=9?'bg-gradient-to-t from-blue-600 to-cyan-400':'bg-blue-600/25'}`}/>
      ))}
    </div>
  </div>,
  // Finance
  <div className="p-5 space-y-4">
    <div className="grid grid-cols-2 gap-3">
      {[{l:'Ingresos Mes',v:'$48,230',c:'from-emerald-500 to-teal-400',t:'+20% vs mes ant.'},{l:'Gastos Mes',v:'$23,450',c:'from-rose-500 to-pink-400',t:'-5% vs mes ant.'},{l:'Pendiente Cobro',v:'$8,400',c:'from-amber-500 to-orange-400',t:'12 atletas morosos'},{l:'Meta Cumplida',v:'78%',c:'from-blue-500 to-cyan-400',t:'Meta: $62,000'}].map(k=>(
        <div key={k.l} className="rounded-xl bg-white/5 border border-white/8 p-3">
          <div className={`text-xl font-black text-transparent bg-clip-text bg-gradient-to-r ${k.c} mb-0.5`}>{k.v}</div>
          <div className="text-white text-[11px] font-medium">{k.l}</div>
          <div className="text-slate-500 text-[10px]">{k.t}</div>
        </div>
      ))}
    </div>
    <div className="rounded-xl bg-white/5 border border-white/8 p-3 h-20 flex items-end gap-1">
      {[45,62,38,78,55,90,67,82,71,95,88,100].map((h,i)=>(
        <div key={i} style={{height:`${h}%`}} className={`flex-1 rounded-t-sm ${i>=9?'bg-gradient-to-t from-emerald-600 to-teal-400':'bg-emerald-600/25'}`}/>
      ))}
    </div>
    <div className="rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 p-3 flex items-start gap-2">
      <span className="text-base">💰</span>
      <div className="text-slate-300 text-[10px] leading-relaxed"><span className="text-amber-400 font-semibold">Agente Financiero: </span>Proyección: $51,200 este mes. 3 atletas nuevos en mora. Cierre de caja: $3,240 hoy.</div>
    </div>
  </div>,
];

export default function DashboardPreview() {
  const [active, setActive] = useState(0);

  return (
    <section id="dashboard" className="relative py-24 bg-[#050b18] overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_30%_50%,rgba(59,130,246,0.07),transparent)]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 space-y-4"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/8 text-cyan-300 text-sm font-medium">
            🖥️ Dashboard por Rol
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white">
            Cada rol, su{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-300">
              propio espacio
            </span>
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            6 dashboards especializados. Admin, Entrenador, Atleta, Delegado, Líder y Finanzas. Cada uno con los datos y herramientas que necesita.
          </p>
        </motion.div>

        {/* Browser mockup */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.97 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="relative max-w-4xl mx-auto"
        >
          {/* Glow */}
          <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/15 via-cyan-500/10 to-purple-500/15 rounded-3xl blur-2xl" />

          <div className="relative rounded-2xl border border-white/10 bg-[#0d1117] shadow-2xl shadow-black/60 overflow-hidden">
            {/* Browser top bar */}
            <div className="flex items-center gap-2 px-5 py-3 bg-[#161b22] border-b border-white/5">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <div className="w-3 h-3 rounded-full bg-green-500/60" />
              </div>
              <div className="flex-1 mx-3">
                <div className="bg-[#0d1117] rounded-lg px-3 py-1 text-slate-500 text-xs font-mono flex items-center gap-2">
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2"/></svg>
                  app.skatetrack.io/{tabs[active].label.toLowerCase()}-dashboard
                </div>
              </div>
              {/* Role tabs */}
              <div className="flex gap-1">
                {tabs.map((t, i) => (
                  <button
                    key={t.label}
                    onClick={() => setActive(i)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      active === i
                        ? 'bg-blue-600/80 text-white'
                        : 'text-slate-400 hover:text-white hover:bg-white/8'
                    }`}
                  >
                    <span>{t.emoji}</span>
                    <span className="hidden sm:inline">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Sidebar + content */}
            <div className="flex min-h-[380px]">
              {/* Sidebar */}
              <div className="w-12 sm:w-14 bg-[#0d1117] border-r border-white/5 flex flex-col items-center py-4 gap-3">
                {['🏠','👥','📅','🏆','💰','⚙️'].map((ic, i) => (
                  <div key={i} className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm cursor-pointer ${i === 0 ? 'bg-blue-600/80' : 'hover:bg-white/8'} transition-colors`}>{ic}</div>
                ))}
              </div>

              {/* Main content */}
              <div className="flex-1 bg-[#0a0f1a] overflow-hidden">
                {/* Top header */}
                <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between">
                  <div>
                    <div className="text-white font-semibold text-sm">{tabs[active].role}</div>
                    <div className="text-slate-500 text-[10px]">SkateTrack — Dashboard</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-slate-400 text-[10px]">En línea</span>
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={active}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    {dashboards[active]}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
