# SPEC-061 — PWA completa con vite-plugin-pwa
**Status:** `done`
**Agente:** AG-CLAUDE-FRONTEND
**Sprint:** 15
**Prioridad:** MEDIA

---

## Propósito
Convertir la PWA artesanal del Sprint 6 (service worker escrito a mano en `public/sw.js`) en una PWA robusta basada en Workbox mediante `vite-plugin-pwa`, para tener app-shell offline real, cache-busting automático y aviso de nueva versión.

## Contexto — gaps del service worker artesanal
1. `STATIC_ASSETS` solo precacheaba `/`, `manifest.json` y `favicon.ico`; los bundles JS/CSS hasheados no se precacheaban → sin offline real tras un deploy.
2. Sin precache manifest → sin cache-busting automático (solo bump manual de `CACHE_VERSION`).
3. Doble registro del SW (`index.html` + `src/main.tsx`).
4. No respetaba el `base` de producción (`/speedskatetrack/`): hardcodeaba `/` y `start_url` era `/` en el manifest.
5. Sin UX de "nueva versión disponible".

## Acceptance Criteria
- [x] `vite-plugin-pwa` configurado en `vite.config.ts` (modo `generateSW`, `registerType: 'prompt'`).
- [x] El build precachea todos los assets hasheados (verificado: 188 entradas).
- [x] `manifest.webmanifest` generado e inyectado; `start_url` y `scope` respetan el `base` (`/speedskatetrack/`).
- [x] Aviso de actualización con acción "Actualizar" (no recarga automática, no interrumpe formularios).
- [x] Registro único del SW (eliminados los registros manuales de `index.html` y `main.tsx`).
- [x] `npx tsc --noEmit` sin errores y `npm run build` exitoso.

## Cambios de Base de Datos
- Ninguno.

## Cambios de Backend
- Ninguno.

## Cambios de Frontend
- **Nuevo:** `src/components/pwa/PwaReloadPrompt.tsx` — usa `useRegisterSW` (`virtual:pwa-register/react`); avisa "listo offline" y muestra un toast persistente de nueva versión con acción "Actualizar" (sonner).
- **Modificados:**
  - `vite.config.ts` — plugin `VitePWA` (manifest, workbox runtimeCaching de imágenes, `navigateFallback`, `maximumFileSizeToCacheInBytes: 3 MB`).
  - `src/vite-env.d.ts` — refs de tipos `vite-plugin-pwa/react` y `/client`.
  - `src/App.tsx` — monta `<PwaReloadPrompt />`.
  - `src/main.tsx` / `index.html` — eliminado el registro manual del SW.
- **Eliminados:** `public/sw.js`, `public/manifest.json` (ahora los genera el plugin).

## Notas de Implementación
- `registerType: 'prompt'` en lugar de `autoUpdate` para no recargar mientras el usuario llena un formulario.
- Peer-deps del proyecto: instalar con `npm install --legacy-peer-deps` (conflicto preexistente date-fns/react-day-picker).
- **Íconos:** generados con ImageMagick desde `logo.svg` sobre fondo cuadrado `#0b1220`: `icon-192.png`, `icon-512.png` (purpose `any`) y `icon-maskable-512.png` (purpose `maskable`, con padding de safe-zone). Registrados en el manifest.

## Archivos a Crear/Modificar
- `vite.config.ts`
- `src/vite-env.d.ts`
- `src/components/pwa/PwaReloadPrompt.tsx`
- `src/App.tsx`
- `src/main.tsx`
- `index.html`
- `public/sw.js` (eliminar), `public/manifest.json` (eliminar)
- `package.json` / `package-lock.json`
