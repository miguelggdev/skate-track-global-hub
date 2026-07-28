import React, { useCallback, useRef } from 'react';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';

interface ThemeToggleProps {
  className?: string;
}

const SunIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
  </svg>
);

const MoonIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

const RAY_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className }) => {
  const { theme, setTheme } = useTheme();
  const isDark = theme === 'dark';
  const btnRef = useRef<HTMLButtonElement>(null);

  const handleToggle = useCallback(() => {
    // Ripple transition effect
    const overlay = document.createElement('div');
    const btn = btnRef.current;
    if (btn) {
      const rect = btn.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const maxRadius = Math.hypot(
        Math.max(cx, window.innerWidth - cx),
        Math.max(cy, window.innerHeight - cy)
      ) * 2.2;

      overlay.style.cssText = `
        position: fixed;
        inset: 0;
        z-index: 9998;
        pointer-events: none;
        border-radius: 50%;
        width: 0;
        height: 0;
        left: ${cx}px;
        top: ${cy}px;
        transform: translate(-50%, -50%);
        background: ${isDark ? '#f6f8fb' : '#06080f'};
        transition: width 0.55s cubic-bezier(0.4,0,0.2,1),
                    height 0.55s cubic-bezier(0.4,0,0.2,1),
                    opacity 0.2s ease 0.5s;
        opacity: 1;
      `;
      document.body.appendChild(overlay);

      requestAnimationFrame(() => {
        overlay.style.width = `${maxRadius}px`;
        overlay.style.height = `${maxRadius}px`;
        setTimeout(() => {
          setTheme(isDark ? 'light' : 'dark');
          setTimeout(() => {
            overlay.style.opacity = '0';
            setTimeout(() => overlay.remove(), 220);
          }, 80);
        }, 300);
      });
    } else {
      setTheme(isDark ? 'light' : 'dark');
    }
  }, [isDark, setTheme]);

  return (
    <motion.button
      ref={btnRef}
      onClick={handleToggle}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.9 }}
      aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      className={`
        relative h-9 w-16 rounded-full border-2 flex items-center p-0.5 focus:outline-none
        transition-colors duration-300
        ${isDark
          ? 'border-orange-500/40 bg-slate-900/80'
          : 'border-orange-400/50 bg-orange-50'
        }
        ${className ?? ''}
      `}
    >
      {/* Track */}
      <motion.div
        className="absolute inset-0 rounded-full overflow-hidden pointer-events-none"
        initial={false}
      >
        {/* Stars (dark mode) */}
        <AnimatePresence>
          {isDark && (
            <motion.div
              key="stars"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0"
            >
              {[
                { x: '20%', y: '25%', size: 1.5, delay: 0 },
                { x: '65%', y: '20%', size: 1, delay: 0.1 },
                { x: '80%', y: '55%', size: 1.5, delay: 0.2 },
                { x: '30%', y: '65%', size: 1, delay: 0.15 },
                { x: '55%', y: '70%', size: 1.2, delay: 0.05 },
              ].map((s, i) => (
                <motion.div
                  key={i}
                  className="absolute rounded-full bg-white"
                  style={{
                    left: s.x, top: s.y,
                    width: s.size, height: s.size,
                    transform: 'translate(-50%,-50%)',
                  }}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: s.delay, duration: 0.2 }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sun rays (light mode) */}
        <AnimatePresence>
          {!isDark && (
            <motion.div
              key="rays"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0"
            >
              {RAY_ANGLES.map((angle, i) => (
                <motion.div
                  key={angle}
                  className="absolute top-1/2 left-[25%] origin-left"
                  style={{
                    width: 4, height: 1.2,
                    background: 'rgba(251,146,60,0.35)',
                    borderRadius: 99,
                    transform: `translateY(-50%) rotate(${angle}deg)`,
                    marginTop: 0,
                  }}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: i * 0.03, duration: 0.2 }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Thumb */}
      <motion.div
        layout
        animate={{
          x: isDark ? 28 : 0,
          rotate: isDark ? -20 : 0,
          scale: 1,
        }}
        transition={{
          type: 'spring',
          stiffness: 400,
          damping: 25,
        }}
        className={`
          relative z-10 h-6 w-6 rounded-full shadow-md flex items-center justify-center
          transition-colors duration-300
          ${isDark
            ? 'bg-gradient-to-br from-slate-700 to-slate-900 text-blue-200 shadow-slate-900/60'
            : 'bg-gradient-to-br from-orange-400 to-orange-500 text-white shadow-orange-300/60'
          }
        `}
      >
        <AnimatePresence mode="wait">
          {isDark ? (
            <motion.span
              key="moon"
              initial={{ rotate: 90, opacity: 0, scale: 0.5 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              exit={{ rotate: -90, opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.25 }}
            >
              <MoonIcon />
            </motion.span>
          ) : (
            <motion.span
              key="sun"
              initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.25 }}
            >
              <SunIcon />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Tooltip label */}
      <span className="sr-only">{isDark ? 'Activar modo claro' : 'Activar modo oscuro'}</span>
    </motion.button>
  );
};
