FROM node:alpine  AS builderBack

WORKDIR /app
COPY . .
RUN npm install

ARG ISSUER_BASE_URL
ARG AUDIENCE
ARG CLIENT_ORIGIN_URL
ARG RABBIT_MQ_URI
ARG RABBITMQ_QUEUE
ARG RABBITMQ_PYTHON_QUEUE

ENV ISSUER_BASE_URL=$ISSUER_BASE_URL
ENV AUDIENCE=$AUDIENCE
ENV CLIENT_ORIGIN_URL=$CLIENT_ORIGIN_URL
ENV RABBIT_MQ_URI=$RABBIT_MQ_URI
ENV RABBITMQ_QUEUE=$RABBITMQ_QUEUE
ENV RABBITMQ_PYTHON_QUEUE=$RABBITMQ_PYTHON_QUEUE

RUN npm run build
RUN npm prune --production

# Creamos una nueva imagen para producción y copiamos los archivos necesarios
FROM node:alpine AS production
WORKDIR /app
COPY --from=builderBack /app/package.json /app
COPY --from=builderBack /app/secrets /app/secrets

RUN npm install

COPY --from=builderBack /app/dist ./dist


EXPOSE 3000

CMD ["npm", "run", "prod"]