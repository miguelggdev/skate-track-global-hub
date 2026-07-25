import { useRef, useEffect, useState } from 'react';
import { motion, useInView } from 'framer-motion';

const stats = [
  { value: 95, suffix: 'h/mes', label: 'Ahorradas en tareas admin', icon: '⏱️', color: 'from-blue-500 to-cyan-400' },
  { value: 14, suffix: '', label: 'Agentes IA Especializados', icon: '🤖', color: 'from-purple-500 to-violet-400' },
  { value: 35, suffix: '', label: 'Automatizaciones activas', icon: '⚡', color: 'from-orange-500 to-amber-400' },
  { value: 88, suffix: '%', label: 'Tasa de retención de atletas', icon: '🏆', color: 'from-emerald-500 to-teal-400' },
];

function Counter({ value, suffix, active }: { value: number; suffix: string; active: boolean }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!active) return;
    let start = 0;
    const duration = 1800;
    const step = 16;
    const total = duration / step;
    const increment = value / total;
    const timer = setInterval(() => {
      start += increment;
      if (start >= value) { setCount(value); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, step);
    return () => clearInterval(timer);
  }, [active, value]);

  return <span>{count}{suffix}</span>;
}

export default function StatsSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section ref={ref} className="relative py-16 bg-[#020817] overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-transparent to-cyan-500/5" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="relative group"
            >
              <div className="relative rounded-2xl border border-white/8 bg-white/4 backdrop-blur-sm p-6 text-center hover:border-white/15 hover:bg-white/6 transition-all duration-300 overflow-hidden">
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                <div className="text-3xl mb-3">{stat.icon}</div>
                <div className={`text-4xl lg:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r ${stat.color} tabular-nums mb-2`}>
                  <Counter value={stat.value} suffix={stat.suffix} active={inView} />
                </div>
                <p className="text-slate-400 text-sm font-medium leading-snug">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
