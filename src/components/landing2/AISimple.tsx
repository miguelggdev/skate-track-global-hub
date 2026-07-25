import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SpeedSkateIcon from './SpeedSkateIcon';

const conversations = [
  {
    trigger: '¿Cuántos atletas deben cobro este mes?',
    response: 'Tienes 12 atletas con pago pendiente de este mes. El total adeudado es $1.890.000. ¿Quieres que les envíe un recordatorio amable ahora?',
    action: '✅ Enviando recordatorio a 12 atletas...',
  },
  {
    trigger: 'Dame un resumen del club esta semana',
    response: 'Esta semana: 8 entrenamientos con 91% de asistencia, 3 pagos nuevos ($650.000), 1 lesión leve reportada (Juan P.) y la próxima competencia es en 8 días. ¿Necesitas algo más?',
    action: '📊 Resumen listo para compartir',
  },
  {
    trigger: '¿Qué atletas están en riesgo de retirarse?',
    response: 'Detecto 3 atletas con señales de alerta: María G. (4 inasistencias este mes), Carlos R. (2 meses sin pagar) y Ana S. (comunicación nula con el entrenador). ¿Quieres un plan de retención para cada uno?',
    action: '🎯 Generando plan de retención...',
  },
];

const useCases = [
  { emoji: '📅', label: 'Consultar asistencias' },
  { emoji: '💰', label: 'Estado de pagos' },
  { emoji: '🏆', label: 'Resultados de competencias' },
  { emoji: '📋', label: 'Generar reportes' },
  { emoji: '📣', label: 'Enviar comunicados' },
  { emoji: '🔍', label: 'Buscar información de atletas' },
];

export default function AISimple() {
  const [active, setActive] = useState(0);
  const [step, setStep] = useState(0);

  const switchQ = (i: number) => { setActive(i); setStep(0); };

  return (
    <section id="ai" className="relative py-24 bg-[#080c16] overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_70%_50%,rgba(139,92,246,0.06),transparent)]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: explanation */}
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
            transition={{ duration: 0.6 }} className="space-y-8">
            <div className="space-y-4">
              <span className="text-violet-400 text-sm font-bold uppercase tracking-widest">Tu asistente inteligente 24/7</span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight">
                Pregúntale cualquier cosa sobre tu club.{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-pink-300">
                  Te responde en segundos.
                </span>
              </h2>
            </div>

            <p className="text-slate-300 text-lg leading-relaxed">
              SpeedSkateTrack incluye un asistente inteligente que conoce todo tu club: cada atleta, cada pago, cada entrenamiento. Solo le preguntas — en español, como hablarías con una persona — y él actúa.
            </p>

            <div className="space-y-3">
              <p className="text-slate-400 text-sm font-semibold uppercase tracking-wide">¿Qué puede hacer?</p>
              <div className="grid grid-cols-2 gap-3">
                {useCases.map((u) => (
                  <div key={u.label} className="flex items-center gap-2.5 p-3 rounded-xl border border-white/8 bg-white/4">
                    <span className="text-xl">{u.emoji}</span>
                    <span className="text-slate-300 text-sm font-medium">{u.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-xl border border-violet-500/25 bg-violet-950/20">
              <span className="text-2xl">🔒</span>
              <div>
                <div className="text-white font-bold text-sm">Privado y seguro</div>
                <div className="text-slate-400 text-xs">La información de tu club nunca sale de tu cuenta. Cumplimos con todas las normas de protección de datos.</div>
              </div>
            </div>
          </motion.div>

          {/* Right: chat demo */}
          <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}>
            {/* Question selector */}
            <div className="flex flex-col gap-3 mb-6">
              {conversations.map((c, i) => (
                <motion.button key={i} whileHover={{ x: 4 }}
                  onClick={() => switchQ(i)}
                  className={`text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                    active === i ? 'border-violet-500/50 bg-violet-950/30 text-white' : 'border-white/8 bg-white/4 text-slate-400 hover:text-slate-200'
                  }`}>
                  <span className="text-violet-400 mr-2">💬</span>{c.trigger}
                </motion.button>
              ))}
            </div>

            {/* Chat window */}
            <div className="rounded-2xl border border-white/10 bg-[#0d1117] overflow-hidden shadow-2xl shadow-black/40">
              {/* Header */}
              <div className="flex items-center gap-3 px-5 py-4 bg-white/5 border-b border-white/6">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center">
                  <SpeedSkateIcon size={22} primaryColor="#93C5FD" secondaryColor="#C4B5FD" wheelColor="#FCD34D" />
                </div>
                <div>
                  <div className="text-white font-bold text-sm">Asistente SpeedSkateTrack</div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-slate-400 text-xs">En línea — listo para ayudarte</span>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="p-5 space-y-4 min-h-[200px]">
                <AnimatePresence mode="wait">
                  <motion.div key={active} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                    {/* User message */}
                    <div className="flex justify-end">
                      <div className="max-w-[80%] bg-blue-600/80 text-white text-sm px-4 py-3 rounded-2xl rounded-tr-sm leading-relaxed">
                        {conversations[active].trigger}
                      </div>
                    </div>

                    {/* Agent response */}
                    {step >= 1 && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center flex-shrink-0">
                          <SpeedSkateIcon size={18} primaryColor="#C4B5FD" secondaryColor="#E0E7FF" wheelColor="#FCD34D" />
                        </div>
                        <div className="max-w-[80%] bg-white/8 border border-white/10 text-slate-200 text-sm px-4 py-3 rounded-2xl rounded-tl-sm leading-relaxed">
                          {conversations[active].response}
                        </div>
                      </motion.div>
                    )}

                    {/* Action confirmation */}
                    {step >= 2 && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        className="text-center text-emerald-400 text-xs font-semibold py-2 bg-emerald-950/30 rounded-xl border border-emerald-500/20">
                        {conversations[active].action}
                      </motion.div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Controls */}
              <div className="px-5 pb-5 flex gap-3">
                {step < 2 ? (
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    onClick={() => setStep((s) => Math.min(s + 1, 2))}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 text-white text-sm font-bold">
                    {step === 0 ? '▶ Ver respuesta del asistente' : '⚡ Ver la acción tomada'}
                  </motion.button>
                ) : (
                  <button onClick={() => setStep(0)} className="w-full py-3 rounded-xl border border-white/10 text-slate-400 text-sm hover:text-white transition-colors">
                    ↩ Hacer otra pregunta
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
