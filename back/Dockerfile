# FROM node:alpine  AS builderBack

# WORKDIR /app
# COPY . .
# RUN npm install

# ARG ISSUER_BASE_URL
# ARG AUDIENCE
# ARG CLIENT_ORIGIN_URL
# ARG RABBIT_MQ_URI
# ARG RABBITMQ_QUEUE
# ARG RABBITMQ_PYTHON_QUEUE

# ENV ISSUER_BASE_URL=$ISSUER_BASE_URL
# ENV AUDIENCE=$AUDIENCE
# ENV CLIENT_ORIGIN_URL=$CLIENT_ORIGIN_URL
# ENV RABBIT_MQ_URI=$RABBIT_MQ_URI
# ENV RABBITMQ_QUEUE=$RABBITMQ_QUEUE
# ENV RABBITMQ_PYTHON_QUEUE=$RABBITMQ_PYTHON_QUEUE

# RUN npm run build
# RUN npm prune --production

# # Creamos una nueva imagen para producción y copiamos los archivos necesarios
# FROM node:alpine AS production
# WORKDIR /app
# COPY --from=builderBack /app/package.json /app
# COPY --from=builderBack /app/secrets /app/secrets

# RUN npm install

# COPY --from=builderBack /app/dist ./dist


# EXPOSE 3000

# CMD ["npm", "run", "prod"]

# Etapa base
FROM node:20-alpine AS base
WORKDIR /app

# Etapa dependencias (para cachear node_modules de build)
# Build context: repo root (.) para poder copiar python-api/data/categories
FROM base AS deps
RUN apk add --no-cache libc6-compat
COPY back/package.json back/package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci; else npm i; fi

# Etapa build (compila tu app)
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY back/ .
# Si necesitás variables en build, podés agregar ARG acá
RUN npm run build
# (No prunes acá: instalaremos deps de prod en el runner)

# Etapa runner (producción)
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -S app && adduser -S app -G app

# Instalar SOLO dependencias de producción en el contenedor final
COPY back/package.json back/package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm i --omit=dev; fi

# Copiar artefactos de build
COPY --from=build /app/dist ./dist
# COPY --from=build /app/secrets ./secrets

# Diccionarios para categorías (POST /categories/sql/import). Si montás un volumen en
# /app/categories_data lo reemplazás; si no, se usa este por defecto.
COPY python-api/data/categories /app/categories_data
RUN chown -R app:app /app/categories_data

USER app
EXPOSE 3000
CMD ["npm", "run", "prod"]
