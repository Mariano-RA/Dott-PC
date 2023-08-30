import pandas as pd
import csv
import json



#Direccion archivo
listadoElit = 'Repo-Python-DB-DottAPI/nuevosScripts/Elit/Listado/listadoElit.xlsx'
listadoCsv = 'Repo-Python-DB-DottAPI/nuevosScripts/Elit/Listado/listadoEik.csv'
listadoJson = 'Repo-Python-DB-DottAPI/nuevosScripts/Elit/Json/listadoJson.json'
diccionarios = 'Repo-Python-DB-DottAPI/nuevosScripts/diccionarios/diccionarios.json'

#Direccion archivo
# listadoElit = 'nuevosScripts/Elit/Listado/listadoElit.xlsx'
# listadoCsv = 'nuevosScripts/Elit/Listado/listadoEik.csv'
# listadoJson = 'nuevosScripts/Elit/Json/listadoJson.json'
# diccionarios = 'nuevosScripts/diccionarios/diccionarios.json'


def convertirACSV():
    # Leer el archivo XLSX
    df = pd.read_excel(listadoElit)

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


        # Lee cada fila del archivo CSV (ignorando la primera fila de encabezados)
        
        next(csv_reader)  # Ignora la primera fila de encabezados
        for row in csv_reader:
            descripcion = row[1]
            categoria = row[5]
            precio = row[7]
            iva = row[8]
            ivaInterno = row[9]
            

            # Crea un diccionario con los datos de cada registro
            registro = {
                'proveedor': 'elit',
                'producto': descripcion,
                'categoria': encontrar_valor(obtenerDiccionario('elit'), categoria),
                'precio': round((float(precio) * (1 + (float(iva)+ float(ivaInterno))/100) * 1.1))
            }

            
            # Agrega el diccionario a la lista de datos
            data.append(registro)


    with open(listadoJson, 'w') as jf: 
        json.dump(data, jf, ensure_ascii=False, indent=2)



crearJson()