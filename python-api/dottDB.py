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

csv.field_size_limit(sys.maxsize)


rabbit_url = os.environ['RABBITMQ_URL']
rabbit_queue = os.environ["RABBITMQ_QUEUE"]
rabbit_python_queue = os.environ["RABBITMQ_PYTHON_QUEUE"]


# Direccion archivos
listadosTemporales = "archivosPorCargar/temporales/"
listadoCsv = "archivosPorCargar/csv/"
listadoJson = "archivosPorCargar/archivosJson/"
diccionarios = "nuevosScripts/diccionarios/diccionarios.json"


def procesar_archivo(nombre_proveedor, archivo_base64):
    if nombre_proveedor == 'air':
        resultado = procesar_archivo_air(archivo_base64)
    elif nombre_proveedor == 'eikon':
        resultado = procesar_archivo_eikon(archivo_base64)
    elif nombre_proveedor == 'elit':
        resultado = procesar_archivo_elit(archivo_base64)
    elif nombre_proveedor == 'hdc':
        resultado = procesar_archivo_hdc(archivo_base64)
    elif nombre_proveedor == 'invid':
        resultado = procesar_archivo_invid(archivo_base64)
    elif nombre_proveedor == 'nb':
        resultado = procesar_archivo_nb(archivo_base64)
    elif nombre_proveedor == 'mega':
        resultado = procesar_archivo_mega(archivo_base64)

    enviar_resultado_a_rabbitmq(
        nombre_proveedor=nombre_proveedor, data=resultado)


def encontrar_valor(diccionario, clave):
    if clave in diccionario:
        return diccionario[clave]
    else:
        if (clave == "ESTABILIZADORES - UPS - Zapatillas Eléctricas"):
            return diccionario["ESTABILIZADORES - UPS - Zapatillas Electricas"]
        elif (clave == "GPS - De Exploración"):
            return diccionario["GPS - De Exploracion"]
        elif (clave == "TV - Iluminación"):
            return diccionario["TV - Iluminacion"]
        else:
            return "Varios"

# Función para obtener un diccionario


def obtenerDiccionario(nombreDiccionario):
    with open(diccionarios) as diccionariosOpen:
        diccionariosJson = json.load(diccionariosOpen)
    diccionarioBuscado = diccionariosJson[nombreDiccionario]
    return diccionarioBuscado


def tablaAir(archivo_bytesios):

    # csv_reader = csv.reader(io.TextIOWrapper(
    #     archivo_bytesios, encoding="iso-8859-1"), delimiter=',', quotechar='"', escapechar='"')

    # lector_csv = csv.reader(archivo, delimiter=',', quotechar='"', escapechar='"')

    csv_reader = csv.DictReader(io.TextIOWrapper(
         archivo_bytesios, encoding="iso-8859-1"), delimiter=',', quotechar='"')

    # Crea una lista para almacenar los datos
    data = []
    next(csv_reader)  # Ignora la primera fila de encabezados
    for row in csv_reader:
        # '212286, AURICULARES  KLIPXTREME DYNAMIK AZUL,48.44,A,10.5,20,5,15,57,173,001-0351,KSM-750BL,A
        # if(row[1] != ""):
        if(row["lista1"] != 'A' and len(row)< 14):
        
            descripcion = row['Descripcion']
            rubro = row['Rubro']
            iva = row['IVA']
            precio = row['lista1']

            # Crea un diccionario con los datos de cada registro
            registro = {
                'proveedor': 'air',
                'producto': descripcion,
                'categoria': encontrar_valor(obtenerDiccionario('air'), rubro),
                'precio': round((float(precio) * (1 + (float(iva)/100)) * 1.1))
            }

            # Agrega el diccionario a la lista de datos
            data.append(registro)

    return data


def procesar_archivo_air(archivo_base64):

    file_data = base64.b64decode(archivo_base64)
    archivo_bytesio = io.BytesIO(file_data)

    data = tablaAir(archivo_bytesio)

    return data


def tablaEikon(archivo_bytesio):
    df = pd.read_excel(archivo_bytesio)

    # Se borran las primeras filas
    df = df.drop([0, 1, 2, 3])
    df.reset_index(drop=True, inplace=True)

    # Procesar los datos del DataFrame df
    data = []

    for index, row in df.iterrows():
        descripcion = row[1]
        categoria = row[6]
        precio = row[3]

        registro = {
            "proveedor": "eikon",
            "producto": descripcion,
            "categoria": encontrar_valor(obtenerDiccionario("eikon"), categoria),
            "precio": round((float(precio) * 1.1))
        }

        data.append(registro)

    return data


