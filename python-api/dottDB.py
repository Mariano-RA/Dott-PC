import json
import pandas as pd
import sqlite3


#Direccion Windows
listadosJson = {
    "air": "Repo-Python-DB-DottAPI/nuevosScripts/Air/Json/listadoAir.json",
    "eikon": "Repo-Python-DB-DottAPI/nuevosScripts/Eik/Json/listadoJson.json",
    "elit": "Repo-Python-DB-DottAPI/nuevosScripts/Elit/Json/listadoJson.json",
    "nb":"Repo-Python-DB-DottAPI/nuevosScripts/Nb/Json/listadoJson.json",
    "invid":"Repo-Python-DB-DottAPI/nuevosScripts/Invid/Json/listadoJson.json",
    "mega":"Repo-Python-DB-DottAPI/nuevosScripts/Megacom/Json/listadoJson.json",
    "hdc":"Repo-Python-DB-DottAPI/nuevosScripts/Hdc/Json/listadoJson.json",
}

direccionAchivosJson = {
    "jsonDolar": "Repo-Python-DB-DottAPI/dataDolar.json",
    "jsonCuotas": "Repo-Python-DB-DottAPI/dataTarjeta.json",
    "direccionDB":"Repo-Python-DB-DottAPI/productosDB.sqlite"
}

#Direccion Windows
# listadosJson = {
#     "air": "nuevosScripts/Air/Json/listadoAir.json",
#     "eikon": "nuevosScripts/Eik/Json/listadoJson.json",
#     "elit": "nuevosScripts/Elit/Json/listadoJson.json",
#     "nb":"nuevosScripts/Nb/Json/listadoJson.json",
#     "invid":"nuevosScripts/Invid/Json/listadoJson.json",
#     "mega":"nuevosScripts/Megacom/Json/listadoJson.json",
#     "hdc":"nuevosScripts/Hdc/Json/listadoJson.json",
# }
# direccionAchivosJson = {
#     "jsonDolar": "dataDolar.json",
#     "direccionDB":"productosDB.sqlite"
# }

# Lectura del archivo JSON
with open(listadosJson["air"]) as f:
    listadoAir = json.load(f)

with open(listadosJson["eikon"]) as f:
    listadoEik = json.load(f)

with open(listadosJson["elit"]) as f:
    listadoElit = json.load(f)

with open(listadosJson["nb"]) as f:
    listadoNb = json.load(f)

with open(listadosJson["invid"]) as f:
    lsitadoInvid = json.load(f)

with open(listadosJson["mega"]) as f:
    listadoMega = json.load(f)

with open(listadosJson["hdc"]) as f:
    listadoHdc = json.load(f)

listaProductos = listadoAir + listadoEik + listadoElit + listadoNb + listadoMega + lsitadoInvid + listadoHdc


# Nombre de la tabla en la base de datos SQLite
nombre_tabla = 'Productos'
nombre_tabla_2 = 'Dolares'
nombre_tabla_3 = 'Cuotas'

# Conexión a la base de datos SQLite
conexion = sqlite3.connect(direccionAchivosJson['direccionDB'])

# Creación de la tabla en la base de datos SQLite
cursor = conexion.cursor()

cursor.execute(f'DROP TABLE IF EXISTS {nombre_tabla}')
cursor.execute(f'CREATE TABLE {nombre_tabla} (id integer PRIMARY KEY AUTOINCREMENT, proveedor text, producto text, categoria text, precio float)')

cursor.execute(f'DROP TABLE IF EXISTS {nombre_tabla_2}')
cursor.execute(f'CREATE TABLE {nombre_tabla_2} (id integer PRIMARY KEY AUTOINCREMENT, precioDolar float)')

cursor.execute(f'DROP TABLE IF EXISTS {nombre_tabla_3}')
cursor.execute(f'CREATE TABLE {nombre_tabla_3} (id integer PRIMARY KEY, valorTarjeta float)')


with open(direccionAchivosJson['jsonDolar']) as g:
    datos_dolar = json.load(g)
with open(direccionAchivosJson['jsonCuotas']) as g:
    datos_cuotas = json.load(g)

# Almacenamiento de los datos en la base de datos SQLite
for dato in listaProductos:
    if dato['precio'] is not None:
        cursor.execute(f"INSERT INTO {nombre_tabla} (proveedor, producto, categoria, precio) VALUES (?, ?,?, ?)", (dato['proveedor'], dato['producto'], dato['categoria'], dato['precio']))

for dato in datos_dolar:
    cursor.execute(f"INSERT INTO {nombre_tabla_2} (precioDolar) VALUES (?)", (dato['precioDolar'],))

for dato in datos_cuotas:
    cursor.execute(f"INSERT INTO {nombre_tabla_3} ( id, valorTarjeta) VALUES ( ?, ?)", (dato['id'], dato['valorTarjeta']))


# Confirmación de los cambios y cierre de la conexión a la base de datos
conexion.commit()
conexion.close()