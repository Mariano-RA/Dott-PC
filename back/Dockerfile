FROM node:18 AS builderBack

WORKDIR /app
COPY . .
RUN npm install

ARG ISSUER_BASE_URL
ARG AUDIENCE
ARG CLIENT_ORIGIN_URL

ENV ISSUER_BASE_URL=$ISSUER_BASE_URL
ENV AUDIENCE=$AUDIENCE
ENV CLIENT_ORIGIN_URL=$CLIENT_ORIGIN_URL

RUN npm run build
RUN npm prune --production

# Creamos una nueva imagen para producción y copiamos los archivos necesarios
FROM node:18 AS production
WORKDIR /app
COPY --from=builderBack /app/package.json ./
RUN npm install

COPY --from=builderBack /app/dist ./dist


EXPOSE 3000

CMD ["npm", "run", "prod"]