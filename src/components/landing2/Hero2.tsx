import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SpeedSkateIcon from './SpeedSkateIcon';

const PAINS = [
  'horas en WhatsApp coordinando padres',
  'pagos perdidos en hojas de Excel',
  'resultados que tardas días en publicar',
  'reportes que haces a mano cada mes',
  'atletas que no saben sus horarios',
];

function RotatingPain() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % PAINS.length), 2800);
    return () => clearInterval(t);
  }, []);
  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={idx}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -16 }}
        transition={{ duration: 0.4 }}
        className="text-orange-400 font-black inline-block"
      >
        {PAINS[idx]}
      </motion.span>
    </AnimatePresence>
  );
}

const trustLogos = ['Club Élite Bogotá', 'Patinaños Medellín', 'Club Velocidad Cali', 'Academia Sprint'];

export default function Hero2() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-[#06080f] pt-16">
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-blue-700/10 rounded-full blur-[130px] animate-orb-1" />
        <div className="absolute bottom-0 right-1/3 w-[400px] h-[400px] bg-orange-600/8 rounded-full blur-[100px] animate-orb-2" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* LEFT: Content */}
          <div className="space-y-7">
            {/* Trust bar */}
            <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
              className="flex items-center gap-2 flex-wrap">
              <div className="flex -space-x-2">
                {['🧑‍💼','👩‍🏫','🧑‍💻','👨‍🏫'].map((e, i) => (
                  <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 border-2 border-[#06080f] flex items-center justify-center text-sm">{e}</div>
                ))}
              </div>
              <span className="text-slate-400 text-sm"><strong className="text-white">+47 clubes</strong> ya confían en SpeedSkateTrack</span>
              <div className="text-sm">{'⭐'.repeat(5)}</div>
            </motion.div>

            {/* Pain headline */}
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}>
              <h1 className="text-4xl sm:text-5xl lg:text-5xl xl:text-6xl font-black text-white leading-[1.06] tracking-tight">
                ¿Cuántas horas más vas a perder en{' '}
                <span className="relative inline-block">
                  <RotatingPain />
                  <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-orange-400 to-orange-600 rounded-full" />
                </span>
                ?
              </h1>
            </motion.div>

            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.25 }}
              className="text-slate-300 text-lg sm:text-xl leading-relaxed">
              <strong className="text-white">SpeedSkateTrack</strong> gestiona tu club completo — atletas, cobros, entrenamientos y competencias — con un asistente inteligente que trabaja{' '}
              <strong className="text-cyan-400">mientras tú entrenas</strong>.
            </motion.p>

            {/* Benefit pills */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
              className="flex flex-wrap gap-2.5">
              {[
                { e: '⏱️', t: 'Ahorra 95h al mes' },
                { e: '💰', t: 'Recupera pagos perdidos' },
                { e: '📱', t: 'Padres siempre informados' },
                { e: '🏆', t: 'Resultados en 2 minutos' },
              ].map((p) => (
                <div key={p.t} className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/7 border border-white/10 backdrop-blur-sm text-sm text-slate-200 font-medium">
                  <span>{p.e}</span>{p.t}
                </div>
              ))}
            </motion.div>

            {/* CTAs */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-3">
              <motion.button
                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                onClick={() => document.querySelector('#cta')?.scrollIntoView({ behavior: 'smooth' })}
                className="group relative px-8 py-4 rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-black text-base shadow-2xl shadow-orange-500/40 hover:shadow-orange-400/60 transition-all overflow-hidden"
              >
                <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="relative">🚀 Quiero verlo gratis — 30 días</span>
              </motion.button>
              <button onClick={() => document.querySelector('#how')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-6 py-4 text-slate-400 hover:text-white text-sm font-medium transition-colors underline underline-offset-4">
                Ver cómo funciona →
              </button>
            </motion.div>

            {/* Micro-guarantee */}
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.65 }}
              className="text-slate-500 text-xs">
              ✅ Sin tarjeta · ✅ Configuras en 1 día · ✅ Devolución garantizada
            </motion.p>
          </div>

          {/* RIGHT: Race photo — the real thing */}
          <motion.div
            initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
            className="relative hidden lg:block"
          >
            {/* Main photo */}
            <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-black/60">
              <img
                src="/images/skate/race-pack.jpg"
                alt="Competencia de patinaje de velocidad"
                className="w-full h-[520px] object-cover object-center"
              />
              {/* Dark gradient overlay at bottom */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#06080f] via-transparent to-transparent" />
              {/* Orange side accent */}
              <div className="absolute top-0 right-0 w-1.5 h-full bg-gradient-to-b from-orange-500 via-amber-400 to-transparent" />

              {/* Floating stat card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}
                className="absolute bottom-6 left-6 right-6 p-4 rounded-2xl bg-black/70 backdrop-blur-md border border-white/10"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-slate-400 text-xs mb-1">Competencia — Resultados publicados</div>
                    <div className="text-white font-black text-lg">En 2 minutos ✓</div>
                  </div>
                  <div className="text-right">
                    <div className="text-slate-400 text-xs mb-1">Notificaciones enviadas</div>
                    <div className="text-emerald-400 font-black text-lg">847 atletas</div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Second smaller photo — floating */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1, duration: 0.5 }}
              className="absolute -bottom-8 -left-8 w-52 h-36 rounded-2xl overflow-hidden shadow-2xl shadow-black/60 border-2 border-white/10"
            >
              <img src="/images/skate/race-latam.jpg" alt="Club latinoamericano" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-2 left-3">
                <div className="text-white text-xs font-bold">Club Latinoamérica</div>
                <div className="text-emerald-400 text-xs">Activo en SpeedSkateTrack</div>
              </div>
            </motion.div>

            {/* Speed lines decoration */}
            <div className="absolute -right-4 top-1/2 -translate-y-1/2 space-y-3 opacity-30">
              {[80, 60, 40, 60, 80].map((w, i) => (
                <div key={i} className="h-px bg-gradient-to-l from-orange-400 to-transparent" style={{ width: w }} />
              ))}
            </div>
          </motion.div>
        </div>

        {/* Trust logos row */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}
          className="mt-16 pt-8 border-t border-white/6">
          <div className="flex flex-wrap items-center justify-center gap-8">
            <span className="text-slate-600 text-xs uppercase tracking-widest font-medium">Clubes que ya lo usan</span>
            {trustLogos.map((l) => (
              <span key={l} className="text-slate-500 text-sm font-semibold hover:text-slate-300 transition-colors cursor-default">{l}</span>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.3 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2">
        <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 1.6 }}
          className="w-6 h-10 rounded-full border-2 border-white/15 flex items-start justify-center p-1.5">
          <div className="w-1 h-2.5 rounded-full bg-white/30" />
        </motion.div>
      </motion.div>
    </section>
  );
}
