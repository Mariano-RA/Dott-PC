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

# Etapa dependencias
FROM base AS deps
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci; else npm i; fi

# Etapa build
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build
RUN npm prune --omit=dev   # deja solo deps de prod

# Etapa runner (producción)
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -S app && adduser -S app -G app

# Copia solo lo necesario para producción
COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules   # <--- IMPORTANTE
COPY --from=build /app/dist ./dist
COPY --from=build /app/secrets ./secrets

USER app
EXPOSE 3000
CMD ["npm", "run", "prod"]
