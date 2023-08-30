import pandas as pd
import csv
import json

#Direccion archivos
listadoEikon = 'Repo-Python-DB-DottAPI/nuevosScripts/Eik/Listado/listadoEik.xlsx'
listadoCsv = 'Repo-Python-DB-DottAPI/nuevosScripts/Eik/Listado/listadoEik.csv'
listadoJson = 'Repo-Python-DB-DottAPI/nuevosScripts/Eik/Json/listadoJson.json'
diccionarios = 'Repo-Python-DB-DottAPI/nuevosScripts/diccionarios/diccionarios.json'

#Direccion archivos
# listadoEikon = 'nuevosScripts/Eik/Listado/listadoEik.xlsx'
# listadoCsv = 'nuevosScripts/Eik/Listado/listadoEik.csv'
# listadoJson = 'nuevosScripts/Eik/Json/listadoJson.json'
# diccionarios = 'nuevosScripts/diccionarios/diccionarios.json'


def convertirACSV():
    # Leer el archivo XLSX
    df = pd.read_excel(listadoEikon)
    df = df.drop([0, 1, 2])  # Se utilizan los índices 0, 1 y 2 para las primeras tres filas
    df.reset_index(drop=True, inplace=True)
    # Guardar como CSV
    df.to_csv(listadoCsv, index=False)


def encontrar_valor(diccionario, clave):
    if clave in diccionario:
        return diccionario[clave]
    else:
        return "No existe una categoria para este producto"


def obtenerDiccionario(nombreDiccionario):
    with open(diccionarios) as diccionariosOpen:
        # Carga los datos del archivo en un diccionario
        diccionariosJson = json.load(diccionariosOpen)

    # Accede a los diccionarios individuales por su clave
    diccionarioBuscado = diccionariosJson[''+nombreDiccionario]

    # Ahora puedes trabajar con los diccionarios como desees
    return diccionarioBuscado


def crearJson():

    convertirACSV()
    # Abre el archivo CSV en modo lectura con la codificación adecuada
    with open(listadoCsv, 'r') as file:
        # Crea un objeto lector CSV
        csv_reader = csv.reader(file, delimiter=',')

        # Crea una lista para almacenar los datos
        data = []


        #"Codigo","Descripcion","lista1","Tipo","IVA","ROS","MZA","CBA","LUG", "Grupo","Rubro","Part Number","Tipo"
        # Lee cada fila del archivo CSV (ignorando la primera fila de encabezados)
        next(csv_reader)  # Ignora la primera fila de encabezados
        for row in csv_reader:

            descripcion = row[1]
            categoria = row[6]
            precio = row[3]
            
            # Crea un diccionario con los datos de cada registro
            registro = {
                'proveedor': 'eikon',
                'producto': descripcion,
                'categoria': encontrar_valor(obtenerDiccionario('eikon'), categoria),
                'precio': round(( float(precio) * 1.1))
                
            }

            # Agrega el diccionario a la lista de datos
            data.append(registro)

    # Convierte la lista de datos a formato JSON
    # json_data = json.dumps(data, indent=4)

    with open(listadoJson, 'w') as jf: 
        json.dump(data, jf, ensure_ascii=False, indent=2)



crearJson()