import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

const benefits = [
  {
    emoji: '⏰',
    title: 'Recuperas 95 horas al mes',
    desc: 'Eso son más de 2 semanas de trabajo liberadas. Tiempo para entrenar, para tu familia, para crecer el club — no para el papeleo.',
    highlight: '95h',
    color: 'from-blue-500 to-cyan-400',
  },
  {
    emoji: '💰',
    title: 'Nunca más un pago perdido',
    desc: 'El sistema detecta automáticamente quién debe y le envía recordatorios amables. Los morosos bajan a 0. Tu caja mejora sin que hagas nada.',
    highlight: '0 morosos',
    color: 'from-emerald-500 to-teal-400',
  },
  {
    emoji: '😌',
    title: 'Padres felices y tranquilos',
    desc: 'Ellos reciben notificaciones automáticas de horarios, resultados y pagos. Dejan de llamarte. Tú dejas de ser el secretario del club.',
    highlight: '-80% llamadas',
    color: 'from-violet-500 to-purple-400',
  },
  {
    emoji: '🏆',
    title: 'Resultados publicados en 2 minutos',
    desc: 'Sube el archivo de la competencia y el sistema asigna los resultados a cada atleta. Los padres los ven en el momento. La magia es nuestra, el crédito es tuyo.',
    highlight: '2 minutos',
    color: 'from-amber-500 to-orange-400',
  },
  {
    emoji: '📊',
    title: 'El directivo siempre sabe cómo va el club',
    desc: 'Reportes automáticos cada semana y cada mes. Con gráficas, con tendencias, con lo que necesitas para tomar decisiones — sin que muevas un dedo.',
    highlight: 'Automático',
    color: 'from-pink-500 to-rose-400',
  },
  {
    emoji: '🚀',
    title: 'Tu club crece sin que crezcas tú en trabajo',
    desc: 'Puedes tener el doble de atletas con el mismo tiempo de administración. El sistema escala contigo — tú solo enfócate en el deporte.',
    highlight: '2x atletas',
    color: 'from-orange-500 to-red-400',
  },
];

export default function BenefitsSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section id="benefits" className="relative py-24 bg-[#06080f] overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_50%,rgba(16,185,129,0.04),transparent)]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ duration: 0.6 }} className="text-center mb-16 space-y-4">
          <span className="text-emerald-400 text-sm font-bold uppercase tracking-widest">¿Qué gana tu club?</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white">
            Resultados reales,{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-300">no promesas vacías</span>
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Cada beneficio tiene un número detrás. Así de específico porque así de real.
          </p>
        </motion.div>

        <motion.div ref={ref} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((b, i) => (
            <motion.div key={b.title}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              whileHover={{ y: -5 }}
              className="group relative rounded-2xl border border-white/8 bg-white/4 p-7 hover:border-white/15 hover:bg-white/6 transition-all duration-300 overflow-hidden"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${b.color} opacity-0 group-hover:opacity-4 transition-opacity duration-300`} />

              <div className="text-4xl mb-4">{b.emoji}</div>

              {/* Highlight metric */}
              <div className={`text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r ${b.color} mb-2`}>
                {b.highlight}
              </div>

              <h3 className="text-white font-bold text-lg mb-3">{b.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{b.desc}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* ROI Calculator teaser */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-16 rounded-3xl border border-emerald-500/25 bg-emerald-950/20 p-8 text-center space-y-4">
          <h3 className="text-white font-black text-2xl">¿Cuánto te está costando no tener esto?</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl mx-auto">
            {[
              { label: 'Tiempo perdido/mes', value: '15-20h semanales', color: 'text-red-400' },
              { label: 'Costo de SpeedSkateTrack', value: 'Desde $49 USD/mes', color: 'text-emerald-400' },
              { label: 'Valor recuperado/mes', value: '+$1,400 USD', color: 'text-cyan-400' },
            ].map((r) => (
              <div key={r.label}>
                <div className={`text-2xl font-black ${r.color} mb-1`}>{r.value}</div>
                <div className="text-slate-500 text-sm">{r.label}</div>
              </div>
            ))}
          </div>
          <p className="text-slate-400 text-sm">El sistema se paga solo en el primer mes.</p>
        </motion.div>
      </div>
    </section>
  );
}
