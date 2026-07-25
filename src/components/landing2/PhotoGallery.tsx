import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

const photos = [
  {
    src: '/images/skate/race-mass-start.jpg',
    caption: 'Salida en masa — categoría juvenil',
    country: '🇫🇷 Francia',
  },
  {
    src: '/images/skate/race-pack.jpg',
    caption: 'Pelea por posiciones en la recta',
    country: '🇫🇷 Occitanie Open',
  },
  {
    src: '/images/skate/race-latam.jpg',
    caption: 'Competencia nacional categoría damas',
    country: '🇨🇴 Colombia',
  },
];

export default function PhotoGallery() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const x = useTransform(scrollYProgress, [0, 1], ['2%', '-2%']);

  return (
    <section ref={ref} className="relative py-20 bg-[#080c16] overflow-hidden">
      {/* Quote */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }} transition={{ duration: 0.6 }}
        className="text-center mb-12 px-4"
      >
        <p className="text-2xl sm:text-3xl lg:text-4xl font-black text-white max-w-3xl mx-auto leading-tight">
          "El patinaje de velocidad merece una plataforma{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300">
            a su altura
          </span>"
        </p>
        <p className="text-slate-500 text-sm mt-4">SpeedSkateTrack — construido por y para el mundo del patinaje</p>
      </motion.div>

      {/* Parallax photo strip */}
      <motion.div style={{ x }} className="flex gap-5 px-6 sm:px-10">
        {photos.map((p, i) => (
          <motion.div
            key={p.src}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.12, duration: 0.6 }}
            whileHover={{ scale: 1.02 }}
            className="relative flex-shrink-0 w-[calc(90vw-2rem)] sm:w-[420px] lg:w-[480px] rounded-3xl overflow-hidden shadow-2xl shadow-black/50 group cursor-pointer"
            style={{ height: 320 }}
          >
            <img
              src={p.src}
              alt={p.caption}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

            {/* Speed-line accent */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 via-amber-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {/* Caption */}
            <div className="absolute bottom-0 left-0 right-0 p-5">
              <div className="text-xs text-orange-300 font-bold uppercase tracking-widest mb-1">{p.country}</div>
              <div className="text-white font-bold text-base leading-snug">{p.caption}</div>
            </div>
          </motion.div>
        ))}

        {/* CTA card at the end */}
        <motion.div
          initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ delay: 0.4, duration: 0.6 }}
          className="relative flex-shrink-0 w-[280px] rounded-3xl overflow-hidden border-2 border-dashed border-orange-500/40 bg-orange-950/20 flex flex-col items-center justify-center p-8 text-center gap-4 cursor-pointer hover:border-orange-400/60 hover:bg-orange-950/30 transition-all"
          style={{ height: 320 }}
          onClick={() => document.querySelector('#cta')?.scrollIntoView({ behavior: 'smooth' })}
        >
          <div className="text-5xl">🛼</div>
          <div className="text-white font-black text-lg leading-tight">¿Tu club también quiere ser parte?</div>
          <div className="px-5 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold text-sm">
            Empieza gratis →
          </div>
        </motion.div>
      </motion.div>

      {/* Scroll hint on mobile */}
      <p className="text-center text-slate-600 text-xs mt-6 sm:hidden">← Desliza para ver más →</p>

      {/* Stats strip below photos */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.3 }}
        className="mt-14 max-w-4xl mx-auto px-4 grid grid-cols-2 sm:grid-cols-4 gap-4"
      >
        {[
          { n: '+47', label: 'Clubes activos', sub: 'en América y Europa' },
          { n: '+800', label: 'Atletas gestionados', sub: 'en tiempo real' },
          { n: '35+', label: 'Tareas automatizadas', sub: 'por club al mes' },
          { n: '95h', label: 'Ahorradas al mes', sub: 'promedio por director' },
        ].map((s) => (
          <div key={s.label} className="text-center p-4 rounded-2xl border border-white/6 bg-white/3">
            <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300">{s.n}</div>
            <div className="text-white font-bold text-sm mt-1">{s.label}</div>
            <div className="text-slate-500 text-xs mt-0.5">{s.sub}</div>
          </div>
        ))}
      </motion.div>
    </section>
  );
}