def procesar_archivo_eikon(archivo_base64):

    file_data = base64.b64decode(archivo_base64)
    archivo_bytesio = io.BytesIO(file_data)

    data = tablaEikon(archivo_bytesio)

    return data


def tablaElit(archivo_bytesio):
    df = pd.read_excel(archivo_bytesio)

    data = []

    for index, row in df.iterrows():
        descripcion = row[1]
        categoria = row[5]
        precio = row[8]
        iva = row[9]
        ivaInterno = row[10]

        registro = {
            "proveedor": "elit",
            "producto": descripcion,
            "categoria": encontrar_valor(obtenerDiccionario("elit"), categoria),
            "precio": round((float(precio) * (1 + (float(iva) + float(ivaInterno)) / 100) * 1.1))
        }

        data.append(registro)

    return data


def procesar_archivo_elit(archivo_base64):

    file_data = base64.b64decode(archivo_base64)
    archivo_bytesio = io.BytesIO(file_data)

    data = tablaElit(archivo_bytesio)

    return data


def obtenerTipoIva(clave):
    # Diccionario con tipo de IVA
    tipoIva = {
        "IVA 10,5%": 10.5,
        "IVA 21%": 21,
        "005-Impuestos Internos": 21
    }
    if clave in tipoIva:
        return tipoIva[clave]


def tablaHdc(archivo_bytesio):
    df = pd.read_excel(archivo_bytesio)

    # Procesar los datos en memoria
    data = []

    for index, row in df.iterrows():
        if not math.isnan(row[6]):  # Verificar si no es NaN
            descripcion = row[5]
            if row[3]:
                categoria = unidecode(str(row[3]))
            else:
                categoria = unidecode(str(row[2]))
            precio = row[6]
            iva = obtenerTipoIva(row[7])

            # Crea un diccionario con los datos de cada registro
            registro = {
                "proveedor": "hdc",
                "producto": descripcion,
                "categoria": encontrar_valor(obtenerDiccionario("hdc"), categoria),
                "precio": round(float(precio) * (1+float(iva)/100) * 1.1)
            }

            # Agrega el diccionario a la lista de datos
            data.append(registro)

    return data


def procesar_archivo_hdc(archivo_base64):

    file_data = base64.b64decode(archivo_base64)
    archivo_bytesio = io.BytesIO(file_data)
    data = tablaHdc(archivo_bytesio)

    return data


# def tablaInvid(archivo_bytesio):
#     # Guardar el archivo .xls en el directorio
#     df = pd.read_excel(archivo_bytesio)

#     # Se utilizan los índices 0, 1 y 2 para las primeras tres filas
#     df = df.drop([0, 1, 2, 3, 4, 5])
#     df.reset_index(drop=True, inplace=True)
#     df.to_excel(listadosTemporales + "temp_invid.xlsx", index=False)

#     # Cargar el libro de trabajo
#     book = load_workbook(listadosTemporales + "temp_invid.xlsx")
#     sheet = book["Sheet1"]

#     sheet["L3"] = "categoria"

#     def apply_custom_formula(j_value, a_value, c_value, b_value, l_value):
#         result = ""
#         if (j_value is None or len(j_value) <= 1):
#             result = ""
#         elif (a_value is None or len(a_value) <= 1) and (c_value is None or len(c_value) <= 1):
#             result = b_value
#         else:
#             result = l_value
#         return result

#     for row in range(4, sheet.max_row + 1):
#         print(row)
#         j_value = sheet[f'J{row}'].value
#         a_value = sheet[f'A{row-2}'].value
#         c_value = sheet[f'C{row-2}'].value
#         b_value = sheet[f'B{row-2}'].value
#         l_value = sheet[f'L{row-1}'].value        
#         result = apply_custom_formula(
#             j_value, a_value, c_value, b_value, l_value)

#         cell = sheet.cell(row=row, column=9)
#         cell.value = unidecode(result)

#     # Save the changes to the file
#     book.save(listadosTemporales + "temp_invid.xlsx")

