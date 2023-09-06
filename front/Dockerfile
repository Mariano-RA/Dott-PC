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

ENV VITE_APP_AUTH0_DOMAIN=dev-3hmy3galmqfty1xt.us.auth0.com
ENV VITE_APP_AUTH0_CLIENT_ID=8N7siqdvp5WlxIUNC3hWKR1QiWM92223
ENV VITE_APP_AUTH0_CALLBACK_URL=http://dott-pc.com.ar/
ENV VITE_APP_AUTH0_AUDIENCE=https://dott-pc-server.com
ENV VITE_APP_API_SERVER_URL=http://localhost:3000
ENV VITE_PYTHON_API_SERVER_URL=http://localhost:5000

RUN npm run build

# Etapa 2: Crear la imagen de producción
FROM node:lts-alpine as production-image

# Establece el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copia solo los archivos necesarios desde la etapa de construcción
COPY --from=build-image /app/client ./dist/
COPY --from=build-image /app/dott-pc.com.ar.crt ./dist/
COPY --from=build-image /app/dott-pc.com.ar.key ./dist/
COPY package.json .

RUN npm install

# Expone el puerto 80
EXPOSE 80

# Comando para iniciar la aplicación
CMD [ "npm", "run", "preview" ]