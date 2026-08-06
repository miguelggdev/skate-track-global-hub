# ─────────────────────────────────────────────────────────────────────────────
# Stage 1 — Build (Node 20 + Vite)
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS build

WORKDIR /app

# Variables de entorno de Supabase (públicas — van al bundle JS)
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
# Backend vacío → el frontend usa URLs relativas (/api/...) → nginx proxy interno
ARG VITE_BACKEND_URL=""

ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
    VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY \
    VITE_BACKEND_URL=$VITE_BACKEND_URL

# Instalar dependencias (cacheado si package.json no cambia)
COPY package*.json ./
RUN npm ci --prefer-offline

# Copiar fuentes y compilar
COPY . .
RUN npm run build

# Archivo de health-check para el healthcheck del contenedor
RUN echo "ok" > /app/dist/health.txt

# ─────────────────────────────────────────────────────────────────────────────
# Stage 2 — Serve (Nginx Alpine)
# ─────────────────────────────────────────────────────────────────────────────
FROM nginx:1.27-alpine

# Config de nginx (SPA routing + proxy /api/ al backend)
COPY nginx/default.conf /etc/nginx/conf.d/default.conf

# Archivos estáticos compilados
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
