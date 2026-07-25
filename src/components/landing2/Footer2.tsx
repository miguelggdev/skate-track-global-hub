import { motion } from 'framer-motion';
import SpeedSkateIcon from './SpeedSkateIcon';

const links = {
  Producto: ['Características', 'Precios', 'Novedades', 'Hoja de ruta'],
  'Para el Club': ['Entrenadores', 'Administradores', 'Padres y Atletas', 'Federaciones'],
  Empresa: ['Sobre nosotros', 'Blog', 'Casos de éxito', 'Contacto'],
  Legal: ['Privacidad', 'Términos de uso', 'Cookies', 'GDPR'],
};

export default function Footer2() {
  return (
    <footer className="relative bg-[#040609] border-t border-white/6 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_30%_at_50%_0%,rgba(59,130,246,0.03),transparent)]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main footer */}
        <div className="py-16 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-10">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-3 lg:col-span-1 space-y-5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-orange-500 flex items-center justify-center">
                <SpeedSkateIcon size={22} primaryColor="#fff" secondaryColor="#fed7aa" wheelColor="#FFF" />
              </div>
              <span className="text-white font-black text-lg">
                SpeedSkate<span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300">Track</span>
              </span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
              La plataforma inteligente para gestionar tu club de patinaje de velocidad. Menos papeleo, más deporte.
            </p>
            {/* Social */}
            <div className="flex gap-3">
              {[
                { label: 'Instagram', icon: '📸' },
                { label: 'Facebook', icon: '📘' },
                { label: 'YouTube', icon: '▶️' },
                { label: 'LinkedIn', icon: '💼' },
              ].map((s) => (
                <motion.a key={s.label} whileHover={{ y: -2 }}
                  href="#" aria-label={s.label}
                  className="w-9 h-9 rounded-xl bg-white/6 border border-white/8 flex items-center justify-center text-base hover:bg-white/10 transition-colors">
                  {s.icon}
                </motion.a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(links).map(([category, items]) => (
            <div key={category} className="space-y-4">
              <h4 className="text-white font-bold text-sm uppercase tracking-widest">{category}</h4>
              <ul className="space-y-2.5">
                {items.map((item) => (
                  <li key={item}>
                    <a href="#" className="text-slate-400 text-sm hover:text-white transition-colors">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="py-6 border-t border-white/6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-slate-500 text-sm">
            © 2026 SpeedSkateTrack. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-4 text-slate-500 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Sistema operativo al 99.9%
            </span>
            <span>Hecho con ❤️ para el patinaje de velocidad</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
