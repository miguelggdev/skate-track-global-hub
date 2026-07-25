import { useRef, useState } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';

const agents = [
  { id: 'AG-01', name: 'Admin Conversacional', emoji: '🏟️', color: 'from-blue-500 to-cyan-400', border: 'border-blue-500/30', desc: 'Acceso completo a la BD. Responde cualquier pregunta del club en lenguaje natural. Genera reportes y ejecuta acciones.', tools: ['DB Query', 'RAG', 'PDF Export'] },
  { id: 'AG-02', name: 'Entrenador de Patinaje', emoji: '⛸️', color: 'from-cyan-500 to-teal-400', border: 'border-cyan-500/30', desc: 'Experto en biomecánica, periodización y táctica. Genera planes de entrenamiento personalizados por categoría.', tools: ['Planes', 'Técnica', 'Análisis'] },
  { id: 'AG-03', name: 'Entrenador de Ciclismo', emoji: '🚴', color: 'from-sky-500 to-blue-400', border: 'border-sky-500/30', desc: 'Cross-training en bicicleta. Zonas de potencia, VO2max y periodización de sesiones de ciclismo complementarias.', tools: ['Power Zones', 'VO2max', 'Ruta'] },
  { id: 'AG-04', name: 'Nutricionista IA', emoji: '🥗', color: 'from-emerald-500 to-teal-400', border: 'border-emerald-500/30', desc: 'Planes nutricionales adaptados a la carga de entrenamiento, competencias próximas y métricas corporales del atleta.', tools: ['Planes', 'Hidratación', 'Suplementos'] },
  { id: 'AG-05', name: 'Agente Gym y Fuerza', emoji: '💪', color: 'from-orange-500 to-amber-400', border: 'border-orange-500/30', desc: 'Rutinas de fuerza específicas para patinadores. Glúteos, cuádriceps, core y pliometría integrados al calendario.', tools: ['Rutinas', 'Pliometría', 'Prevención'] },
  { id: 'AG-06', name: 'Agente Médico', emoji: '🏥', color: 'from-rose-500 to-pink-400', border: 'border-rose-500/30', desc: 'Gestión de lesiones, protocolos de recuperación y alertas de riesgo. Coordina con el fisioterapeuta del club.', tools: ['Lesiones', 'Recuperación', 'Alertas'] },
  { id: 'AG-07', name: 'Agente Financiero', emoji: '💰', color: 'from-amber-500 to-yellow-400', border: 'border-amber-500/30', desc: 'Proyecciones de flujo de caja, alertas de mora automáticas, cierres de caja y reportes ejecutivos mensuales.', tools: ['Proyecciones', 'Cobros', 'Reportes'] },
  { id: 'AG-08', name: 'Agente de Seguridad', emoji: '🛡️', color: 'from-slate-500 to-slate-400', border: 'border-slate-500/30', desc: 'Rate limiting, audit log completo, detección de anomalías y monitoreo 24/7 de accesos sospechosos.', tools: ['Rate Limit', 'Audit Log', 'Anomalías'] },
  { id: 'AG-09', name: 'Agente Marketing', emoji: '📣', color: 'from-fuchsia-500 to-purple-400', border: 'border-fuchsia-500/30', desc: 'Genera contenido para redes sociales, campañas de re-inscripción, felicitaciones de cumpleaños y encuestas NPS.', tools: ['RRSS', 'Campañas', 'NPS'] },
  { id: 'AG-10', name: 'Agente Resultados', emoji: '🏆', color: 'from-yellow-500 to-amber-400', border: 'border-yellow-500/30', desc: 'Procesa CSV/Excel de competencias. Asigna resultados a atletas con fuzzy matching y actualiza rankings automáticamente.', tools: ['CSV/Excel', 'Matching', 'Rankings'] },
  { id: 'AG-11', name: 'Agente Operaciones', emoji: '⚙️', color: 'from-indigo-500 to-blue-400', border: 'border-indigo-500/30', desc: 'Gestión del calendario de entrenamientos, recursos, equipamiento e inventario. Detecta conflictos de horario.', tools: ['Calendario', 'Inventario', 'Recursos'] },
  { id: 'AG-12', name: 'Agente Legal', emoji: '⚖️', color: 'from-gray-500 to-slate-400', border: 'border-gray-500/30', desc: 'Contratos deportivos, autorizaciones de menores, reglamentos federativos y documentos de inscripción.', tools: ['Contratos', 'Reglamentos', 'Docs'] },
  { id: 'AG-13', name: 'Psicología Deportiva', emoji: '🧠', color: 'from-violet-500 to-purple-400', border: 'border-violet-500/30', desc: 'Mental coaching, manejo de ansiedad pre-competitiva, motivación post-caída y seguimiento emocional del atleta.', tools: ['Mental', 'Motivación', 'Seguimiento'] },
  { id: 'AG-14', name: 'RAG Soporte General', emoji: '💬', color: 'from-teal-500 to-cyan-400', border: 'border-teal-500/30', desc: 'Chatbot para padres y atletas. Responde preguntas frecuentes usando la base de conocimiento del club.', tools: ['FAQ', 'RAG', 'Streaming'] },
];

