# Etapa 1: Construir la aplicación y sus dependencias
FROM node:lts-alpine as build-image

# Establece el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copia los archivos relacionados con la instalación de dependencias
COPY package*.json ./
RUN npm install

COPY . .

# ARG VUE_APP_BACKEND_URL                       
# ENV VUE_APP_BACKEND_URL=$VUE_APP_BACKEND_URL  

ARG AUTH0_DOMAIN
ARG AUTH0_CLIENT_ID
ARG AUTH0_CALLBACK_URL
ARG AUTH0_AUDIENCE
ARG API_SERVER_URL
ARG PYTHON_API_URL

ENV VITE_APP_AUTH0_DOMAIN=$AUTH0_DOMAIN
ENV VITE_APP_AUTH0_CLIENT_ID=$AUTH0_CLIENT_ID
ENV VITE_APP_AUTH0_CALLBACK_URL=$AUTH0_CALLBACK_URL
ENV VITE_APP_AUTH0_AUDIENCE=$AUTH0_AUDIENCE
ENV VITE_APP_API_SERVER_URL=$API_SERVER_URL
ENV VITE_PYTHON_API_SERVER_URL=$PYTHON_API_URL

RUN npm run build

# Etapa 2: Crear la imagen de producción
FROM node:lts-alpine as production-image

# Establece el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copia solo los archivos necesarios desde la etapa de construcción
COPY --from=build-image /app/client ./dist/
COPY package.json .

RUN npm install

# Expone el puerto 80
EXPOSE 80

# Comando para iniciar la aplicación
CMD [ "npm", "run", "preview" ]