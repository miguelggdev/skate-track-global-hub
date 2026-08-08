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
      includeAssets: [
        'favicon.ico', 'logo.svg', 'robots.txt', 'placeholder.svg',
        'icon-192.png', 'icon-512.png', 'icon-maskable-512.png',
      ],
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
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          { src: 'logo.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
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
  build: {
    rollupOptions: {
      output: {
        // Separa librerías pesadas en chunks propios para aligerar el chunk
        // principal y mejorar el cacheo entre despliegues.
        manualChunks(id: string) {
          if (!id.includes('node_modules')) return;
          if (id.includes('@react-pdf') || id.includes('pdfjs') || id.includes('fontkit')) return 'react-pdf';
          if (id.includes('xlsx')) return 'xlsx';
          if (id.includes('jspdf') || id.includes('html2canvas')) return 'jspdf';
          if (id.includes('recharts') || id.includes('/d3-') || id.includes('victory-')) return 'charts';
          if (id.includes('leaflet')) return 'leaflet';
          if (id.includes('@radix-ui')) return 'radix';
          if (id.includes('@tanstack')) return 'tanstack';
          if (id.includes('@supabase')) return 'supabase';
        },
      },
    },
  },
}));
