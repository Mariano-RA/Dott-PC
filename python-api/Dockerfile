# Utiliza una imagen base de Python
FROM python:3.11-alpine
# Establece el directorio de trabajo dentro del contenedor
WORKDIR /app
# Copia el archivo de requisitos e instala las dependencias
COPY /requirements.txt requirements.txt
# RUN pip install -r requeriments.txt
RUN pip install -r requirements.txt && \
    rm -rf /root/.cache && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* && \
    rm -rf /tmp/*
# Copia el código de la aplicación a la imagen
COPY . .
RUN chmod -R 777 /app/nuevosScripts/diccionarios
# Expone el puerto en el que la API estará escuchando
EXPOSE 5000
CMD ["python", "dottDB.py"]
