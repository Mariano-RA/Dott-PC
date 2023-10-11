# Utiliza una imagen base de Python
FROM python:3.8-slim

# Establece el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copia el archivo de requisitos e instala las dependencias
COPY /requeriments.txt requeriments.txt

# RUN pip install -r requeriments.txt
RUN pip install -r requeriments.txt && \
    rm -rf /root/.cache && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* && \
    rm -rf /tmp/*

# Copia el código de la aplicación a la imagen
COPY . .

# Expone el puerto en el que la API estará escuchando
EXPOSE 5000

# Comando para ejecutar la aplicación cuando el contenedor se inicie
# CMD ["python", "dottApiTablas.py"]
# CMD ["python", "dottPC-Test.py"]
CMD ["python", "dottDB.py"]
