# SPEC-026 — Soporte Multiidioma (i18n)
**Status:** `done`
**Agente:** AG-CLAUDE-FRONTEND
**Sprint:** 03
**Prioridad:** ALTA

---

## Propósito
Permitir que la interfaz se muestre en español (por defecto), inglés, francés, italiano, alemán y portugués, para clubs internacionales o con atletas de distintos países.

## Idiomas soportados
`es` (default), `en`, `fr`, `it`, `de`, `pt`.

---

## Arquitectura IMPLEMENTADA (difiere del borrador original)

> El borrador inicial proponía `react-i18next` + archivos JSON. La implementación
> final usa un enfoque **DB-backed** más simple, sin dependencias extra ni red
> adicional relevante. Este spec documenta lo realmente construido.

- **Tabla Supabase `ui_translations`** (`key, es, en, fr, it, de, pt`) — migración
  `20260802000000_ui_translations.sql`. RLS: SELECT para `authenticated`, gestión para `admin`.
- **`profiles.language_code`** persiste el idioma preferido del usuario (CHECK con los 6 códigos).
- **`useTranslation()`** (`src/hooks/useTranslation.ts`): carga todas las traducciones con
  TanStack Query (staleTime 5 min), expone `t(key)`, `currentLanguage`, `setLanguage()`.
  Fallback en cadena: idioma activo → `es` → `STATIC_FALLBACKS` (login sin auth) → la propia clave.
- **`TranslationProvider`** monta el contexto en `App.tsx`.
- **`LanguageSelector`** (Settings) + selector en `TopNavigation` — cambio instantáneo sin recargar.

## Acceptance Criteria
- [x] Tabla `ui_translations` con los 6 idiomas + RLS.
- [x] `profiles.language_code` con CHECK y default `es`.
- [x] Hook `useTranslation` con `t()`, fallback a `es` y persistencia por usuario.
- [x] Selector de idioma en la barra superior y en Settings; cambio instantáneo.
- [x] Fallback estático para la pantalla de Login (rol anon sin SELECT).
- [x] Chrome de la app traducido en los 6 idiomas: navegación/sidebar (`menu.*`), roles (`role.*`),
      login (`login.*`), settings (`settings.*`), acciones y estados comunes (`action.*`, `common.*`).
- [x] Diccionario seed inicial (~76 claves) + expansión con títulos de página, estados y acciones
      (`20260807000000_ui_translations_expand.sql`).

## Cobertura y trabajo incremental

**Traducido y cableado con `t()`:** `DashboardLayout` (sidebar completo), `TopNavigation`,
`Login`, `Settings`, `LanguageSelector`, y la página `Athletes` (título, error, reintentar)
como patrón de referencia.

**Pendiente incremental (no bloquea el feature):** los textos del *cuerpo* del resto de páginas
(Training, Competitions, Finance, Documents, Equipment, Medical, Messages, Reports, Users)
siguen en español hasta que se cableen con `t()`. **La ampliación NO requiere cambios de
mecanismo**: basta con (1) añadir filas a `ui_translations` (vía migración) y (2) sustituir el
literal por `t('clave')` en el componente. Formato de fecha/moneda por locale con `Intl.*` queda
recomendado por página al cablearla.

## Cambios de Base de Datos
- `20260802000000_ui_translations.sql` — tabla + `profiles.language_code` + seed (~76 claves).
- `20260804200000_login_translations.sql` — claves de login.
- `20260807000000_ui_translations_expand.sql` — títulos de página, estados comunes y acciones.

## Archivos clave
- `src/hooks/useTranslation.ts`, `src/providers/TranslationProvider.tsx`
- `src/components/settings/LanguageSelector.tsx`, `src/components/layout/{DashboardLayout,TopNavigation}.tsx`
- `src/pages/{Login,Settings,Athletes}.tsx`

## Notas
- Los agentes IA (Claude) responden en el idioma del mensaje del usuario — sin cambio de backend.
- Los textos de estructura de los PDFs siguen en español (fuera del alcance de este spec).
