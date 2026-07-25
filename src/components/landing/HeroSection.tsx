import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Zap, Shield, Brain } from 'lucide-react';

const WORDS = ['Patinaje de Velocidad', 'Gestión de Atletas', 'Automatizaciones IA', 'Resultados en Tiempo Real'];

function TypewriterText() {
  const [idx, setIdx] = useState(0);
  const [displayed, setDisplayed] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const word = WORDS[idx];
    let timer: ReturnType<typeof setTimeout>;
    if (!deleting && displayed.length < word.length) {
      timer = setTimeout(() => setDisplayed(word.slice(0, displayed.length + 1)), 60);
    } else if (!deleting && displayed.length === word.length) {
      timer = setTimeout(() => setDeleting(true), 2000);
    } else if (deleting && displayed.length > 0) {
      timer = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 35);
    } else if (deleting && displayed.length === 0) {
      setDeleting(false);
      setIdx((i) => (i + 1) % WORDS.length);
    }
    return () => clearTimeout(timer);
  }, [displayed, deleting, idx]);

  return (
    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-400">
      {displayed}
      <span className="animate-pulse">|</span>
    </span>
  );
}

function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const particles: { x: number; y: number; vx: number; vy: number; r: number; alpha: number }[] = [];
    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        r: Math.random() * 1.5 + 0.5,
        alpha: Math.random() * 0.5 + 0.1,
      });
    }

    let raf: number;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(99,179,237,${p.alpha})`;
        ctx.fill();
      });

      // Draw connections
      particles.forEach((a, i) => {
        particles.slice(i + 1).forEach((b) => {
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          if (dist < 100) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(99,179,237,${0.08 * (1 - dist / 100)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-60" />;
}

const badges = [
  { icon: Brain, label: '14 Agentes IA', color: 'from-purple-500 to-violet-500' },
  { icon: Zap, label: '35 Automatizaciones', color: 'from-orange-500 to-amber-400' },
  { icon: Shield, label: 'Seguridad Total', color: 'from-emerald-500 to-teal-400' },
];

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-[#020817]">
      {/* Animated gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-blue-600/15 blur-[120px] animate-orb-1" />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full bg-cyan-500/10 blur-[100px] animate-orb-2" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-purple-600/8 blur-[120px] animate-orb-3" />
      </div>

      {/* Speed lines */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute h-px bg-gradient-to-r from-transparent via-blue-400/20 to-transparent animate-speed-line"
            style={{
              top: `${10 + i * 12}%`,
              left: '-100%',
              width: `${60 + Math.random() * 40}%`,
              animationDelay: `${i * 0.4}s`,
              animationDuration: `${3 + i * 0.5}s`,
            }}
          />
        ))}
      </div>

      <ParticleCanvas />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Text */}
          <div className="space-y-8">
            {/* Eyebrow */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-blue-500/30 bg-blue-500/10 backdrop-blur-sm"
            >
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
              <span className="text-blue-300 text-sm font-medium">Plataforma de Gestión Inteligente</span>
            </motion.div>

            {/* Headline */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="space-y-3"
            >
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight tracking-tight">
                El sistema más{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
                  inteligente
                </span>
                <br />
                para tu club de
              </h1>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight tracking-tight min-h-[1.2em]">
                <TypewriterText />
              </h1>
            </motion.div>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-slate-400 text-lg leading-relaxed max-w-xl"
            >
              Gestiona atletas, entrenamientos y competencias con{' '}
              <strong className="text-slate-200">14 agentes de IA especializados</strong> y{' '}
              <strong className="text-slate-200">35 automatizaciones</strong> con Celery + LangGraph.
              Ahorra hasta <strong className="text-cyan-400">95 horas al mes</strong>.
            </motion.p>

            {/* Badges */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-wrap gap-3"
            >
              {badges.map((b) => (
                <div
                  key={b.label}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 backdrop-blur-sm"
                >
                  <div className={`w-5 h-5 rounded-md bg-gradient-to-br ${b.color} flex items-center justify-center`}>
                    <b.icon className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-slate-300 text-sm font-medium">{b.label}</span>
                </div>
              ))}
            </motion.div>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <motion.a
                href="#cta"
                onClick={(e) => { e.preventDefault(); document.querySelector('#cta')?.scrollIntoView({ behavior: 'smooth' }); }}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold text-base shadow-2xl shadow-blue-500/40 hover:shadow-blue-500/60 transition-all"
              >
                <Zap className="w-5 h-5" />
                Solicitar Demo Gratis
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </motion.a>
              <motion.a
                href="#features"
                onClick={(e) => { e.preventDefault(); document.querySelector('#features')?.scrollIntoView({ behavior: 'smooth' }); }}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl border border-white/15 bg-white/5 text-white font-semibold text-base backdrop-blur-sm hover:bg-white/10 transition-all"
              >
                Ver características
              </motion.a>
            </motion.div>
          </div>

          {/* Right: Dashboard mockup */}
          <motion.div
            initial={{ opacity: 0, x: 60, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
            className="relative hidden lg:block"
          >
            {/* Glow behind mockup */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-cyan-500/10 rounded-3xl blur-3xl scale-110" />
            {/* Browser chrome */}
            <div className="relative rounded-2xl border border-white/10 bg-[#0d1117] shadow-2xl shadow-black/50 overflow-hidden">
              {/* Browser bar */}
              <div className="flex items-center gap-2 px-4 py-3 bg-[#161b22] border-b border-white/5">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/70" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                  <div className="w-3 h-3 rounded-full bg-green-500/70" />
                </div>
                <div className="flex-1 mx-4">
                  <div className="bg-[#0d1117] rounded-lg px-3 py-1.5 text-slate-500 text-xs font-mono">
                    app.skatetrack.io/admin-dashboard
                  </div>
                </div>
              </div>
              {/* Fake dashboard content */}
              <div className="p-5 space-y-4">
                {/* KPI row */}
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: 'Atletas', value: '142', color: 'from-blue-500 to-cyan-400', icon: '👥' },
                    { label: 'Asistencia', value: '91%', color: 'from-emerald-500 to-teal-400', icon: '✅' },
                    { label: 'Ingresos', value: '$48K', color: 'from-amber-500 to-orange-400', icon: '💰' },
                    { label: 'Medallas', value: '38', color: 'from-purple-500 to-violet-400', icon: '🏅' },
                  ].map((kpi) => (
                    <div key={kpi.label} className="rounded-xl bg-white/5 border border-white/8 p-3 space-y-1">
                      <div className="text-lg">{kpi.icon}</div>
                      <div className={`text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r ${kpi.color}`}>
                        {kpi.value}
                      </div>
                      <div className="text-slate-500 text-[10px] font-medium uppercase tracking-wide">{kpi.label}</div>
                    </div>
                  ))}
                </div>
                {/* Chart placeholder */}
                <div className="rounded-xl bg-white/5 border border-white/8 p-4 h-28 flex items-end gap-1.5 overflow-hidden">
                  {[45, 62, 38, 78, 55, 90, 67, 82, 71, 95, 88, 100].map((h, i) => (
                    <motion.div
                      key={i}
                      initial={{ scaleY: 0 }}
                      animate={{ scaleY: 1 }}
                      transition={{ delay: 0.8 + i * 0.05, duration: 0.5 }}
                      style={{ height: `${h}%`, transformOrigin: 'bottom' }}
                      className={`flex-1 rounded-t-sm ${i === 11 ? 'bg-gradient-to-t from-blue-600 to-cyan-400' : 'bg-blue-600/30'}`}
                    />
                  ))}
                </div>
                {/* Agent chat bubble */}
                <div className="rounded-xl bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 p-3 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-sm flex-shrink-0">🤖</div>
                  <div className="text-slate-300 text-xs leading-relaxed">
                    <span className="text-blue-400 font-semibold">Asistente IA: </span>
                    Hoy tienes 3 entrenamientos con 54 atletas. 8 pagos vencidos. ¡Próxima competencia en 5 días!
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <span className="text-slate-500 text-xs tracking-widest uppercase">Explorar</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="w-5 h-8 rounded-full border border-white/20 flex items-start justify-center p-1"
          >
            <div className="w-1 h-2 rounded-full bg-white/40" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
