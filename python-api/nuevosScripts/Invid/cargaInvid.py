import pandas as pd
import csv
import json


#Direccion archivos en Linux
listadoInvid = "Repo-Python-DB-DottAPI/nuevosScripts/Invid/Listado/listadoInvid.xlsx"
listadoCsv = 'Repo-Python-DB-DottAPI/nuevosScripts/Invid/Listado/listadoInvid.csv'
listadoJson = 'Repo-Python-DB-DottAPI/nuevosScripts/Invid/Json/listadoJson.json'
diccionarios = 'Repo-Python-DB-DottAPI/nuevosScripts/diccionarios/diccionarios.json'

#Direccion archivos en Linux
# listadoInvid = "nuevosScripts/Invid/Listado/listadoInvid.xlsx"
# listadoCsv = 'nuevosScripts/Invid/Listado/listadoInvid.csv'
# listadoJson = 'nuevosScripts/Invid/Json/listadoJson.json'
# diccionarios = 'nuevosScripts/diccionarios/diccionarios.json'

def convertirACSV():
    # Leer el archivo XLSX
    df = pd.read_excel(listadoInvid)
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
            if(row[3] != "" and row[3] != "Nro. de Parte"):
                descripcion = row[1]
                categoria = row[8]
                precio = float (row[5])
                iva = (1 + (float(row[6])/100)) * (1 + (float(row[7])/100))
                
                # Crea un diccionario con los datos de cada registro
                registro = {
                    'proveedor':"invid",
                    'producto': descripcion,
                    'categoria': encontrar_valor(obtenerDiccionario('invid'), categoria),
                    'precio': round((precio * iva * 1.1))
                }
            
                # Agrega el diccionario a la lista de datos

                
                data.append(registro)


    with open(listadoJson, 'w') as jf: 
        json.dump(data, jf, ensure_ascii=False, indent=2)



crearJson()