#     # Guardar como CSV
#     df = pd.read_excel(listadosTemporales+"temp_invid.xlsx")
#     df.to_csv(listadoCsv+"listadoInvid.csv", index=False)

#     with open(listadoCsv+"listadoInvid.csv", "r") as file:
#         # Crea un objeto lector CSV
#         csv_reader = csv.reader(file, delimiter=",")

#         # Crea una lista para almacenar los datos
#         data = []

#         next(csv_reader)  # Ignora la primera fila de encabezados
#         for row in csv_reader:
#             if (row[3] != "" and row[3] != "Nro. de Parte"):
#                 descripcion = row[1]
#                 categoria = unidecode(row[11])
#                 precio = float(row[9])
#                 # iva = (1 + (float(row[6])/100)) * (1 + (float(row[7])/100))

#                 # Crea un diccionario con los datos de cada registro
#                 registro = {
#                     "proveedor": "invid",
#                     "producto": descripcion,
#                     "categoria": encontrar_valor(obtenerDiccionario("invid"), categoria),
#                     "precio": round((precio * 1.1))
#                 }

#                 # Agrega el diccionario a la lista de datos

#                 data.append(registro)

#     return data

def tablaInvid(archivo_bytesio):
    # Cargar el archivo de Excel
    df = pd.read_excel(archivo_bytesio, header=None)
    df = df.drop([0, 1, 2, 3, 4, 5, 6]).reset_index(drop=True)  # Reiniciar el índice después de eliminar filas

    # Variable para almacenar la categoría actual
    categoria_actual = ""
    
    # Crear una lista para almacenar los datos procesados
    data = []

    # Recorrer cada fila del DataFrame
    for index, row in df.iterrows():
        
        # Comprobar si la fila contiene un título de categoría
        print(row[1])

        if pd.isna(row[0]) or row[0] == "" and len(str(row[1])) > 1:
            print(row[1])
            categoria_actual = str(row[1]).strip()
            continue 

        # Filtrar las filas que contienen datos válidos
        if pd.notna(row[0]) and isinstance(row[8], (int, float)):  # Supone que las filas de datos tienen "Código" y "Precio en ARS"

            descripcion = row[1]
            precio_ars = row[8] if len(row) > 9 else 0
            
            # Crear un diccionario con los datos de cada registro
            registro = {
                "proveedor": "invid",
                "producto": descripcion,
                "precio": float(precio_ars),
                "categoria": encontrar_valor(obtenerDiccionario("invid"), categoria_actual)  # Asignar la categoría actual
            }

            data.append(registro)

    # Convertir los datos a un DataFrame y guardarlos como CSV
    return data

def procesar_archivo_invid(archivo_base64):

    file_data = base64.b64decode(archivo_base64)
    archivo_bytesio = io.BytesIO(file_data)
    data = tablaInvid(archivo_bytesio)

    return data


def tablaNb(archivo_bytesio):
    csv_data = archivo_bytesio.read().decode('utf-8').splitlines()

    # Crear una lista para almacenar los datos
    data = []

    # Iterar sobre las filas del archivo CSV (ignorando la primera fila de encabezados)
    csv_reader = csv.reader(csv_data, delimiter=";")
    next(csv_reader)  # Ignorar la primera fila de encabezados

    for row in csv_reader:
        descripcion = row[3]
        categoria = row[2]
        precio = row[10]

        # Crear un diccionario con los datos de cada registro
        registro = {
            "proveedor": "nb",
            "producto": descripcion,
            "categoria": encontrar_valor(obtenerDiccionario("nb"), categoria),
            "precio": round((float(precio) * 1.1))
        }

        # Agregar el diccionario a la lista de datos
        data.append(registro)

    return data


def procesar_archivo_nb(archivo_base64):

    file_data = base64.b64decode(archivo_base64)
    archivo_bytesio = io.BytesIO(file_data)
    data = tablaNb(archivo_bytesio)

    return data


