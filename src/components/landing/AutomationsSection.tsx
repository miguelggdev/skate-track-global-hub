import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Calendar, DollarSign, Users, Settings, Megaphone, BarChart3, Shield, Bell } from 'lucide-react';

const techStack = [
  { name: 'Python', emoji: '🐍', color: 'from-yellow-500 to-amber-400' },
  { name: 'Celery', emoji: '🌿', color: 'from-emerald-500 to-green-400' },
  { name: 'LangGraph', emoji: '🕸️', color: 'from-purple-500 to-violet-400' },
  { name: 'Redis', emoji: '🔴', color: 'from-red-500 to-rose-400' },
  { name: 'FastAPI', emoji: '⚡', color: 'from-teal-500 to-cyan-400' },
  { name: 'Claude IA', emoji: '🤖', color: 'from-blue-500 to-indigo-400' },
];

const automationCategories = [
  {
    icon: Calendar,
    name: 'Calendario',
    color: 'from-cyan-500 to-teal-400',
    count: 6,
    autos: ['Recordatorio entrenamiento', 'Alerta 2h antes', 'Detección de huecos', 'Gestión de inasistencias', 'Lista de espera inteligente', 'Análisis carga semanal'],
  },
  {
    icon: DollarSign,
    name: 'Finanzas',
    color: 'from-amber-500 to-orange-400',
    count: 5,
    autos: ['Recibo automático de pago', 'Alerta cartera morosa', 'Cierre de caja diario', 'Proyección mensual', 'Recordatorio renovación'],
  },
  {
    icon: Users,
    name: 'Atletas',
    color: 'from-blue-500 to-cyan-400',
    count: 4,
    autos: ['Seguimiento post-competencia', 'Evaluación física semestral', 'Protocolo lesiones', 'Monitoreo progreso semanal'],
  },
  {
    icon: Settings,
    name: 'Administración',
    color: 'from-indigo-500 to-blue-400',
    count: 5,
    autos: ['Briefing matutino IA', 'Resumen fin de día', 'Docs vencidos', 'Control inventario', 'Generación de carnets'],
  },
  {
    icon: Megaphone,
    name: 'Marketing',
    color: 'from-fuchsia-500 to-purple-400',
    count: 5,
    autos: ['Felicitación cumpleaños', 'Reactivación inactivos', 'Encuesta NPS', 'Solicitud testimonio', 'Campaña temporada'],
  },
  {
    icon: BarChart3,
    name: 'Reportería',
    color: 'from-emerald-500 to-teal-400',
    count: 4,
    autos: ['Reporte semanal directivo', 'Reporte rendimiento mensual', 'Inscripción federación', 'Análisis predictivo'],
  },
  {
    icon: Shield,
    name: 'Seguridad',
    color: 'from-slate-500 to-gray-400',
    count: 4,
    autos: ['Monitoreo accesos', 'Verificación backups', 'Auditoría datos sensibles', 'Rotación de tokens'],
  },
  {
    icon: Bell,
    name: 'Comunicación',
    color: 'from-rose-500 to-pink-400',
    count: 2,
    autos: ['Notificaciones tiempo real', 'Resumen actividad agentes IA'],
  },
];

const flowNodes = [
  { label: 'Trigger', sub: 'Cron / DB Hook / Usuario', color: 'from-slate-600 to-slate-500', x: '10%', y: '50%' },
  { label: 'Celery Beat', sub: 'Cola de tareas', color: 'from-emerald-600 to-emerald-500', x: '35%', y: '20%' },
  { label: 'LangGraph', sub: 'Orquestador IA', color: 'from-purple-600 to-violet-500', x: '60%', y: '50%' },
  { label: 'Acción', sub: 'Email / Notif / DB', color: 'from-blue-600 to-cyan-500', x: '85%', y: '50%' },
];

export default function AutomationsSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section id="automations" className="relative py-24 bg-[#020817] overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_80%_50%,rgba(249,115,22,0.06),transparent)]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 space-y-4"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-orange-500/30 bg-orange-500/8 text-orange-300 text-sm font-medium">
            ⚡ Celery + Python + LangGraph
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white">
            35 Automatizaciones{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300">
              que trabajan por ti
            </span>
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Flujos de trabajo inteligentes que se ejecutan solos 24/7. Recordatorios, reportes, alertas y más — completamente automáticos.
          </p>
        </motion.div>

        {/* Tech stack */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex flex-wrap justify-center gap-4 mb-16"
        >
          {techStack.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
              whileHover={{ scale: 1.08 }}
              className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm"
            >
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${t.color} flex items-center justify-center text-base shadow-md`}>
                {t.emoji}
              </div>
              <span className="text-white font-semibold text-sm">{t.name}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* Animated flow */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative h-28 mb-16 hidden sm:block"
        >
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <motion.path
              d="M 15 50 C 28 50 28 20 35 20 C 42 20 42 50 55 50 C 68 50 72 50 80 50"
              fill="none"
              stroke="url(#flowGrad)"
              strokeWidth="0.8"
              strokeDasharray="4 2"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.5, delay: 0.3 }}
            />
            <defs>
              <linearGradient id="flowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#64748b" stopOpacity="0.5" />
                <stop offset="50%" stopColor="#a855f7" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.8" />
              </linearGradient>
            </defs>
          </svg>
          {flowNodes.map((node, i) => (
            <motion.div
              key={node.label}
              initial={{ opacity: 0, scale: 0.5 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 + i * 0.2, duration: 0.5, type: 'spring' }}
              className={`absolute transform -translate-x-1/2 -translate-y-1/2 rounded-xl border border-white/15 bg-white/8 backdrop-blur-sm px-3 py-2 text-center min-w-[90px]`}
              style={{ left: node.x, top: node.y }}
            >
              <div className={`text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r ${node.color} mb-0.5`}>{node.label}</div>
              <div className="text-slate-500 text-[9px]">{node.sub}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Automations grid */}
        <motion.div
          ref={ref}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
        >
          {automationCategories.map((cat, i) => (
            <motion.div
              key={cat.name}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              whileHover={{ y: -4 }}
              className="group rounded-2xl border border-white/8 bg-white/4 backdrop-blur-sm p-5 hover:border-white/15 hover:bg-white/6 transition-all duration-300"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                  <cat.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-sm">{cat.name}</h3>
                  <span className={`text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r ${cat.color}`}>
                    {cat.count} automatizaciones
                  </span>
                </div>
              </div>
              <ul className="space-y-1.5">
                {cat.autos.map((a) => (
                  <li key={a} className="flex items-center gap-2 text-slate-400 text-xs">
                    <span className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${cat.color} flex-shrink-0`} />
                    {a}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </motion.div>

        {/* Total badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-12 flex justify-center"
        >
          <div className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl border border-orange-500/30 bg-gradient-to-r from-orange-500/10 to-amber-500/10 backdrop-blur-sm">
            <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300">35</span>
            <div>
              <div className="text-white font-bold">automatizaciones incluidas</div>
              <div className="text-slate-400 text-sm">Listas para activar desde el día 1</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
