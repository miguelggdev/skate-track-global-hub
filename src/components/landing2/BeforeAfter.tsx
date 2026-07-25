import { motion } from 'framer-motion';

const rows = [
  { task: 'Gestión de pagos y cobros', before: 'Excel, llamadas, recordatorios manuales', after: 'Automático — el sistema detecta y cobra' },
  { task: 'Comunicación con padres', before: 'WhatsApp 24/7, preguntas repetidas', after: 'Notificaciones automáticas en la app' },
  { task: 'Publicar resultados', before: '3 días de trabajo manual', after: '20 minutos — subes y el sistema asigna' },
  { task: 'Calendario de entrenamientos', before: 'PDF, WhatsApp, llamadas', after: 'Todos lo ven en tiempo real en la app' },
  { task: 'Reportes mensuales', before: '3-4 horas armando tablas', after: 'Se generan solos el último día del mes' },
  { task: 'Estado financiero del club', before: 'Hojas de Excel con fórmulas rotas', after: 'Dashboard en vivo, siempre actualizado' },
  { task: 'Historial de cada atleta', before: 'Papeles, carpetas, datos dispersos', after: 'Todo en un perfil completo y buscable' },
  { task: 'Responder dudas del asistente', before: 'Tú, siempre disponible, siempre', after: 'El asistente IA responde 24/7 en segundos' },
];

export default function BeforeAfter() {
  return (
    <section className="relative py-24 bg-[#06080f] overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_30%_at_50%_50%,rgba(16,185,129,0.04),transparent)]" />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ duration: 0.6 }} className="text-center mb-14 space-y-4">
          <span className="text-emerald-400 text-sm font-bold uppercase tracking-widest">La diferencia es brutal</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white">
            Antes vs{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-300">Después</span>
          </h2>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            Esta es la diferencia real entre gestionar con SpeedSkateTrack y seguir haciendo todo a mano.
          </p>
        </motion.div>

        {/* Table */}
        <div className="rounded-2xl overflow-hidden border border-white/10">
          {/* Header */}
          <div className="grid grid-cols-3 bg-white/8">
            <div className="p-4 text-slate-400 text-xs font-bold uppercase tracking-widest">Tarea</div>
            <div className="p-4 text-red-400 text-xs font-bold uppercase tracking-widest border-l border-white/6 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500" /> Sin SpeedSkateTrack
            </div>
            <div className="p-4 text-emerald-400 text-xs font-bold uppercase tracking-widest border-l border-white/6 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Con SpeedSkateTrack
            </div>
          </div>

          {rows.map((row, i) => (
            <motion.div key={row.task}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06, duration: 0.4 }}
              className={`grid grid-cols-3 border-t border-white/6 ${i % 2 === 0 ? 'bg-transparent' : 'bg-white/2'}`}
            >
              <div className="p-4 text-slate-300 text-sm font-semibold">{row.task}</div>
              <div className="p-4 border-l border-white/6">
                <span className="text-red-400 text-sm">❌ {row.before}</span>
              </div>
              <div className="p-4 border-l border-white/6">
                <span className="text-emerald-400 text-sm font-medium">✅ {row.after}</span>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-10 text-center">
          <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
            onClick={() => document.querySelector('#cta')?.scrollIntoView({ behavior: 'smooth' })}
            className="px-10 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-cyan-600 text-white font-black text-base shadow-xl shadow-emerald-500/30">
            Quiero el "después" para mi club →
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}
