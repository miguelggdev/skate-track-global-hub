import { useState } from 'react';
import { motion } from 'framer-motion';

const plans = [
  {
    name: 'Starter',
    tagline: 'Para clubes que están empezando',
    priceM: 49,
    priceA: 39,
    athletes: 'Hasta 30 atletas',
    highlights: [
      '✅ Gestión completa de atletas',
      '✅ Cobros y recordatorios automáticos',
      '✅ Calendario de entrenamientos',
      '✅ Notificaciones a padres',
      '✅ Resultados de competencias',
      '✅ Soporte por email',
    ],
    cta: 'Empezar gratis 30 días',
    color: 'from-blue-600 to-cyan-600',
    border: 'border-blue-500/30',
    popular: false,
  },
  {
    name: 'Profesional',
    tagline: 'El favorito de los clubes en crecimiento',
    priceM: 129,
    priceA: 99,
    athletes: 'Hasta 100 atletas',
    highlights: [
      '✅ Todo de Starter +',
      '✅ Asistente IA (preguntas y acciones)',
      '✅ Reportes automáticos mensuales',
      '✅ Múltiples entrenadores',
      '✅ App para padres y atletas',
      '✅ Soporte prioritario',
    ],
    cta: 'Empezar gratis 30 días',
    color: 'from-orange-500 to-amber-500',
    border: 'border-orange-500/50',
    popular: true,
  },
  {
    name: 'Club Premium',
    tagline: 'Para federaciones y clubes grandes',
    priceM: 299,
    priceA: 229,
    athletes: 'Atletas ilimitados',
    highlights: [
      '✅ Todo de Profesional +',
      '✅ Múltiples sedes',
      '✅ Integración con federación',
      '✅ Branding propio del club',
      '✅ API para integraciones',
      '✅ Gerente de cuenta dedicado',
    ],
    cta: 'Hablar con ventas',
    color: 'from-violet-600 to-purple-600',
    border: 'border-violet-500/30',
    popular: false,
  },
];

export default function PricingSimple() {
  const [annual, setAnnual] = useState(false);

  return (
    <section id="pricing" className="relative py-24 bg-[#080c16] overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_50%,rgba(249,115,22,0.05),transparent)]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ duration: 0.6 }} className="text-center mb-14 space-y-5">
          <span className="text-orange-400 text-sm font-bold uppercase tracking-widest">Precios transparentes</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white">
            Invierte menos de lo que cuesta{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300">una mensualidad de un atleta</span>
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Sin contratos. Sin sorpresas. Cancela cuando quieras. Y los primeros 30 días son completamente gratis.
          </p>

          {/* Toggle */}
          <div className="flex items-center justify-center gap-4">
            <span className={`text-sm font-medium ${!annual ? 'text-white' : 'text-slate-500'}`}>Mensual</span>
            <button onClick={() => setAnnual(!annual)}
              className={`relative w-14 h-7 rounded-full transition-colors ${annual ? 'bg-orange-500' : 'bg-white/10'}`}>
              <motion.div animate={{ x: annual ? 28 : 2 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className="absolute top-1 w-5 h-5 rounded-full bg-white" />
            </button>
            <span className={`text-sm font-medium ${annual ? 'text-white' : 'text-slate-500'}`}>
              Anual <span className="text-orange-400 font-bold ml-1">(-25%)</span>
            </span>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {plans.map((p, i) => (
            <motion.div key={p.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12, duration: 0.5 }}
              whileHover={{ y: -4 }}
              className={`relative rounded-3xl border p-7 ${p.border} ${p.popular ? 'bg-gradient-to-b from-orange-950/30 to-amber-950/10' : 'bg-white/4'}`}
            >
              {p.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-5 py-1.5 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-orange-500/30">
                  El más popular
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-white font-black text-xl mb-1">{p.name}</h3>
                <p className="text-slate-400 text-sm">{p.tagline}</p>
              </div>

              <div className="mb-6">
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-black text-white">${annual ? p.priceA : p.priceM}</span>
                  <span className="text-slate-500 text-sm mb-1">USD/mes</span>
                </div>
                {annual && <div className="text-emerald-400 text-xs mt-1">Ahorras ${(p.priceM - p.priceA) * 12} USD al año</div>}
                <div className="mt-2 text-sm text-orange-300 font-semibold">{p.athletes}</div>
              </div>

              <ul className="space-y-2.5 mb-8">
                {p.highlights.map((h) => (
                  <li key={h} className="text-slate-300 text-sm">{h}</li>
                ))}
              </ul>

              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={() => document.querySelector('#cta')?.scrollIntoView({ behavior: 'smooth' })}
                className={`w-full py-4 rounded-xl font-black text-white text-sm bg-gradient-to-r ${p.color} shadow-lg transition-all`}>
                {p.cta}
              </motion.button>
            </motion.div>
          ))}
        </div>

        {/* Risk reversal */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-12 text-center space-y-3">
          <div className="flex flex-wrap justify-center gap-6 text-slate-400 text-sm">
            <span>✅ Sin tarjeta de crédito para empezar</span>
            <span>✅ Configuras en 1 día</span>
            <span>✅ Garantía de devolución 30 días</span>
            <span>✅ Cancela cuando quieras</span>
          </div>
          <p className="text-slate-500 text-xs">¿Tienes una federación o más de 500 atletas? <button className="text-orange-400 underline">Escríbenos para un plan personalizado</button></p>
        </motion.div>
      </div>
    </section>
  );
}
