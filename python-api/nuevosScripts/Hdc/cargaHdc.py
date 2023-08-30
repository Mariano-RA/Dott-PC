import pandas as pd
import csv
import json


#Direccion archivos en Linux
listadoHdc = "Repo-Python-DB-DottAPI/nuevosScripts/hdc/Listado/listadoHdc.xlsx"
listadoCsv = 'Repo-Python-DB-DottAPI/nuevosScripts/hdc/Listado/listadoHdc.csv'
listadoJson = 'Repo-Python-DB-DottAPI/nuevosScripts/hdc/Json/listadoJson.json'
diccionarios = 'Repo-Python-DB-DottAPI/nuevosScripts/diccionarios/diccionarios.json'

#Direccion archivos en Linux
# listadoHdc = "nuevosScripts/hdc/Listado/listadoHdc.xlsx"
# listadoCsv = 'nuevosScripts/hdc/Listado/listadoHdc.csv'
# listadoJson = 'nuevosScripts/hdc/Json/listadoJson.json'
# diccionarios = 'nuevosScripts/diccionarios/diccionarios.json'

def convertirACSV():
    # Leer el archivo XLSX
    df = pd.read_excel(listadoHdc)
    # Guardar como CSV
    df.to_csv(listadoCsv, index=False)


def encontrar_valor(diccionario, clave):
    
    if clave in diccionario:
            return diccionario[clave]
    else:
        if(clave == "Baterías"):                    
            return diccionario["Baterias"]
        if(clave == "Parlante Portátil"):                 
            return diccionario["Parlante Portatil"]
        return "No existe una categoria para este producto"
 

    
def obtenerDiccionario(nombreDiccionario):
    with open(diccionarios) as diccionariosOpen:
        # Carga los datos del archivo en un diccionario
        diccionariosJson = json.load(diccionariosOpen)

    # Accede a los diccionarios individuales por su clave
    diccionarioBuscado = diccionariosJson[''+nombreDiccionario]

    # Ahora puedes trabajar con los diccionarios como desees
    return diccionarioBuscado

def obtenerTipoIva(clave):
    # Diccionario con tipo de IVA
    tipoIva = {
        "002-I.V.A. 10.5 %": 10.5,
        "001-I.V.A. 21 %" : 21,
        "005-Impuestos Internos":21
    }

    if clave in tipoIva:
        return tipoIva[clave]
    




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
            if row[7]:
                descripcion = row[5]
                if row[3]:
                    categoria = row[3]
                else:
                    categoria = row[2]
                precio = row[7]
                iva = obtenerTipoIva(row[8])
                
                # Crea un diccionario con los datos de cada registro
                registro = {
                    "proveedor": "hdc",
                    'producto': descripcion,
                    'categoria': encontrar_valor(obtenerDiccionario('hdc'),categoria),
                    'precio': round(float(precio)* (1+float(iva)/100) * 1.1)
                    
                }
            
                # Agrega el diccionario a la lista de datos
                
                data.append(registro)


    with open(listadoJson, 'w') as jf: 
        json.dump(data, jf, ensure_ascii=False, indent=2)



crearJson()