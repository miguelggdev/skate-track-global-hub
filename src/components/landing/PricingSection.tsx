import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Zap, ArrowRight } from 'lucide-react';

const plans = [
  {
    name: 'Starter',
    emoji: '🛼',
    price: { monthly: 49, annual: 39 },
    desc: 'Perfecto para clubes pequeños que comienzan a digitalizar su gestión.',
    color: 'from-slate-500 to-slate-400',
    border: 'border-white/10',
    popular: false,
    features: [
      'Hasta 50 atletas',
      'Módulo de atletas completo',
      'Calendario de entrenamientos',
      'Resultados de competencias',
      '3 agentes IA básicos',
      '10 automatizaciones',
      'Exportación PDF y Excel',
      'Soporte por email',
    ],
  },
  {
    name: 'Pro',
    emoji: '⛸️',
    price: { monthly: 129, annual: 99 },
    desc: 'Para clubes en crecimiento que quieren el poder completo de la IA.',
    color: 'from-blue-500 to-cyan-400',
    border: 'border-blue-500/50',
    popular: true,
    features: [
      'Hasta 200 atletas',
      'Todo el módulo Starter',
      'Los 14 agentes IA especializados',
      'Las 35 automatizaciones Celery',
      'RAG con documentos del club',
      'Dashboard analytics avanzado',
      'Portal de padres',
      'Importación masiva CSV/Excel',
      'Soporte prioritario por chat',
      'WhatsApp Business integrado',
    ],
  },
  {
    name: 'Elite',
    emoji: '🏆',
    price: { monthly: 299, annual: 239 },
    desc: 'Para federaciones y clubes de alto rendimiento con necesidades enterprise.',
    color: 'from-amber-500 to-orange-400',
    border: 'border-amber-500/30',
    popular: false,
    features: [
      'Atletas ilimitados',
      'Todo el módulo Pro',
      'Agentes IA personalizados',
      'Multi-club / federación',
      'API pública de acceso',
      'Integración cronometraje (Alge)',
      'Integración Strava / Garmin',
      'Sistema de timing en vivo',
      'Firma digital de documentos',
      'SLA 99.9% de uptime',
      'Soporte dedicado 24/7',
      'Onboarding personalizado',
    ],
  },
];

export default function PricingSection() {
  const [annual, setAnnual] = useState(true);

  return (
    <section id="pricing" className="relative py-24 bg-[#020817] overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_100%,rgba(59,130,246,0.08),transparent)]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 space-y-6"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/8 text-blue-300 text-sm font-medium">
            💳 Planes y Precios
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white">
            Elige el plan{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
              perfecto
            </span>{' '}
            para tu club
          </h2>

          {/* Toggle */}
          <div className="flex items-center justify-center gap-4">
            <span className={`text-sm font-medium ${!annual ? 'text-white' : 'text-slate-400'}`}>Mensual</span>
            <button
              onClick={() => setAnnual(!annual)}
              className={`relative w-14 h-7 rounded-full transition-colors duration-300 ${annual ? 'bg-blue-600' : 'bg-white/20'}`}
            >
              <motion.div
                animate={{ x: annual ? 28 : 2 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className="absolute top-1 w-5 h-5 rounded-full bg-white shadow-md"
              />
            </button>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-medium ${annual ? 'text-white' : 'text-slate-400'}`}>Anual</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold">-25%</span>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              whileHover={{ y: plan.popular ? -8 : -4 }}
              className={`relative rounded-2xl border ${plan.border} ${
                plan.popular ? 'bg-gradient-to-b from-blue-950/80 to-[#0d1117]' : 'bg-white/4'
              } backdrop-blur-sm p-6 flex flex-col`}
            >
              {plan.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <div className="flex items-center gap-1.5 px-4 py-1 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-xs font-bold shadow-lg shadow-blue-500/40">
                    <Zap className="w-3 h-3" />
                    Más popular
                  </div>
                </div>
              )}

              {/* Plan header */}
              <div className="mb-6">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center text-2xl shadow-lg mb-4`}>
                  {plan.emoji}
                </div>
                <h3 className="text-white font-black text-xl mb-1">{plan.name}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{plan.desc}</p>
              </div>

              {/* Price */}
              <div className="mb-6">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={annual ? 'annual' : 'monthly'}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-baseline gap-1"
                  >
                    <span className="text-slate-400 text-lg">$</span>
                    <span className={`text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r ${plan.color}`}>
                      {annual ? plan.price.annual : plan.price.monthly}
                    </span>
                    <span className="text-slate-400 text-sm">USD/mes</span>
                  </motion.div>
                </AnimatePresence>
                {annual && (
                  <p className="text-slate-500 text-xs mt-1">
                    Facturado anualmente · ${plan.price.annual * 12} USD/año
                  </p>
                )}
              </div>

              {/* Features */}
              <ul className="space-y-2.5 flex-1 mb-8">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <div className={`w-4 h-4 rounded-full bg-gradient-to-br ${plan.color} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                      <Check className="w-2.5 h-2.5 text-white" />
                    </div>
                    <span className="text-slate-300 text-sm">{f}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <motion.a
                href="#cta"
                onClick={(e) => { e.preventDefault(); document.querySelector('#cta')?.scrollIntoView({ behavior: 'smooth' }); }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold text-sm transition-all ${
                  plan.popular
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50'
                    : 'border border-white/15 bg-white/5 text-white hover:bg-white/10'
                }`}
              >
                Comenzar con {plan.name}
                <ArrowRight className="w-4 h-4" />
              </motion.a>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center text-slate-500 text-sm mt-8"
        >
          ✅ Sin tarjeta de crédito para empezar · 30 días de prueba gratuita · Cancela cuando quieras
        </motion.p>
      </div>
    </section>
  );
}
