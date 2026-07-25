import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const faqs = [
  {
    q: '¿Necesito saber de tecnología para usarlo?',
    a: 'Para nada. SpeedSkateTrack está diseñado para directivos de clubes, no para ingenieros. Si sabes usar WhatsApp, puedes usar SpeedSkateTrack. Y además, nuestro equipo te ayuda a configurar todo en tu primer día — sin costo adicional.',
  },
  {
    q: '¿Cuánto tiempo tarda en estar listo mi club?',
    a: 'En un día hábil tu club está funcionando. Nuestro equipo te ayuda a importar tus datos desde Excel o desde donde los tengas actualmente. Muchos clubes empiezan a ver resultados desde el primer día de uso.',
  },
  {
    q: '¿Y si ya uso Excel / WhatsApp / grupos de padres?',
    a: 'Perfecto — importamos tus datos de Excel en minutos. Los grupos de WhatsApp no desaparecen de un día para otro, pero en semanas los padres prefieren la app porque siempre tiene información actualizada. Los mensajes caóticos se reducen solos.',
  },
  {
    q: '¿La información de mis atletas está segura?',
    a: 'Completamente. Usamos la misma tecnología de seguridad que los bancos. Los datos de tu club son tuyos y nunca se comparten con nadie. Cumplimos con todas las regulaciones de protección de datos de América Latina y Europa.',
  },
  {
    q: '¿Qué pasa si no me convence?',
    a: 'Tienes 30 días de prueba completamente gratuita — sin tarjeta de crédito. Si decides no continuar, te devolvemos el 100% de tu dinero sin preguntas. El riesgo es cero para ti.',
  },
  {
    q: '¿Funciona para cualquier tipo de club de patinaje?',
    a: 'Sí — clubes de velocidad, artístico, hockey, freestyle. También funciona para escuelas de patinaje y academias. Puedes tener múltiples sedes, múltiples categorías y múltiples entrenadores.',
  },
  {
    q: '¿Los padres y atletas también tienen acceso?',
    a: 'Sí. Hay una app para padres donde pueden ver calendarios, pagos, resultados y comunicarse con el club. Los atletas también tienen su perfil donde ven su historial y planificación de entrenamientos.',
  },
  {
    q: '¿Puedo cancelar cuando quiera?',
    a: 'Sí, sin penalizaciones ni contratos. Si cancelas, exportamos todos tus datos para que no pierdas nada. Aunque confiamos en que cuando veas los resultados en el primer mes, no querrás cancelar.',
  },
];

export default function FAQSection() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="relative py-24 bg-[#06080f] overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_50%_50%,rgba(59,130,246,0.04),transparent)]" />

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ duration: 0.6 }} className="text-center mb-14 space-y-4">
          <span className="text-blue-400 text-sm font-bold uppercase tracking-widest">Preguntas frecuentes</span>
          <h2 className="text-3xl sm:text-4xl font-black text-white">
            Resolvemos tus dudas{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">antes de empezar</span>
          </h2>
        </motion.div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <motion.div key={faq.q}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05, duration: 0.4 }}
              className="rounded-2xl border border-white/8 bg-white/4 overflow-hidden"
            >
              <button className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left"
                onClick={() => setOpen(open === i ? null : i)}>
                <span className="text-white font-semibold text-base leading-snug">{faq.q}</span>
                <motion.span animate={{ rotate: open === i ? 45 : 0 }} transition={{ duration: 0.2 }}
                  className="flex-shrink-0 w-7 h-7 rounded-full border border-white/15 flex items-center justify-center text-slate-400 text-lg font-light">
                  +
                </motion.span>
              </button>
              <AnimatePresence>
                {open === i && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }}
                    className="overflow-hidden">
                    <p className="px-6 pb-5 text-slate-400 leading-relaxed">{faq.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-10 text-center p-6 rounded-2xl border border-white/8 bg-white/4">
          <p className="text-slate-300 mb-3">¿Tienes una pregunta que no está aquí?</p>
          <a href="mailto:hola@speedskatetrack.com"
            className="text-blue-400 font-bold hover:text-blue-300 transition-colors underline underline-offset-4">
            hola@speedskatetrack.com
          </a>
          <span className="text-slate-500 mx-3">·</span>
          <span className="text-slate-400 text-sm">Respondemos en menos de 2 horas</span>
        </motion.div>
      </div>
    </section>
  );
}
