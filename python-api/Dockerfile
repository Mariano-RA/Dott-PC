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

# Base con menos CVEs que bullseye
FROM python:3.9-slim-bookworm

WORKDIR /app

# Buenas prácticas Python
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Si NO compilas nada nativo, evitá build-essential
# Si alguna lib te pide headers, descomentar líneas de apt e instalarlos puntual.

# Dependencias del sistema (mínimas) + apt con retries y limpieza
# RUN apt-get -o Acquire::Retries=3 update && \
#     apt-get install -y --no-install-recommends \
#       build-essential \
#     && rm -rf /var/lib/apt/lists/*

# Copiá sólo requirements primero para aprovechar caché
COPY requirements.txt .

# Usá cache de pip (requiere BuildKit) y no guardes ruedas en la capa final
# Si tu runner no usa BuildKit, dejá solo la línea de pip install sin --mount
RUN --mount=type=cache,target=/root/.cache/pip \
    python -m pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Ahora sí, copiá el resto del código
COPY . .

# Asegurá permisos para el usuario sin privilegios
RUN mkdir -p /app/nuevosScripts/diccionarios && \
    chown -R 1000:1000 /app

# Usuario no-root (ID fijo para evitar sorpresas en Kubernetes)
USER 1000:1000

EXPOSE 5000
CMD ["python", "dottDB.py"]
