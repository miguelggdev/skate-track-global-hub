import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const automations = [
  {
    icon: '📱',
    trigger: 'Un padre envía un WhatsApp con una duda',
    result: 'El sistema le responde automáticamente con la información exacta — horario, próxima competencia, estado de pago.',
    saved: '2-3 minutos por mensaje',
    color: 'from-blue-500 to-cyan-400',
  },
  {
    icon: '💰',
    trigger: 'Llega la fecha de pago de un atleta',
    result: 'El sistema envía un recordatorio amable 5 días antes, otro el día del vencimiento, y otro si ya está en mora. Tú no haces nada.',
    saved: '30 min por atleta/mes',
    color: 'from-emerald-500 to-teal-400',
  },
  {
    icon: '🏆',
    trigger: 'Termina una competencia',
    result: 'Subes el archivo de resultados y el sistema lo publica para cada atleta, actualiza su historial y notifica a los padres.',
    saved: '4 horas por competencia',
    color: 'from-orange-500 to-amber-400',
  },
  {
    icon: '📅',
    trigger: 'Comienza la semana',
    result: 'Cada lunes, el sistema envía automáticamente el calendario de entrenamientos de esa semana a todos los atletas y padres.',
    saved: '45 min cada semana',
    color: 'from-violet-500 to-purple-400',
  },
  {
    icon: '📊',
    trigger: 'Termina el mes',
    result: 'El sistema genera el informe completo del mes — asistencia, pagos, competencias, métricas — y te lo envía listo para presentar.',
    saved: '3 horas por mes',
    color: 'from-pink-500 to-rose-400',
  },
];

export default function AutoSimple() {
  const [active, setActive] = useState<number | null>(null);

  return (
    <section className="relative py-24 bg-[#06080f] overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_30%,rgba(249,115,22,0.05),transparent)]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ duration: 0.6 }} className="text-center mb-16 space-y-4">
          <span className="text-orange-400 text-sm font-bold uppercase tracking-widest">Funciona solo</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white">
            Estas cosas pasan{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300">
              sin que hagas nada
            </span>
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Haz clic en cada situación para ver qué hace el sistema — y cuánto tiempo te ahorra.
          </p>
        </motion.div>

        <div className="space-y-4">
          {automations.map((a, i) => (
            <motion.div key={a.trigger}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              className="rounded-2xl border border-white/8 bg-white/4 overflow-hidden cursor-pointer"
              onClick={() => setActive(active === i ? null : i)}
            >
              <div className="flex items-center gap-4 p-5">
                <div className={`w-12 h-12 rounded-xl flex-shrink-0 bg-gradient-to-br ${a.color} flex items-center justify-center text-2xl`}>
                  {a.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-slate-400 text-xs font-semibold uppercase tracking-wide mb-0.5">Situación</div>
                  <div className="text-white font-bold text-base">{a.trigger}</div>
                </div>
                <motion.div animate={{ rotate: active === i ? 90 : 0 }} transition={{ duration: 0.2 }}
                  className="flex-shrink-0 text-slate-400 text-xl">›</motion.div>
              </div>

              <AnimatePresence>
                {active === i && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }}
                    className="overflow-hidden">
                    <div className="px-5 pb-5 pt-0 border-t border-white/6">
                      <div className="flex flex-col sm:flex-row gap-4 pt-4">
                        <div className={`flex-1 p-4 rounded-xl bg-gradient-to-br ${a.color} bg-opacity-5 border border-white/8`}>
                          <div className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-2">✨ Lo que hace el sistema</div>
                          <p className="text-white text-sm leading-relaxed">{a.result}</p>
                        </div>
                        <div className="sm:w-40 p-4 rounded-xl border border-emerald-500/25 bg-emerald-950/20 text-center flex flex-col justify-center">
                          <div className="text-emerald-400 text-xs uppercase tracking-wide font-semibold mb-1">Tiempo ahorrado</div>
                          <div className="text-white font-black text-lg">{a.saved}</div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        {/* Total time saved */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-12 text-center p-6 rounded-2xl border border-orange-500/25 bg-orange-950/15">
          <p className="text-slate-400 text-sm mb-2">Solo con estas 5 automatizaciones, el sistema te ahorra</p>
          <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300">+95 horas/mes</div>
          <p className="text-slate-400 text-sm mt-2">Y hay más de <span className="text-white font-bold">35 automatizaciones</span> funcionando en segundo plano.</p>
        </motion.div>
      </div>
    </section>
  );
}
