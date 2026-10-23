# Etapa 1: compilar la app Expo para web
FROM node:20.20-alpine AS builder

WORKDIR /app

COPY package*.json ./

# npm ci instala exactamente lo del package-lock.json. --ignore-scripts evita ejecutar
# scripts de instalacion de terceros (hoy solo core-js tiene uno, un aviso de donaciones).
RUN npm ci --ignore-scripts

COPY . .

# Binario local de expo (instalado por npm ci): npx podria descargar otro paquete.
RUN ./node_modules/.bin/expo export --platform web --output-dir /app/dist

# Etapa 2: servir los estaticos con nginx sin root.
# nginx-unprivileged es la imagen oficial de nginx preparada para un usuario sin privilegios
# (pid y temporales en /tmp). Sigue escuchando en el 80, que es donde Caddy envia el trafico:
# Docker permite puertos bajos a usuarios sin root (ip_unprivileged_port_start=0).
FROM nginxinc/nginx-unprivileged:1.30-alpine

COPY --from=builder /app/dist /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

# Usuario nginx (uid 101) de la imagen base.
USER 101

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
