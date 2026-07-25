import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const testimonials = [
  {
    quote: 'Antes pasaba mis domingos armando el reporte semanal y respondiendo mensajes de padres. Ahora el sistema lo hace solo y el domingo lo paso con mi familia. Eso no tiene precio.',
    name: 'Carlos Morales',
    role: 'Director General',
    club: 'Club Élite Bogotá',
    rating: 5,
    avatar: '👨‍💼',
    metric: '20h/semana recuperadas',
  },
  {
    quote: 'Teníamos 8 atletas con pagos vencidos y no sabíamos cómo cobrarles sin incomodar la relación. SpeedSkateTrack lo hace automático y de forma amable. Los 8 pagaron en la primera semana.',
    name: 'Sandra Ríos',
    role: 'Coordinadora Financiera',
    club: 'Academia Sprint Medellín',
    rating: 5,
    avatar: '👩‍💼',
    metric: '$2.4M recuperados en 1 semana',
  },
  {
    quote: 'Los padres dejaron de llamarme a las 9pm preguntando por horarios. Ahora el sistema les responde. Mis entrenadores también están felices porque pueden ver los calendarios sin preguntarme.',
    name: 'David Suárez',
    role: 'Director Técnico',
    club: 'Club Velocidad Cali',
    rating: 5,
    avatar: '🧑‍💼',
    metric: '-85% mensajes recibidos',
  },
  {
    quote: 'La competencia terminó el sábado a las 3pm y a las 3:20pm ya todos los padres tenían los resultados de sus hijos. Antes tardábamos 3 días. Ese cambio solo ya vale lo que pagamos.',
    name: 'María González',
    role: 'Secretaria de Club',
    club: 'Patinaños Medellín',
    rating: 5,
    avatar: '👩‍🏫',
    metric: '3 días → 20 minutos',
  },
  {
    quote: 'Al principio pensé que era complicado de usar, pero el equipo me ayudó a configurarlo en una tarde. En serio, en UNA tarde. Y ya llevo 4 meses sin mirar un Excel para el club.',
    name: 'Roberto Herrera',
    role: 'Fundador',
    club: 'Club Desliza Barranquilla',
    rating: 5,
    avatar: '👨‍🏫',
    metric: '0 Excel desde hace 4 meses',
  },
];

export default function Testimonials() {
  const [active, setActive] = useState(0);

  return (
    <section id="testimonials" className="relative py-24 overflow-hidden">
      {/* Race photo as atmospheric background */}
      <div className="absolute inset-0">
        <img
          src="/images/skate/race-latam.jpg"
          alt=""
          className="w-full h-full object-cover object-center opacity-15"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#080c16] via-[#080c16]/80 to-[#080c16]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_50%,rgba(139,92,246,0.08),transparent)]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ duration: 0.6 }} className="text-center mb-16 space-y-4">
          <span className="text-violet-400 text-sm font-bold uppercase tracking-widest">Lo que dicen los directivos</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white">
            Personas reales.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-pink-300">Resultados reales.</span>
          </h2>
          <p className="text-slate-400 text-base max-w-xl mx-auto">
            Directivos de clubes como el tuyo, en Colombia, México, Perú y España.
          </p>
        </motion.div>

        {/* Main testimonial */}
        <AnimatePresence mode="wait">
          <motion.div key={active} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
            className="max-w-3xl mx-auto mb-8 p-8 rounded-3xl border border-white/10 bg-black/50 backdrop-blur-md text-center">
            <div className="flex justify-center gap-1 mb-6">
              {'⭐'.repeat(testimonials[active].rating).split('').map((s, i) => <span key={i} className="text-xl">{s}</span>)}
            </div>
            <blockquote className="text-xl sm:text-2xl text-white font-medium leading-relaxed mb-8 italic">
              "{testimonials[active].quote}"
            </blockquote>
            <div className="flex items-center justify-center gap-4 mb-5">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-2xl">
                {testimonials[active].avatar}
              </div>
              <div className="text-left">
                <div className="text-white font-black text-lg">{testimonials[active].name}</div>
                <div className="text-slate-400 text-sm">{testimonials[active].role} · {testimonials[active].club}</div>
              </div>
            </div>
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-950/50 border border-emerald-500/30 text-emerald-400 font-bold text-sm">
              📈 {testimonials[active].metric}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Selector */}
        <div className="flex justify-center gap-3 flex-wrap">
          {testimonials.map((t, i) => (
            <motion.button key={t.name} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
              onClick={() => setActive(i)}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                active === i
                  ? 'border-violet-500/60 bg-violet-950/50 text-white backdrop-blur-sm'
                  : 'border-white/8 bg-black/30 text-slate-400 hover:text-slate-200 backdrop-blur-sm'
              }`}>
              <span className="text-lg">{t.avatar}</span>
              <span>{t.name}</span>
            </motion.button>
          ))}
        </div>

        {/* Race context strip */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-14 rounded-2xl overflow-hidden border border-white/8 relative h-40">
          <img src="/images/skate/race-pack.jpg" alt="Competencia" className="w-full h-full object-cover object-top opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#080c16] via-transparent to-[#080c16]" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-16 text-center px-8">
              {[
                { n: '+47', label: 'Clubes activos' },
                { n: '4.9/5', label: 'Valoración media' },
                { n: '+800', label: 'Atletas gestionados' },
                { n: '100%', label: 'Renuevan al 2° mes' },
              ].map((s) => (
                <div key={s.label}>
                  <div className="text-2xl sm:text-3xl font-black text-white">{s.n}</div>
                  <div className="text-slate-400 text-xs mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
