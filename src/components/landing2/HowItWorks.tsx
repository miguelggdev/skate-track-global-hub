import { motion } from 'framer-motion';

const steps = [
  {
    n: '01',
    emoji: '🏗️',
    title: 'Configuras tu club en un día',
    desc: 'Nuestro equipo te ayuda a ingresar los datos de tu club, tus atletas y tus categorías. Sin complicaciones técnicas. En menos de 24 horas ya estás funcionando.',
    detail: 'Incluye importación desde Excel si ya tienes datos.',
    color: 'from-blue-500 to-cyan-400',
    visual: 'card',
  },
  {
    n: '02',
    emoji: '⚙️',
    title: 'El sistema aprende y trabaja solo',
    desc: 'SpeedSkateTrack empieza a gestionar los recordatorios, los cobros, las notificaciones a padres y los reportes. Tú solo supervisas — el sistema ejecuta.',
    detail: 'Sin programar nada. Sin configuraciones complejas.',
    color: 'from-orange-500 to-amber-400',
    visual: 'dashboard',
  },
  {
    n: '03',
    emoji: '📈',
    title: 'Tu club crece y tú recuperas tu tiempo',
    desc: 'Con procesos automatizados, menos errores y toda la información en un solo lugar, puedes enfocarte en crecer el club, mejorar el rendimiento deportivo y atender mejor a tus atletas.',
    detail: 'Promedio: 95 horas recuperadas al mes.',
    color: 'from-emerald-500 to-teal-400',
    visual: 'photo',
  },
];

function AthleteCardPreview() {
  return (
    <div className="relative">
      {/* Real athlete card image */}
      <div className="relative w-48 mx-auto rounded-2xl overflow-hidden shadow-2xl shadow-black/60 rotate-3 hover:rotate-0 transition-transform duration-500">
        <img
          src="/images/skate/athlete-card.jpg"
          alt="Carnet digital de atleta"
          className="w-full h-auto object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
      </div>
      {/* Digital badge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }} transition={{ delay: 0.4 }}
        className="absolute -top-3 -right-2 px-2.5 py-1 rounded-full bg-emerald-500 text-white text-xs font-black shadow-lg shadow-emerald-500/40"
      >
        ✓ Digital
      </motion.div>
    </div>
  );
}

function DashboardPreview() {
  const items = [
    { label: 'Pagos del mes', v: '$4.2M', up: true },
    { label: 'Asistencia hoy', v: '94%', up: true },
    { label: 'Atletas activos', v: '78', up: false },
  ];
  return (
    <div className="w-full max-w-[200px] mx-auto rounded-2xl bg-[#0d1117] border border-white/10 overflow-hidden shadow-2xl">
      <div className="px-3 py-2 bg-white/5 border-b border-white/6 flex items-center gap-1.5">
        <div className="w-2 h-2 rounded-full bg-red-500/70" />
        <div className="w-2 h-2 rounded-full bg-yellow-500/70" />
        <div className="w-2 h-2 rounded-full bg-emerald-500/70" />
        <span className="text-slate-500 text-[9px] ml-1">Dashboard</span>
      </div>
      <div className="p-3 space-y-2">
        {items.map((item) => (
          <div key={item.label} className="flex justify-between items-center">
            <span className="text-slate-500 text-[9px]">{item.label}</span>
            <span className={`font-bold text-[10px] ${item.up ? 'text-emerald-400' : 'text-blue-400'}`}>{item.v}</span>
          </div>
        ))}
        <div className="mt-2 h-1 rounded-full bg-white/5 overflow-hidden">
          <motion.div className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400"
            initial={{ width: 0 }} whileInView={{ width: '72%' }} viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.3 }} />
        </div>
      </div>
    </div>
  );
}

function RacePhotoMini() {
  return (
    <div className="relative w-full max-w-[200px] mx-auto h-32 rounded-2xl overflow-hidden shadow-2xl">
      <img src="/images/skate/race-mass-start.jpg" alt="Competencia" className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
      <div className="absolute bottom-2 left-3">
        <div className="text-white text-xs font-black">+24 clubes creciendo</div>
        <div className="text-emerald-400 text-[10px]">con SpeedSkateTrack</div>
      </div>
    </div>
  );
}

const visuals: Record<string, JSX.Element> = {
  card: <AthleteCardPreview />,
  dashboard: <DashboardPreview />,
  photo: <RacePhotoMini />,
};

export default function HowItWorks() {
  return (
    <section id="how" className="relative py-24 bg-[#080c16] overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,rgba(59,130,246,0.07),transparent)]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ duration: 0.6 }} className="text-center mb-16 space-y-4">
          <span className="text-blue-400 text-sm font-bold uppercase tracking-widest">Simple como debe ser</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white">
            Empiezas en 3 pasos.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">Sin conocimientos técnicos.</span>
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            No necesitas saber de tecnología. Si sabes gestionar un club, sabes usar SpeedSkateTrack.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="relative">
          <div className="hidden lg:block absolute top-20 left-[16.5%] right-[16.5%] h-px bg-gradient-to-r from-blue-500/30 via-orange-500/30 to-emerald-500/30" />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {steps.map((step, i) => (
              <motion.div key={step.n}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.6 }}
                className="relative text-center space-y-5"
              >
                {/* Visual */}
                <div className="min-h-[140px] flex items-center justify-center">
                  {visuals[step.visual]}
                </div>

                {/* Number bubble */}
                <div className="relative inline-flex items-center justify-center">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center text-2xl shadow-xl`}>
                    {step.emoji}
                  </div>
                  <div className={`absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center text-white text-xs font-black shadow-lg`}>
                    {step.n.slice(1)}
                  </div>
                </div>

                <h3 className="text-white font-black text-xl">{step.title}</h3>
                <p className="text-slate-400 leading-relaxed text-sm">{step.desc}</p>
                <div className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border border-white/10 text-transparent bg-clip-text bg-gradient-to-r ${step.color}`}>
                  ✓ {step.detail}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Testimonial bridge */}
        <motion.div initial={{ opacity: 0, scale: 0.97 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-16 max-w-2xl mx-auto text-center p-6 rounded-2xl border border-white/8 bg-white/4 backdrop-blur-sm">
          <p className="text-slate-300 text-lg italic mb-3">
            "Instalamos SpeedSkateTrack un viernes. El lunes ya teníamos los recordatorios de entrenamiento funcionando solos y los padres preguntaban mucho menos por WhatsApp."
          </p>
          <div className="flex items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-xl">👨‍💼</div>
            <div className="text-left">
              <div className="text-white font-bold text-sm">Carlos Morales</div>
              <div className="text-slate-500 text-xs">Director — Club Élite Bogotá</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
