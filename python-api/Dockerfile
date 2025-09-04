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

FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# Crear usuario no-root antes de copiar para usar --chown
RUN groupadd -g 10001 app && useradd -m -u 10001 -g 10001 -s /usr/sbin/nologin app

# Dependencias de Python (aprovecha caché)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar el código como usuario dueño
COPY --chown=app:app . .

# Si tu app necesita escribir en este folder, crealo y dá permisos razonables
RUN mkdir -p /app/nuevosScripts/diccionarios \
 && chown -R app:app /app/nuevosScripts/diccionarios \
 && chmod -R 775 /app/nuevosScripts/diccionarios

USER app

EXPOSE 5000
CMD ["python", "dottDB.py"]
