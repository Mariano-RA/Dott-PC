import pandas as pd
import csv
import json


#Direccion archivos en Linux
listadoInvid = "Repo-Python-DB-DottAPI/nuevosScripts/Megacom/Listado/listadoMega.xlsx"
listadoCsv = 'Repo-Python-DB-DottAPI/nuevosScripts/Megacom/Listado/listadoMega.csv'
listadoJson = 'Repo-Python-DB-DottAPI/nuevosScripts/Megacom/Json/listadoJson.json'
diccionarios = 'Repo-Python-DB-DottAPI/nuevosScripts/diccionarios/diccionarios.json'

#Direccion archivos en windows
# listadoInvid = "nuevosScripts/Megacom/Listado/listadoMega.xlsx"
# listadoCsv = 'nuevosScripts/Megacom/Listado/listadoMega.csv'
# listadoJson = 'nuevosScripts/Megacom/Json/listadoJson.json'
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
        if(clave == "ESTABILIZADORES - UPS - Zapatillas Eléctricas"):
            return diccionario["ESTABILIZADORES - UPS - Zapatillas Electricas"]
        elif(clave == "GPS - De Exploración"):
            return diccionario["GPS - De Exploracion"]
        elif(clave == "TV - Iluminación"):
            return diccionario["TV - Iluminacion"]
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
    with open(listadoCsv, 'r',encoding="utf-8") as file:
        # Crea un objeto lector CSV
        csv_reader = csv.reader(file, delimiter=',')

        # Crea una lista para almacenar los datos
        data = []


        # Lee cada fila del archivo CSV (ignorando la primera fila de encabezados)
        
        next(csv_reader)  # Ignora la primera fila de encabezados
        for row in csv_reader:
            if(row[3] != ""):
                descripcion = row[1]
                categoria = row[6]
                iva = row[4].replace("+", "").replace("%","")
                precio = row[2].replace("U$s ", "")
                
                # Crea un diccionario con los datos de cada registro
                registro = {
                    "proveedor": "mega",
                    'producto': descripcion,
                    'categoria': encontrar_valor(obtenerDiccionario('mega'), categoria),
                    'precio': round((float(precio) * (1 + (float(iva)/100)) * 1.1))
                }
            
                # Agrega el diccionario a la lista de datos

                
                data.append(registro)


    with open(listadoJson, 'w') as jf: 
        json.dump(data, jf, ensure_ascii=False, indent=2)



crearJson()