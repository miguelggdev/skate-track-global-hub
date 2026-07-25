import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

const pains = [
  { emoji: '📱', title: 'WhatsApp caótico', desc: 'Grupos de padres llenos de dudas, mensajes perdidos y preguntas que ya respondiste 10 veces esta semana.' },
  { emoji: '📊', title: 'Excel desactualizado', desc: 'Datos de atletas en hojas que nadie actualiza, que se pierden, que no se comparten y que llevan horas mantener.' },
  { emoji: '💸', title: 'Cobros que se pierden', desc: 'Atletas con pagos vencidos que siguen entrenando. Dinero que se te escapa sin que te des cuenta mes a mes.' },
  { emoji: '😤', title: 'Padres desinformados', desc: 'Llamadas a cualquier hora preguntando horarios, resultados o si su hijo asistió. Tú de secretario, no de director.' },
  { emoji: '🕐', title: 'Resultados tardíos', desc: 'Tres días para publicar los resultados de la última competencia. Los atletas preguntan, tú buscas las planillas.' },
  { emoji: '📋', title: 'Reportes a mano', desc: 'El directivo del club pide un informe mensual y pasas horas armando tablas, copiando datos y haciendo sumas.' },
];

export default function PainSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section className="relative py-24 bg-[#06080f] overflow-hidden">
      {/* Red tint — caos, problema */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_50%,rgba(239,68,68,0.04),transparent)]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ duration: 0.6 }} className="text-center mb-14 space-y-4">
          <span className="text-red-400 text-sm font-bold uppercase tracking-widest">¿Te suena familiar?</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white">
            La realidad de gestionar<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-400">
              un club sin las herramientas correctas
            </span>
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Si te identificas con alguno de estos problemas, no estás solo. El 87% de los directivos de clubes deportivos admiten que pierden más de 15 horas semanales en tareas administrativas.
          </p>
        </motion.div>

        <motion.div ref={ref} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {pains.map((p, i) => (
            <motion.div key={p.title}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.09, duration: 0.5 }}
              className="group relative rounded-2xl border border-red-900/30 bg-red-950/15 p-6 hover:border-red-800/50 hover:bg-red-950/25 transition-all duration-300"
            >
              <div className="text-4xl mb-4">{p.emoji}</div>
              <h3 className="text-white font-bold text-lg mb-2">{p.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{p.desc}</p>
              {/* Red dot indicator */}
              <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-red-500/60" />
            </motion.div>
          ))}
        </motion.div>

        {/* Bridge to solution */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-16 text-center p-8 rounded-3xl border border-white/8 bg-gradient-to-r from-blue-950/40 to-cyan-950/30 backdrop-blur-sm">
          <p className="text-2xl sm:text-3xl font-black text-white mb-3">
            Hay una forma mejor. Y es más fácil de lo que crees.
          </p>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Miles de horas de trabajo se pueden automatizar. Tu trabajo es dirigir el club — no administrar el caos.
          </p>
          <motion.button
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
            onClick={() => document.querySelector('#how')?.scrollIntoView({ behavior: 'smooth' })}
            className="mt-6 px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold text-base shadow-xl shadow-blue-500/30"
          >
            Muéstrame la solución →
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}
