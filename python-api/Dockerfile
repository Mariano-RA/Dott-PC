# # Utiliza una imagen base de Python
# FROM python:3.8-slim

# # Establece el directorio de trabajo dentro del contenedor
# WORKDIR /app

# # Copia el archivo de requisitos e instala las dependencias
# COPY /requirements.txt requirements.txt

# # RUN pip install -r requeriments.txt
# RUN pip install -r requirements.txt && \
#     rm -rf /root/.cache && \
#     apt-get clean && \
#     rm -rf /var/lib/apt/lists/* && \
#     rm -rf /tmp/*

# # Copia el código de la aplicación a la imagen
# COPY . .

# RUN chmod -R 777 /app/nuevosScripts/diccionarios

# # Expone el puerto en el que la API estará escuchando
# EXPOSE 5000

# CMD ["python", "dottDB.py"]

# Usamos Python 3.9 por compatibilidad con pandas==1.3.3 / openpyxl==3.0.9
FROM python:3.9-slim

# Establece el directorio de trabajo dentro del contenedor
WORKDIR /app

# Variables de entorno recomendadas
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Instala dependencias del sistema necesarias para compilación de paquetes Python
RUN apt-get update && apt-get install -y --no-install-recommends \
      build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copia el archivo de requisitos e instala las dependencias
COPY requirements.txt .
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt
    
# Copia el código de la aplicación a la imagen
COPY . .

# Crea el directorio y ajusta permisos (evita 777, usa 755)
RUN mkdir -p /app/nuevosScripts/diccionarios && \
    chmod -R 755 /app/nuevosScripts/diccionarios

# Crea usuario no-root y lo usa para correr la app
RUN useradd -m appuser
USER appuser

# Expone el puerto en el que la API estará escuchando
EXPOSE 5000

# Comando por defecto para iniciar la aplicación
CMD ["python", "dottDB.py"]