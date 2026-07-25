import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SpeedSkateIcon from './SpeedSkateIcon';

export default function CTAStrong() {
  const [email, setEmail] = useState('');
  const [club, setClub] = useState('');
  const [athletes, setAthletes] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && club) setSent(true);
  };

  return (
    <section id="cta" className="relative py-28 overflow-hidden">
      {/* Real race photo background */}
      <div className="absolute inset-0">
        <img
          src="/images/skate/race-mass-start.jpg"
          alt=""
          className="w-full h-full object-cover object-center opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#080c16]/80 via-[#06080f]/90 to-[#06080f]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_40%,rgba(249,115,22,0.10),transparent)]" />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <AnimatePresence mode="wait">
          {!sent ? (
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Urgency */}
              <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-950/60 border border-orange-500/40 text-orange-300 text-sm font-semibold mb-8 backdrop-blur-sm">
                <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
                Solo quedan 3 cupos de onboarding esta semana
              </motion.div>

              <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.6 }}
                className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-[1.05] mb-6">
                Empieza hoy.<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300">
                  30 días gratis, sin tarjeta.
                </span>
              </motion.h2>

              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                className="text-slate-300 text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
                El equipo de SpeedSkateTrack configura todo por ti. En un día tu club está corriendo solo. Y si no ves resultados en 30 días, te devolvemos cada centavo.
              </motion.p>

              {/* Form */}
              <motion.form onSubmit={handleSubmit} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="max-w-lg mx-auto space-y-4 mb-6">
                <input type="email" required placeholder="Tu email del club" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-5 py-4 rounded-xl bg-black/50 border border-white/15 text-white placeholder-slate-500 text-base focus:outline-none focus:border-orange-500/60 transition-colors backdrop-blur-sm" />
                <input type="text" required placeholder="Nombre de tu club" value={club} onChange={(e) => setClub(e.target.value)}
                  className="w-full px-5 py-4 rounded-xl bg-black/50 border border-white/15 text-white placeholder-slate-500 text-base focus:outline-none focus:border-orange-500/60 transition-colors backdrop-blur-sm" />
                <select value={athletes} onChange={(e) => setAthletes(e.target.value)}
                  className="w-full px-5 py-4 rounded-xl bg-black/50 border border-white/15 text-slate-400 text-base focus:outline-none focus:border-orange-500/60 transition-colors backdrop-blur-sm appearance-none">
                  <option value="">¿Cuántos atletas tiene tu club?</option>
                  <option value="<20">Menos de 20</option>
                  <option value="20-50">20 - 50 atletas</option>
                  <option value="50-100">50 - 100 atletas</option>
                  <option value=">100">Más de 100</option>
                </select>
                <motion.button type="submit" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  className="w-full py-5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-black text-lg shadow-2xl shadow-orange-500/40 hover:shadow-orange-400/60 transition-all">
                  🚀 Quiero empezar gratis ahora →
                </motion.button>
              </motion.form>

              {/* Guarantees */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                className="flex flex-wrap justify-center gap-5 text-slate-400 text-sm mb-8">
                <span>✅ Sin tarjeta de crédito</span>
                <span>✅ Configuras en 1 día</span>
                <span>✅ Garantía 30 días</span>
                <span>✅ Cancela cuando quieras</span>
              </motion.div>

              {/* Trust logos */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
                className="border-t border-white/8 pt-8">
                <p className="text-slate-600 text-xs uppercase tracking-widest mb-4">Ya confían en nosotros</p>
                <div className="flex flex-wrap justify-center gap-8">
                  {['Club Élite Bogotá', 'Academia Sprint', 'Club Velocidad Cali', 'Patinaños Medellín'].map((c) => (
                    <span key={c} className="text-slate-500 text-sm font-semibold">{c}</span>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 300 }} className="py-10 space-y-6">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-orange-500 to-amber-500 mx-auto flex items-center justify-center shadow-2xl shadow-orange-500/40">
                <SpeedSkateIcon size={44} primaryColor="#fff" secondaryColor="#fed7aa" wheelColor="#FFF" />
              </div>
              <h3 className="text-3xl font-black text-white">¡Bienvenido a SpeedSkateTrack!</h3>
              <p className="text-slate-300 text-lg max-w-xl mx-auto leading-relaxed">
                Recibimos tu solicitud. En las próximas <strong className="text-white">2 horas</strong> te contactamos para comenzar la configuración de <strong className="text-white">{club}</strong>.
              </p>
              <div className="flex flex-wrap justify-center gap-4 text-sm">
                {[
                  { e: '📧', t: 'Revisa tu correo' },
                  { e: '📞', t: 'Te llamamos pronto' },
                  { e: '⚡', t: 'Listo en 1 día' },
                ].map((i) => (
                  <span key={i.t} className="px-4 py-2 rounded-full bg-white/8 border border-white/10 text-slate-300">
                    {i.e} {i.t}
                  </span>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
