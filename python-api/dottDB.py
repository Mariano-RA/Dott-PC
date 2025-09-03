import base64
import csv
import io
import json
import math
import os
import pandas as pd
from openpyxl import Workbook, load_workbook
from openpyxl.utils.dataframe import dataframe_to_rows
import pika
from unidecode import unidecode
import sys
import logging
from normalizador_categorias import normalizar_categoria, guardar_categorias_nuevas


# Directorios y configuración de logs
log_directory = "/logs"
if not os.path.exists(log_directory):
    os.makedirs(log_directory)
log_file = os.path.join(log_directory, "app.log")
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(log_file),
        logging.StreamHandler()
    ]
)

csv.field_size_limit(sys.maxsize)

# Configuración de RabbitMQ
rabbit_url = os.environ['RABBITMQ_URL']
rabbit_queue = os.environ["RABBITMQ_QUEUE"]
rabbit_python_queue = os.environ["RABBITMQ_PYTHON_QUEUE"]

# Direccion archivos
diccionarios = "nuevosScripts/diccionarios/diccionarios.json"

def log_exception(message):
    logging.exception(f"{message}")

def calcular_precio(precio, iva=0):
    precio = float(precio.replace(',', '.')) if isinstance(precio, str) else float(precio)
    iva = float(iva.replace(',', '.')) if isinstance(iva, str) else float(iva)

    return round(float(precio) * (1 + float(iva)/100))


def procesar_proveedor(nombre_proveedor, archivo_base64):
    try:
        file_data = base64.b64decode(archivo_base64)
        archivo_bytesio = io.BytesIO(file_data)

        # Lógica dinámica según proveedor
        if nombre_proveedor == 'air':
            data = tablaAir(archivo_bytesio)
        elif nombre_proveedor == 'eikon':
            data = tablaEikon(archivo_bytesio)
        elif nombre_proveedor == 'elit':
            data = tablaElit(archivo_bytesio)
        elif nombre_proveedor == 'hdc':
            data = tablaHdc(archivo_bytesio)
        elif nombre_proveedor == 'invid':
            data = tablaInvid(archivo_bytesio)
        elif nombre_proveedor == 'nb':
            data = tablaNb(archivo_bytesio)
        elif nombre_proveedor == 'mega':
            data = tablaMega(archivo_bytesio)   

        guardar_categorias_nuevas()
        enviar_resultado_a_rabbitmq(nombre_proveedor, data)
    except Exception as ex:
        log_exception(f"Error en {nombre_proveedor}: {ex}")

def tablaAir(archivo_bytesios):
    try:
        csv_reader = archivo_bytesios.read().decode('iso-8859-1').splitlines()
        data = []
        csv_reader = csv.reader(csv_reader, delimiter=",")
        next(csv_reader)
        for row in csv_reader:
            if all(x != "0" for x in row[5:9]):
                registro = {
                    'proveedor': 'air',
                    'producto': row[1],
                    'categoria': normalizar_categoria('air', row[10], row[1]),
                    'precio': calcular_precio(row[2], row[4])
                }
                data.append(registro)
        return data
    except Exception as ex:
        logging.exception(f"Error procesando datos del proveedor AIR: {ex}")
        return []

def tablaEikon(archivo_bytesio):
    try:
        df = pd.read_excel(archivo_bytesio)
        df = df.drop([0, 1, 2, 3])
        df.reset_index(drop=True, inplace=True)
        data = []
        for index, row in df.iterrows():
            registro = {
                "proveedor": "eikon",
                "producto": row[1],
                'categoria': normalizar_categoria('eikon', row[5], ''),
                "precio": calcular_precio(row[3])
            }

            data.append(registro)

        return data
    
    except Exception as ex:
        logging.exception(f"Error procesando datos del proveedor EIKON: {ex}")
        return []

def tablaElit(archivo_bytesio):
    try:
        df = pd.read_excel(archivo_bytesio)
        data = []
        for index, row in df.iterrows():
            registro = {
                "proveedor": "elit",
                "producto": row[1],
                'categoria': normalizar_categoria('elit', row[5], ''),
                "precio": calcular_precio(row[8], float(row[9]) + float(row[10]))
            }
            data.append(registro)
        return data    
    except Exception as ex:
        logging.exception(f"Error procesando datos del proveedor ELIT: {ex}")
        return []

def tablaHdc(archivo_bytesio):
    try:
        df = pd.read_excel(archivo_bytesio)
        df = df.drop([0,1]).reset_index(drop=True)
        data = []
        for index, row in df.iterrows():
                registro = {
                    "proveedor": "hdc",
                    "producto": row[3],
                    'categoria': normalizar_categoria('hdc', row[0], ''),
                    "precio": calcular_precio(row[4], row[5])
                }
                data.append(registro)
        return data
    except Exception as ex:
        logging.exception(f"Error procesando datos del proveedor HDC: {ex}")
        return []

