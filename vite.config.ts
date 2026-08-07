import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? '/speedskatetrack/' : '/',
  // Repo: https://github.com/miguelggdev/speedskatetrack
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
    VitePWA({
      // 'prompt' evita recargar mientras el usuario llena un formulario:
      // PwaReloadPrompt muestra un aviso y el usuario decide cuándo actualizar.
      registerType: 'prompt',
      includeAssets: ['favicon.ico', 'logo.svg', 'robots.txt', 'placeholder.svg'],
      manifest: {
        name: 'SpeedSkateTrack Hub',
        short_name: 'SkateTrack',
        description: 'Gestión inteligente para clubes de patinaje de velocidad',
        theme_color: '#f97316',
        background_color: '#06080f',
        display: 'standalone',
        orientation: 'any',
        lang: 'es',
        categories: ['sports', 'productivity', 'utilities'],
        icons: [
          { src: 'favicon.ico', sizes: '48x48', type: 'image/x-icon' },
          { src: 'logo.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' },
        ],
        shortcuts: [
          { name: 'Atletas', url: 'athletes', description: 'Gestionar atletas del club' },
          { name: 'Entrenamientos', url: 'training', description: 'Ver sesiones de entrenamiento' },
          { name: 'Finanzas', url: 'finance', description: 'Panel financiero' },
        ],
      },
      workbox: {
        // Precachea todos los assets hasheados del build (app-shell offline real)
        globPatterns: ['**/*.{js,css,html,svg,png,jpg,jpeg,ico,woff,woff2}'],
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/api\//, /^\/rest\//, /^\/auth\//],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        // El chunk de react-pdf ronda 1.5 MB; subimos el límite para precacharlo
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        runtimeCaching: [
          {
            // Imágenes del mismo origen: cache-first
            urlPattern: ({ request }) => request.destination === 'image',
            handler: 'CacheFirst',
            options: {
              cacheName: 'skate-images',
              expiration: { maxEntries: 60, maxAgeSeconds: 30 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      // El SW solo se registra en el build de producción
      devOptions: { enabled: false },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
