# /ui-ux-pro-max — Rediseño UI/UX de nivel profesional

Audita y eleva el diseño visual de cualquier componente, página o sección al máximo nivel. Aplica principios de diseño de productos como Linear, Vercel, Stripe y Raycast.

## Fase 1 — Auditoría visual (leer antes de tocar)

1. **Identifica el componente/página objetivo** del mensaje del usuario
2. **Lee los archivos actuales** — entiende la estructura antes de proponer cambios
3. **Evalúa estos puntos** y anota cuáles fallan:
   - [ ] Jerarquía visual clara (tamaños, pesos, contraste)
   - [ ] Sistema de espaciado consistente (múltiplos de 4px/8px)
   - [ ] Paleta de colores coherente con el design system
   - [ ] Estados interactivos (hover, focus, active, disabled)
   - [ ] Estados de carga (skeleton, spinner, shimmer)
   - [ ] Estados vacíos (empty states con acción)
   - [ ] Estados de error (mensaje claro + acción de recuperación)
   - [ ] Responsive en 3 breakpoints (mobile 375px / tablet 768px / desktop 1280px)
   - [ ] Accesibilidad básica (contraste WCAG AA, aria-labels, keyboard nav)
   - [ ] Animaciones con propósito (entrada, salida, feedback)
   - [ ] Tipografía: tamaño, line-height, letter-spacing
   - [ ] Modo oscuro completo

## Fase 2 — Mejoras a implementar

### Paleta y tokens
```css
--color-primary: oklch(65% 0.22 250);
--color-accent: oklch(70% 0.19 40);
--color-surface: oklch(12% 0.01 250);
--color-surface-raised: oklch(16% 0.01 250);
--color-border: oklch(25% 0.01 250);
--color-text: oklch(95% 0 0);
--color-text-muted: oklch(60% 0 0);
```

### Tipografía profesional
```css
.heading-display { font-size: clamp(2rem, 5vw, 4rem); font-weight: 900; letter-spacing: -0.03em; line-height: 1.05; }
.heading-1 { font-size: clamp(1.5rem, 3vw, 2.25rem); font-weight: 800; letter-spacing: -0.02em; line-height: 1.1; }
.body-lg { font-size: 1.125rem; line-height: 1.7; }
.label { font-size: 0.75rem; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; }
```

### Cards profesionales
```tsx
<div className="relative rounded-2xl border border-white/8 bg-white/4 backdrop-blur-sm
  p-6 overflow-hidden transition-all duration-300
  hover:border-white/15 hover:bg-white/6 hover:-translate-y-1
  hover:shadow-xl hover:shadow-black/30 group">
  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent
    opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
</div>
```

### Botones con micro-interacciones
```tsx
// Primario
<button className="relative px-6 py-3 rounded-xl font-bold text-white overflow-hidden
  bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg shadow-blue-500/30
  hover:shadow-xl hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98]
  transition-all duration-200">

// Secundario ghost
<button className="px-6 py-3 rounded-xl font-semibold text-slate-300
  border border-white/10 hover:border-white/25 hover:text-white hover:bg-white/5
  transition-all duration-200">
```

### Animaciones Framer Motion
```tsx
const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.23, 1, 0.32, 1] } } };
const spring = { type: 'spring', stiffness: 400, damping: 30 };
```

### Badges semánticos
```tsx
const statusStyles = {
  active:  'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  warning: 'bg-amber-500/15   text-amber-400   border-amber-500/25',
  error:   'bg-red-500/15     text-red-400     border-red-500/25',
  info:    'bg-blue-500/15    text-blue-400    border-blue-500/25',
};
```

### Gradientes de texto
```tsx
<span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300">
```

## Fase 3 — Checklist final

- [ ] Mobile 375px / Tablet 768px / Desktop 1280px ✓
- [ ] Hover, focus, disabled implementados ✓
- [ ] Sin colores hardcoded ✓
- [ ] Contraste WCAG AA mínimo 4.5:1 ✓
- [ ] aria-labels en iconos y botones ✓

## Uso

```
/ui-ux-pro-max [componente o sección a mejorar]
```

Ejemplos:
- `/ui-ux-pro-max hero section`
- `/ui-ux-pro-max pricing cards`
- `/ui-ux-pro-max navbar`
- `/ui-ux-pro-max toda la landing`

## Reglas de oro

1. Nunca romper funcionalidad — el rediseño es aditivo
2. Mobile first — empieza en 375px
3. Un cambio = un propósito visual
4. Consistencia sobre creatividad
5. Documenta qué mejoró y por qué
