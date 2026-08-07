# Etapa 1: Construcción (Build)
FROM node:20-alpine as build

WORKDIR /app

# Copiar dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm ci

# Copiar el resto del código
COPY . .

# Construir la aplicación para producción (Vite generará la carpeta /dist)
RUN npm run build

# Etapa 2: Servidor (Nginx)
FROM nginx:alpine

# Copiar la configuración personalizada de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar los archivos construidos desde la Etapa 1
COPY --from=build /app/dist /usr/share/nginx/html

# Exponer el puerto 80 (Internamente en la red de Docker)
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
