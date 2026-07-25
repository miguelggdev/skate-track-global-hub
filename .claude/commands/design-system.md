# /design-system — Sistema de Diseño del Club de Patinaje

Implementa o actualiza el sistema de diseño completo del proyecto. El proyecto usa React 18 + TypeScript + Tailwind CSS + shadcn-ui.

## Qué hacer

1. **Revisar** el archivo `tailwind.config.ts` y `src/index.css` actuales
2. **Definir tokens de diseño** para el club de patinaje:
   - Paleta de colores primaria/secundaria (sugerir paleta deportiva profesional: azul/naranja o similar)
   - Tipografía: heading (bold, impacto) + body (legible)
   - Spacing scale consistente
   - Border radius tokens
   - Shadow tokens para cards y elevación
3. **CSS Variables** en `:root` y `.dark` para modo oscuro completo
4. **Componentes base mejorados:**
   - Cards con glassmorphism sutil para dashboards
   - Badges de estado con colores semánticos (verde=activo, rojo=inactivo, etc.)
   - Skeleton loaders animados para todos los estados de carga
   - Gradient headers para secciones importantes
5. **Animaciones** con `tailwindcss-animate`:
   - Fade-in para cards al cargar
   - Slide-in para sidebars
   - Pulse sutil en KPIs cuando se actualizan
6. **Verificar** que todos los cambios funcionan en modo claro Y oscuro

## Contexto del proyecto
- Ruta: `src/index.css`, `tailwind.config.ts`
- Componentes shadcn en: `src/components/ui/`
- El tema actual está definido en `src/providers/ThemeProvider.tsx`
- NO romper los componentes existentes, solo extender el sistema de diseño

## Salida esperada
Modifica `tailwind.config.ts` y `src/index.css` con el design system completo. Documenta los tokens principales como comentarios en el CSS.