def tablaInvid(archivo_bytesio):
    try:
        df = pd.read_excel(archivo_bytesio, header=None)
        df = df.drop([0, 1, 2, 3, 4, 5, 6]).reset_index(drop=True)
        categoria_actual = ""
        data = []
        for index, row in df.iterrows():            
            if pd.isna(row[0]) or row[0] == "" and len(str(row[1])) > 1:
                categoria_actual = str(row[1]).strip()
                continue 
            if pd.notna(row[0]) and isinstance(row[8], (int, float)):
                registro = {
                    "proveedor": "invid",
                    "producto": row[1],
                    "precio": calcular_precio(row[8]),
                    'categoria': normalizar_categoria('invid', categoria_actual, '')
                }
                data.append(registro)
        return data
    except Exception as ex:
        logging.exception(f"Error procesando datos del proveedor INVID: {ex}")
        return []

def tablaNb(archivo_bytesio):
    try:
        csv_data = archivo_bytesio.read().decode('utf-8').splitlines()
        data = []
        csv_reader = csv.reader(csv_data, delimiter=";")
        next(csv_reader)          
        for row in csv_reader:
            registro = {
                "proveedor": "nb",
                "producto": row[3],
                'categoria': normalizar_categoria('nb', row[2], ''),
                "precio": calcular_precio(row[10])
            }
            data.append(registro)
        return data
    except Exception as ex:
        logging.exception(f"Error procesando datos del proveedor NB: {ex}")
        return []

def tablaMega(archivo_bytesio):
    try:
        csv_data = archivo_bytesio.read().decode('utf-8').splitlines()
        registros = []    
        current_category = ""
        
        for line in csv_data:
            if line.endswith(";;;;"):
                # Si la línea es una categoría, actualizamos la variable
                current_category = line.split(';')[0].strip()
            else:
                # Si no es una categoría, procesamos el producto
                partes = line.strip().split(';')
                
                if len(partes) < 5:
                    continue

                producto = partes[1].strip().replace('"', '') 
                precio_ars = float(partes[2].replace('U$s', '').strip())
                
                # Extraemos y procesamos el IVA
                iva_porcentaje = float(partes[4].strip().replace('+', '').replace('%', ''))
                
                # Calculamos precioFinal
                precio_final = calcular_precio(precio_ars, iva_porcentaje)
                
                # Aseguramos que la categoría no esté vacía
                if current_category:
                    categoria = current_category
                else:
                    categoria = ""
                
                registros.append({
                    "proveedor": "mega",
                    "producto": producto,
                    'categoria': normalizar_categoria('mega', categoria, ''),
                    "precio": precio_final  # Precio con IVA aplicado y margen adicional
                })    
        return registros
    except Exception as ex:
        logging.exception(f"Error procesando datos del proveedor MEGA: {ex}")
        return []


def callback(ch, method, properties, body):
    try:
        mensaje = json.loads(body.decode('utf-8'))
        proveedor = mensaje["data"]["nombreProveedor"]
        base64 = mensaje["data"]["base64"]
        logging.info(f"Recibido mensaje para proveedor {proveedor}")
        procesar_proveedor(proveedor, base64)
    except json.JSONDecodeError as e:
        logging.exception(f"Error decodificando mensaje JSON: {e}", exc_info=True)
    except KeyError as e:
        logging.exception(f"Error accediendo a datos del mensaje: {e}", exc_info=True)
    except Exception as e:
        logging.exception(f"Error inesperado en callback: {e}", exc_info=True)

def enviar_resultado_a_rabbitmq(nombre_proveedor, data):
    try:
        mensaje = {
            "pattern": "carga_tabla",
            "data": {
                "proveedor_actualizado": nombre_proveedor,
                "resultado": data,
            }
        }

        mensaje_json = json.dumps(mensaje)
        channel.queue_declare(queue=rabbit_queue, durable=True)
        channel.basic_publish(
            exchange='',
            routing_key=rabbit_queue,
            body=mensaje_json,
        )

        logging.info(f"Se enviaron datos para actualizar proveedor: {nombre_proveedor}")
    except Exception as ex:
        logging.exception(f"Error enviado datos del proveedor {nombre_proveedor}: {ex}")

with pika.BlockingConnection(pika.ConnectionParameters(host=rabbit_url)) as connection:
    channel = connection.channel()
    channel.queue_declare(queue=rabbit_python_queue, durable=True)
    channel.basic_consume(
        queue=rabbit_python_queue, on_message_callback=callback, auto_ack=True
    )
    try:
        logging.info("Iniciando ejecución del consumidor...")
        channel.start_consuming()
    except KeyboardInterrupt:
        logging.exception("Ejecución detenida por el usuario.")
    except Exception as e:
        logging.exception(f"Error en el consumidor principal: {e}", exc_info=True)