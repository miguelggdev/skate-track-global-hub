import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import SpeedSkateIcon from './SpeedSkateIcon';

const links = [
  { label: 'Beneficios', href: '#benefits' },
  { label: 'Cómo funciona', href: '#how' },
  { label: 'El asistente IA', href: '#ai' },
  { label: 'Testimonios', href: '#testimonials' },
  { label: 'Precios', href: '#pricing' },
];

export default function Nav2() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const go = (href: string) => {
    setOpen(false);
    document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <motion.header
      initial={{ y: -70, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-[#06080f]/95 backdrop-blur-xl border-b border-white/6 shadow-lg shadow-black/30' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16 md:h-18">
        {/* Logo */}
        <a href="#" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center shadow-lg shadow-blue-700/40 group-hover:shadow-blue-500/50 transition-shadow">
            <SpeedSkateIcon size={28} primaryColor="#60A5FA" secondaryColor="#BFDBFE" wheelColor="#FCD34D" />
          </div>
          <div className="leading-none">
            <span className="text-white font-black text-lg tracking-tight">
              SpeedSkate<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-orange-400">Track</span>
            </span>
            <div className="text-slate-500 text-[9px] font-medium tracking-widest uppercase">Club Management</div>
          </div>
        </a>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-7">
          {links.map((l) => (
            <button key={l.href} onClick={() => go(l.href)}
              className="text-slate-300 hover:text-white text-sm font-medium transition-colors relative group">
              {l.label}
              <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-gradient-to-r from-blue-400 to-orange-400 group-hover:w-full transition-all duration-300" />
            </button>
          ))}
        </nav>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-3">
          <a href="/login" className="text-slate-400 hover:text-white text-sm transition-colors">Iniciar sesión</a>
          <motion.button
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
            onClick={() => go('#cta')}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white text-sm font-bold shadow-lg shadow-orange-500/30 hover:shadow-orange-400/50 transition-shadow"
          >
            Prueba 30 días gratis →
          </motion.button>
        </div>

        {/* Mobile */}
        <button className="md:hidden text-slate-300 p-2" onClick={() => setOpen(!open)}>
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="md:hidden bg-[#06080f]/98 backdrop-blur-xl border-b border-white/6 px-4 py-6 space-y-4">
            {links.map((l) => (
              <button key={l.href} onClick={() => go(l.href)} className="block w-full text-left text-slate-300 hover:text-white font-medium py-2 text-base">{l.label}</button>
            ))}
            <div className="pt-4 border-t border-white/10">
              <button onClick={() => go('#cta')} className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold">
                Prueba 30 días gratis →
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
