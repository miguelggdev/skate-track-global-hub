# SPEC-050 — Design System: Unificación con Landing Page
**Status:** `done`
**Agente:** AG-CLAUDE-FRONTEND
**Sprint:** 01
**Prioridad:** ALTA

---

## Propósito
Aplicar el design system de la landing page (`speedskatetrack-landing`) a la app principal,
creando una identidad visual coherente entre ambas propiedades.

---

## Design System Extraído (Landing Page)

### Paleta de colores
| Token | Hex | HSL | Uso |
|---|---|---|---|
| Background | `#06080f` | `228 43% 4%` | Fondo base (muy oscuro navy) |
| Card | `#0b0f1a` | `224 38% 7%` | Cards y paneles |
| Foreground | `#f1f5f9` | `210 40% 96%` | Texto principal (slate-100) |
| Primary | `#f97316` | `21 90% 53%` | Naranja — CTAs, activos, énfasis |
| Secondary | `#3b82f6` | `217 91% 60%` | Azul — información, secundario |
| Muted | `#111620` | `222 30% 11%` | Backgrounds sutiles |
| Border | ~white/8 | `225 20% 14%` | Bordes muy sutiles |

### Tipografía
- **Font:** Inter (900 black para headings, 300-400 para body)
- **Feature settings:** `cv02, cv03, cv04, cv11, ss01`
- **Tracking:** tight para headings (`-0.025em` a `-0.035em`)

### Componentes signature
- **Sidebar nav activo:** gradiente naranja de izquierda a transparente + borde izquierdo naranja
- **Cards:** `glass-card` con `backdrop-blur` y `border border-white/8`
- **Orbs decorativos:** blobs animados `blur-[80px]` de color naranja/azul en esquinas
- **Botón primario:** gradiente `from-orange-500 to-orange-700` con sombra `shadow-orange-500/30`
- **Scrollbar:** `6px`, track `#06080f`, thumb `rgba(255,255,255,0.08)`
- **Focus ring:** `2px solid rgba(249,115,22,0.7)` (naranja)

### Animaciones
- `animate-orb-1/2`: orbs flotantes en sidebar
- `animate-fade-in`: fade + slide-up 8px, 0.4s
- `animate-scale-in`: scale 0.95→1, 0.3s

---

## Cambios Implementados

### `src/index.css`
- ✅ `:root` actualizado a paleta oscura del landing (reemplaza cyan por naranja)
- ✅ `.dark` espeja los mismos valores (siempre oscuro)
- ✅ `html { color-scheme: dark; }` forzado
- ✅ Inter font con `font-feature-settings`
- ✅ `::selection` naranja/35%
- ✅ Scrollbar dark style
- ✅ Utilidades: `.glass-card`, `.section-label-*`, `.gradient-text-*`
- ✅ `.sidebar-nav-item` con estado active naranja
- ✅ Gradientes de dashboard actualizados a naranja/azul
- ✅ Keyframes: orb-1, orb-2, shimmer, fadeIn, scaleIn

### `src/components/layout/DashboardLayout.tsx`
- ✅ Sidebar: `bg-[#030509]/98 backdrop-blur-xl border border-white/6`
- ✅ Logo: `SpeedSkateLogoMark` con gradiente naranja + tipografía landing
- ✅ Nav activo: gradiente naranja + borde izquierdo naranja 2px
- ✅ Nav inactivo: `text-slate-400 hover:text-white hover:bg-white/5`
- ✅ Orbs decorativos animados en sidebar
- ✅ Footer del sidebar rediseñado con avatar naranja
- ✅ Mobile overlay con `backdrop-blur-sm`
- ✅ Usa `useLocation()` para comparar ruta activa real

### `src/components/layout/TopNavigation.tsx`
- ✅ Header: `bg-[#06080f]/95 backdrop-blur-xl border-b border-white/6`
- ✅ Input: `bg-white/5 border-white/10 text-slate-200`
- ✅ Dropdown search: `bg-[#0d1117] border border-white/8 rounded-xl`
- ✅ Notificaciones popover: mismos tokens dark
- ✅ User dropdown: `bg-[#0d1117] border border-white/8 rounded-xl`
- ✅ Avatar fallback: gradiente naranja

### `index.html`
- ✅ `class="dark"` en `<html>` para forzar dark mode desde el inicio

---

## Variables CSS — Tabla de Referencia

```css
/* Colores principales */
--primary: 21 90% 53%;        /* orange-500 */
--secondary: 217 91% 60%;     /* blue-500 */
--background: 228 43% 4%;     /* #06080f */
--card: 224 38% 7%;
--border: 225 20% 14%;
--muted: 222 30% 11%;

/* Charts: orange, blue, emerald, violet, cyan */
--chart-1: 21 90% 53%;
--chart-2: 217 91% 60%;
--chart-3: 160 71% 45%;
--chart-4: 262 83% 58%;
--chart-5: 188 100% 45%;
```

---

## Resultado Visual
La app ahora se ve idéntica en estilo al landing page:
- Fondo casi negro (#06080f)
- Sidebar translúcido con orbs decorativos
- Naranja como color de acción primaria
- Azul como acento secundario
- Cards con efecto glass/blur sutil
- Tipografía Inter con spacing apretado
