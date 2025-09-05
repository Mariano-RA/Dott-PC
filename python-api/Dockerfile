# Base Alpine (ligera)
FROM python:3.11-alpine

# Directorio de trabajo
WORKDIR /app

# (Opcional) dependencias de build si alguna wheel requiere compilar
# Si tu build ya pasó sin esto, podés dejarlo comentado.
# RUN apk add --no-cache build-base linux-headers libffi-dev openssl-dev

# Copiar requirements desde el contexto (sin barra inicial)
COPY requirements.txt .

# Instalar dependencias de Python sin cache
RUN pip install --no-cache-dir -r requirements.txt

# Copiar el resto del código
COPY . .

# Ajustar permisos de la carpeta (mejor 755 y/o chown que 777)
# Si querés correr como no-root, descomentá el bloque de usuario abajo
RUN chmod -R 755 /app/nuevosScripts/diccionarios || true

# (Opcional) crear usuario no-root y ajustar ownership
# RUN addgroup -S app && adduser -S app -G app \
#     && chown -R app:app /app
# USER app

# Exponer puerto de la API
EXPOSE 5000

# Entry point
CMD ["python", "dottDB.py"]
