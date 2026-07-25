# /responsive-audit — Auditoría y Corrección Mobile-First

Audita y corrige todos los componentes para que sean completamente responsivos (mobile-first). El proyecto fue construido priorizando desktop.

## Proceso

1. **Auditar** los siguientes archivos/carpetas prioritarios:
   - `src/pages/AdminDashboard.tsx` — grids de KPIs
   - `src/pages/CoachDashboard.tsx` — tablas y listas
   - `src/pages/AthleteDashboard.tsx` — tabs navigation
   - `src/components/dashboard/` — todos los componentes
   - `src/components/layout/DashboardLayout.tsx` — sidebar
   - `src/components/layout/TopNavigation.tsx` — topbar

2. **Breakpoints a respetar:**
   - `sm`: 640px (móvil grande)
   - `md`: 768px (tablet)
   - `lg`: 1024px (desktop pequeño)
   - `xl`: 1280px (desktop)

3. **Patrones responsivos requeridos:**
   - Grids: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` (NO solo `grid-cols-4`)
   - Tablas: en móvil convertir a cards/accordions
   - Sidebar: colapsible en móvil con overlay
   - Tipografía: escalar con `text-sm md:text-base lg:text-lg`
   - Padding/margin: más pequeño en móvil
   - Botones: full-width en móvil cuando hay pocos

4. **Bottom Navigation para móvil:**
   - Crear componente `BottomNavigation.tsx` para móvil (< 768px)
   - Mostrar solo las 4-5 secciones más usadas por rol
   - Iconos grandes con labels

5. **PWA ready:**
   - Verificar que `public/manifest.json` existe y está configurado
   - Meta viewport en `index.html`

## Salida esperada
Lista de archivos modificados con los cambios de responsividad aplicados. Confirmar que no se rompió nada en desktop.
