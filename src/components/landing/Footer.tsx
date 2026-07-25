import { motion } from 'framer-motion';

const links = {
  Producto: ['Características', 'Agentes IA', 'Automatizaciones', 'Dashboards', 'Precios'],
  Soluciones: ['Clubes de Patinaje', 'Federaciones', 'Escuelas Deportivas', 'Liga Virtual', 'Multi-club'],
  Recursos: ['Documentación', 'API Developers', 'Blog', 'Casos de Éxito', 'Webinars'],
  Empresa: ['Sobre Nosotros', 'Contacto', 'Privacidad', 'Términos', 'Seguridad'],
};

const socials = [
  { name: 'Instagram', emoji: '📸', href: '#' },
  { name: 'LinkedIn', emoji: '💼', href: '#' },
  { name: 'YouTube', emoji: '▶️', href: '#' },
  { name: 'WhatsApp', emoji: '💬', href: '#' },
];

export default function Footer() {
  return (
    <footer className="relative bg-[#020817] border-t border-white/5 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_40%_30%_at_50%_100%,rgba(59,130,246,0.05),transparent)]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top section */}
        <div className="py-16 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-10">
          {/* Brand */}
          <div className="col-span-2 space-y-5">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <span className="text-white text-xl">⛸️</span>
              </div>
              <span className="text-white font-black text-xl tracking-tight">
                Skate<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">Track</span>
              </span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
              La plataforma más inteligente para gestión de clubes de patinaje de velocidad. 14 agentes IA + 35 automatizaciones.
            </p>
            <div className="flex gap-3">
              {socials.map((s) => (
                <motion.a
                  key={s.name}
                  href={s.href}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-9 h-9 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center hover:border-white/20 hover:bg-white/10 transition-all text-base"
                  title={s.name}
                >
                  {s.emoji}
                </motion.a>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-400 text-xs font-medium">Uptime 99.9% — Todos los sistemas operativos</span>
            </div>
          </div>

          {/* Links */}
          {Object.entries(links).map(([category, items]) => (
            <div key={category} className="space-y-4">
              <h4 className="text-white font-bold text-sm">{category}</h4>
              <ul className="space-y-2.5">
                {items.map((item) => (
                  <li key={item}>
                    <a href="#" className="text-slate-400 hover:text-white text-sm transition-colors duration-200">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Tech stack row */}
        <div className="py-6 border-t border-white/5 flex flex-wrap items-center justify-center gap-6">
          {['React 18', 'TypeScript', 'Supabase', 'Python + Celery', 'LangGraph', 'Claude claude-sonnet-4-6'].map((tech) => (
            <span key={tech} className="text-slate-600 text-xs font-mono hover:text-slate-400 transition-colors cursor-default">
              {tech}
            </span>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="py-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-slate-500 text-sm">
            © 2026 SkateTrack. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-6">
            {['Privacidad', 'Términos', 'Cookies', 'Seguridad'].map((l) => (
              <a key={l} href="#" className="text-slate-500 hover:text-slate-300 text-xs transition-colors">
                {l}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-2 text-slate-600 text-xs">
            <span>Hecho con ❤️ para el patinaje de velocidad</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