const chatDemo = [
  { role: 'user', text: '¿Cuántos atletas de juvenil han faltado más de 3 veces este mes?' },
  { role: 'agent', text: 'Consultando la base de datos... He encontrado **4 atletas** en categoría Juvenil con más de 3 inasistencias este mes: Juan P. (5), María G. (4), Carlos R. (4) y Ana S. (3). ¿Quieres que les envíe un recordatorio automático?' },
];

export default function AgentsSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const [activeAgent, setActiveAgent] = useState(0);
  const [chatStep, setChatStep] = useState(0);

  return (
    <section id="agents" className="relative py-24 bg-[#050b18] overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_50%,rgba(59,130,246,0.06),transparent)]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 space-y-4"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/8 text-purple-300 text-sm font-medium">
            🤖 Powered by Claude claude-sonnet-4-6
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white">
            14 Agentes IA{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-violet-300">
              Especializados
            </span>
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Cada agente tiene acceso a la base de datos en tiempo real y a documentos del club mediante RAG.
            Disponibles 24/7 para cada rol del sistema.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Agents grid */}
          <motion.div
            ref={ref}
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ duration: 0.5 }}
            className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3"
          >
            {agents.map((agent, i) => (
              <motion.button
                key={agent.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={inView ? { opacity: 1, scale: 1 } : {}}
                transition={{ delay: i * 0.04, duration: 0.4 }}
                whileHover={{ y: -4, scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setActiveAgent(i)}
                className={`relative rounded-xl border p-3 text-left transition-all duration-200 ${
                  activeAgent === i
                    ? `${agent.border} bg-white/8`
                    : 'border-white/8 bg-white/4 hover:border-white/15'
                }`}
              >
                {activeAgent === i && (
                  <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${agent.color} opacity-8`} />
                )}
                <div className="relative">
                  <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${agent.color} flex items-center justify-center text-lg mb-2 shadow-lg`}>
                    {agent.emoji}
                  </div>
                  <div className="text-white text-xs font-bold leading-tight mb-0.5">{agent.name}</div>
                  <div className="text-slate-500 text-[10px] font-mono">{agent.id}</div>
                </div>
              </motion.button>
            ))}
          </motion.div>

          {/* Agent detail + chat demo */}
          <div className="space-y-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeAgent}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className={`rounded-2xl border ${agents[activeAgent].border} bg-white/5 backdrop-blur-sm p-5 space-y-4`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${agents[activeAgent].color} flex items-center justify-center text-2xl shadow-lg`}>
                    {agents[activeAgent].emoji}
                  </div>
                  <div>
                    <h3 className="text-white font-bold">{agents[activeAgent].name}</h3>
                    <span className="text-slate-500 text-xs font-mono">{agents[activeAgent].id}</span>
                  </div>
                </div>
                <p className="text-slate-300 text-sm leading-relaxed">{agents[activeAgent].desc}</p>
                <div className="flex flex-wrap gap-2">
                  {agents[activeAgent].tools.map((t) => (
                    <span key={t} className={`text-xs px-2 py-0.5 rounded-full border ${agents[activeAgent].border} text-slate-300 bg-white/5`}>
                      {t}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-emerald-400 text-xs font-medium">Activo 24/7 • Claude claude-sonnet-4-6</span>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Live chat demo */}
            <div className="rounded-2xl border border-white/8 bg-white/4 backdrop-blur-sm overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 bg-white/5 border-b border-white/8">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-slate-300 text-xs font-medium">Demo — Agente Admin en vivo</span>
              </div>
              <div className="p-4 space-y-3 min-h-[160px]">
                {chatDemo.slice(0, Math.max(chatStep, 1)).map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-blue-600/80 text-white'
                        : 'bg-white/8 text-slate-200'
                    }`}>
                      {msg.text.replace(/\*\*/g, '')}
                    </div>
                  </motion.div>
                ))}
                {chatStep < chatDemo.length && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setChatStep((s) => Math.min(s + 1, chatDemo.length))}
                    className="w-full text-center text-blue-400 text-xs font-medium py-2 hover:text-blue-300 transition-colors"
                  >
                    {chatStep === 0 ? '▶ Ver demo del chat' : '▶ Ver respuesta del agente'}
                  </motion.button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
