# Utiliza una imagen base de Python
FROM python:3.8

# Establece el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copia el archivo de requisitos e instala las dependencias
COPY /requeriments.txt requeriments.txt

RUN pip install -r requeriments.txt

# Copia el código de la aplicación a la imagen
COPY . .

ARG APP_URL
ENV APP_URL=$APP_URL


# Expone el puerto en el que la API estará escuchando
EXPOSE 5000

# Comando para ejecutar la aplicación cuando el contenedor se inicie
CMD ["python", "dottApiTablas.py"]
