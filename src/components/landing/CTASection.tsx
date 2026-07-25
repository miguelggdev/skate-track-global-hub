import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Zap, CheckCircle } from 'lucide-react';

const benefits = [
  'Demo personalizada para tu club',
  'Configuración incluida sin costo',
  '30 días de prueba sin tarjeta',
  'Migración de datos asistida',
];

export default function CTASection() {
  const [email, setEmail] = useState('');
  const [club, setClub] = useState('');
  const [athletes, setAthletes] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <section id="cta" className="relative py-24 bg-[#050b18] overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/30 via-[#050b18] to-cyan-900/20" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl animate-orb-1" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-orb-2" />
      </div>

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left text */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/8 text-blue-300 text-sm font-medium">
                🚀 Comienza hoy mismo
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight">
                Tu club merece la
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
                  mejor tecnología
                </span>
              </h2>
              <p className="text-slate-400 text-lg leading-relaxed">
                Únete a los clubes de patinaje que ya automatizan su gestión y liberan tiempo para lo que más importa: <strong className="text-white">el entrenamiento</strong>.
              </p>
            </div>

            {/* Benefits */}
            <ul className="space-y-3">
              {benefits.map((b, i) => (
                <motion.li
                  key={b}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + i * 0.1, duration: 0.4 }}
                  className="flex items-center gap-3"
                >
                  <CheckCircle className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                  <span className="text-slate-300 font-medium">{b}</span>
                </motion.li>
              ))}
            </ul>

            {/* ROI teaser */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="rounded-2xl border border-emerald-500/25 bg-emerald-500/8 p-5 space-y-1"
            >
              <div className="flex items-center gap-2">
                <span className="text-2xl">💡</span>
                <span className="text-emerald-300 font-bold text-sm">ROI estimado: 1,754% mensual</span>
              </div>
              <p className="text-slate-400 text-sm">
                Ahorras ~95h/mes en tareas administrativas. A $15/h = $1,425 USD de valor mensual.
                Costo de la plataforma: $120 USD/mes.
              </p>
            </motion.div>
          </motion.div>

          {/* Right form */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <div className="relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 shadow-2xl shadow-black/30">
              {/* Glow */}
              <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/10 -z-10 blur-sm" />

              {!sent ? (
                <>
                  <div className="mb-6 space-y-1">
                    <h3 className="text-white font-black text-2xl">Solicita tu Demo</h3>
                    <p className="text-slate-400 text-sm">Te contactamos en menos de 24 horas.</p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="text-slate-300 text-sm font-medium block mb-1.5">Email del responsable del club</label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="admin@clubpatinaje.com"
                        className="w-full px-4 py-3 rounded-xl bg-white/8 border border-white/15 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500/60 focus:bg-white/10 transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-slate-300 text-sm font-medium block mb-1.5">Nombre del club</label>
                      <input
                        type="text"
                        required
                        value={club}
                        onChange={(e) => setClub(e.target.value)}
                        placeholder="Club de Patinaje Velocidad..."
                        className="w-full px-4 py-3 rounded-xl bg-white/8 border border-white/15 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500/60 focus:bg-white/10 transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-slate-300 text-sm font-medium block mb-1.5">¿Cuántos atletas tiene el club?</label>
                      <select
                        value={athletes}
                        onChange={(e) => setAthletes(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-white/8 border border-white/15 text-white text-sm focus:outline-none focus:border-blue-500/60 transition-all appearance-none"
                      >
                        <option value="" className="bg-slate-900">Selecciona...</option>
                        <option value="1-30" className="bg-slate-900">1 - 30 atletas</option>
                        <option value="31-80" className="bg-slate-900">31 - 80 atletas</option>
                        <option value="81-200" className="bg-slate-900">81 - 200 atletas</option>
                        <option value="200+" className="bg-slate-900">Más de 200 atletas</option>
                      </select>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      type="submit"
                      className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold text-base shadow-2xl shadow-blue-500/40 hover:shadow-blue-500/60 transition-shadow"
                    >
                      <Zap className="w-5 h-5" />
                      Solicitar Demo Gratuita
                      <ArrowRight className="w-4 h-4" />
                    </motion.button>

                    <p className="text-slate-500 text-xs text-center">
                      Sin spam. Sin tarjeta de crédito. Solo una demo personalizada.
                    </p>
                  </form>
                </>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8 space-y-4"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, delay: 0.1 }}
                    className="text-6xl"
                  >
                    🎉
                  </motion.div>
                  <h3 className="text-white font-black text-2xl">¡Recibimos tu solicitud!</h3>
                  <p className="text-slate-400">
                    Nos contactaremos con <strong className="text-white">{email}</strong> en menos de 24 horas para coordinar tu demo personalizada.
                  </p>
                  <div className="flex items-center justify-center gap-2 text-emerald-400 text-sm font-medium">
                    <CheckCircle className="w-4 h-4" />
                    Demo programada para {club || 'tu club'}
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
