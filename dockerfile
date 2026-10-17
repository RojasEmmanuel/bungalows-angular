# ============ Etapa 1: Builder ============
FROM node:22-alpine AS builder
WORKDIR /app

# Copiamos archivos de dependencias para cachear
COPY package*.json ./
RUN npm ci

# Copiamos el resto del código y compilamos para producción
COPY . .
RUN npm run build -- --configuration=production

# ============ Etapa 2: Nginx ============
FROM nginx:alpine

# Configuración personalizada de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf 

# Copiamos los archivos estáticos compilados
COPY --from=builder /app/dist/bungalows-angular/browser /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]