def tablaMega(archivo_bytesio):
    df = pd.read_excel(archivo_bytesio)

    # Se utilizan los índices 0, 1 y 2 para las primeras tres filas
    df = df.drop([0, 1])
    df.reset_index(drop=True, inplace=True)
    df.to_excel(listadosTemporales + "tempMega.xlsx", index=False)

    # Cargar el libro de trabajo
    book = load_workbook(listadosTemporales + "tempMega.xlsx")
    sheet = book["Sheet1"]

    def apply_custom_formula(value1, value2, value3, value4, value5, value6, value7):
        result = ""
        if (value1 is None or len(value1) <= 1) and (value2 is None or len(value2) <= 1):
            result = f"{value3} - {value4}"
        elif (value5 is None or len(value5) <= 1):
            result = ""
        elif (value2 is None or len(value2) <= 1):
            if (value6 is not None):
                posicion = value6.find(" - ")
                if posicion != -1:
                    parte_izquierda = value6[:posicion]
                    result = f"{parte_izquierda} - {value4}"
        else:
            result = f"{value7}"
        return result

    for row in range(3, sheet.max_row + 1):
        value1 = sheet[f'B{row-2}'].value
        value2 = sheet[f'B{row-1}'].value
        value3 = sheet[f'A{row-2}'].value
        value4 = sheet[f'A{row-1}'].value
        value5 = sheet[f'E{row}'].value
        value6 = sheet[f'G{row-2}'].value
        value7 = sheet[f'G{row-1}'].value
        result = apply_custom_formula(
            value1, value2, value3, value4, value5, value6, value7)

        cell = sheet.cell(row=row, column=7)  # Columna G
        cell.value = unidecode(result)

    # Save the changes to the file
    book.save(listadosTemporales + "tempMega.xlsx")

    # Guardar como CSV
    df = pd.read_excel(listadosTemporales+"tempMega.xlsx")
    df.to_csv(listadoCsv+"listadoMega.csv", index=False)

    # Abre el archivo CSV en modo lectura con la codificación adecuada
    with open(listadoCsv+"listadoMega.csv", "r", encoding="utf-8") as file:
        # Crea un objeto lector CSV
        csv_reader = csv.reader(file, delimiter=",")

        # Crea una lista para almacenar los datos
        data = []

        next(csv_reader)  # Ignora la primera fila de encabezados
        for row in csv_reader:
            if (row[3] != ""):
                descripcion = row[1]
                precio = row[2].replace("U$s ", "")
                iva = row[4].replace("+", "").replace("%", "")
                categoria = row[6]

                registro = {
                    "proveedor": "mega",
                    "producto": descripcion,
                    "categoria": encontrar_valor(obtenerDiccionario("mega"), categoria),
                    "precio": round((float(precio) * (1 + (float(iva)/100)) * 1.1))
                }

                data.append(registro)

    return data


def procesar_archivo_mega(archivo_base64):

    file_data = base64.b64decode(archivo_base64)
    archivo_bytesio = io.BytesIO(file_data)
    data = tablaMega(archivo_bytesio)

    return data


def callback(ch, method, properties, body):
    mensaje_decodificado = body.decode('utf-8')

    # Analiza el mensaje como un objeto JSON
    mensaje_json = json.loads(mensaje_decodificado)

    # Accede a los datos dentro del objeto 'data'
    datos = mensaje_json['data']

    # Accede a elementos específicos dentro de 'data'
    proveedor = datos['nombreProveedor']
    base64 = datos['base64']

    print("Procesando datos...")

    procesar_archivo(nombre_proveedor=proveedor, archivo_base64=base64)


def enviar_resultado_a_rabbitmq(nombre_proveedor, data):
    mensaje = {
        "pattern": "carga_tabla",
        "data": {
            "proveedor_actualizado": nombre_proveedor,
            "resultado": data,
        }
    }

    mensaje_json = json.dumps(mensaje)

    channel.queue_declare(queue=rabbit_queue, durable=True)

    print("Mensaje enviado!")

    channel.basic_publish(
        exchange='',
        routing_key=rabbit_queue,
        body=mensaje_json,
    )


connection = pika.BlockingConnection(
    pika.ConnectionParameters(host=rabbit_url))
channel = connection.channel()

channel.queue_declare(queue=rabbit_python_queue, durable=True)
# Configurar la función de callback para manejar los mensajes recibidos
channel.basic_consume(
    queue=rabbit_python_queue, on_message_callback=callback, auto_ack=True)


try:
    # Iniciar la escucha
    print("Iniciando ejecucion...")
    channel.start_consuming()
except KeyboardInterrupt:
    # Manejar la interrupción de CTRL+C
    print("Deteniendo la escucha...")
    channel.stop_consuming()

# Cerrar la conexión cuando hayamos terminado
connection.close()
