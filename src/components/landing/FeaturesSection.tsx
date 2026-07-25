import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Users, Calendar, Trophy, DollarSign, Brain, Zap, BarChart3, Shield, FileText, Smartphone } from 'lucide-react';

const features = [
  {
    icon: Users,
    title: 'Gestión Completa de Atletas',
    description: 'Perfiles deportivos con CV, medidas corporales, equipamiento, historial médico, galería y código QR único.',
    color: 'from-blue-500 to-cyan-400',
    glow: 'shadow-blue-500/20',
    tag: 'Core',
  },
  {
    icon: Calendar,
    title: 'Calendario Inteligente',
    description: 'Planifica entrenamientos con vista semanal/mensual. Registro de asistencia por QR. Los agentes IA detectan huecos y sugieren sesiones.',
    color: 'from-cyan-500 to-teal-400',
    glow: 'shadow-cyan-500/20',
    tag: 'IA Integrada',
  },
  {
    icon: Trophy,
    title: 'Competencias y Resultados',
    description: 'Importa resultados desde CSV/Excel. Ranking automático, medallero, análisis técnico post-competencia y notificaciones en tiempo real.',
    color: 'from-amber-500 to-orange-400',
    glow: 'shadow-amber-500/20',
    tag: 'Automatizado',
  },
  {
    icon: DollarSign,
    title: 'Finanzas del Club',
    description: 'Control total de ingresos y egresos. Alertas de mora automáticas, recibos digitales, proyecciones de flujo de caja y reportes ejecutivos.',
    color: 'from-emerald-500 to-teal-400',
    glow: 'shadow-emerald-500/20',
    tag: 'Automatizado',
  },
  {
    icon: Brain,
    title: '14 Agentes IA Especializados',
    description: 'Entrenador, nutricionista, médico, financiero, legal y más. Cada agente tiene acceso a la BD en tiempo real y documentos con RAG.',
    color: 'from-purple-500 to-violet-400',
    glow: 'shadow-purple-500/20',
    tag: 'IA Avanzada',
  },
  {
    icon: Zap,
    title: '35 Automatizaciones',
    description: 'Powered by Celery + Python + LangGraph. Recordatorios, reportes, alertas y tareas recurrentes que se ejecutan solas 24/7.',
    color: 'from-orange-500 to-red-400',
    glow: 'shadow-orange-500/20',
    tag: 'Celery + Python',
  },
  {
    icon: BarChart3,
    title: 'Analytics y Reportes',
    description: 'Dashboards en tiempo real por rol. Gráficas de rendimiento, tendencias, predicciones de potencial y reportes PDF automáticos.',
    color: 'from-sky-500 to-blue-400',
    glow: 'shadow-sky-500/20',
    tag: 'Tiempo Real',
  },
  {
    icon: Shield,
    title: 'Seguridad Empresarial',
    description: 'RLS por tabla, audit log completo, rate limiting, 2FA, detección de anomalías y cumplimiento de Ley 1581 (protección de datos).',
    color: 'from-rose-500 to-pink-400',
    glow: 'shadow-rose-500/20',
    tag: 'Nivel Enterprise',
  },
  {
    icon: FileText,
    title: 'Documentos Digitales',
    description: 'Carnets con QR, contratos digitales, autorizaciones de menores, reportes PDF y exportación Excel. Todo sin papel.',
    color: 'from-indigo-500 to-blue-400',
    glow: 'shadow-indigo-500/20',
    tag: 'Sin Papel',
  },
  {
    icon: Smartphone,
    title: 'Diseño 100% Responsive',
    description: 'Funciona perfecto en móvil, tablet y desktop. PWA instalable en tu teléfono. Los coaches registran asistencia desde la pista.',
    color: 'from-pink-500 to-rose-400',
    glow: 'shadow-pink-500/20',
    tag: 'Mobile-First',
  },
];

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function FeaturesSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section id="features" className="relative py-24 bg-[#020817] overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-24 bg-gradient-to-b from-transparent to-blue-500/40" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(59,130,246,0.08),transparent)]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 space-y-4"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/8 text-blue-300 text-sm font-medium">
            ✨ Todo lo que necesitas
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white">
            Una plataforma.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
              Todo el poder.
            </span>
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Desde la inscripción del primer atleta hasta el reporte anual para el directivo, todo en un solo lugar con inteligencia artificial integrada.
          </p>
        </motion.div>

        {/* Grid */}
        <motion.div
          ref={ref}
          variants={container}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5"
        >
          {features.map((f) => (
            <motion.div
              key={f.title}
              variants={item}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className={`group relative rounded-2xl border border-white/8 bg-white/4 backdrop-blur-sm p-6 hover:border-white/15 hover:bg-white/6 transition-all duration-300 overflow-hidden ${
                f.title === '14 Agentes IA Especializados' ? 'sm:col-span-2 lg:col-span-1' : ''
              }`}
            >
              {/* Hover glow */}
              <div className={`absolute inset-0 bg-gradient-to-br ${f.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
              <div className={`absolute -inset-0.5 bg-gradient-to-br ${f.color} rounded-2xl opacity-0 group-hover:opacity-15 -z-10 blur-sm transition-opacity duration-300`} />

              {/* Tag */}
              <div className="mb-4 flex items-start justify-between">
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center shadow-lg ${f.glow} group-hover:scale-110 transition-transform duration-300`}>
                  <f.icon className="w-5 h-5 text-white" />
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-gradient-to-r ${f.color} bg-clip-text text-transparent border border-white/10`}>
                  {f.tag}
                </span>
              </div>

              <h3 className="text-white font-bold text-base mb-2 leading-snug">{f.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{f.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
