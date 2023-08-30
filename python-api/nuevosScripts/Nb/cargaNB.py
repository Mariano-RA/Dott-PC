import csv
import json

#Direccion archivos
listadoCsv = 'Repo-Python-DB-DottAPI/nuevosScripts/Nb/Listado/listadoNB.csv'
listadoJson = 'Repo-Python-DB-DottAPI/nuevosScripts/Nb/Json/listadoJson.json'
diccionarios = 'Repo-Python-DB-DottAPI/nuevosScripts/diccionarios/diccionarios.json'

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
    # Abre el archivo CSV en modo lectura con la codificación adecuada
    with open(listadoCsv, 'r',encoding="utf8") as file:
        # Crea un objeto lector CSV
        csv_reader = csv.reader(file, delimiter=';')

        # Crea una lista para almacenar los datos
        data = []


        # Lee cada fila del archivo CSV (ignorando la primera fila de encabezados)
        
        next(csv_reader)  # Ignora la primera fila de encabezados
        for row in csv_reader:
            descripcion = row[3]
            categoria = row[2]
            precio = row[10]
            

            # Crea un diccionario con los datos de cada registro
            registro = {
                'proveedor': 'nb',
                'producto': descripcion,
                'categoria': encontrar_valor(obtenerDiccionario('nb'), categoria),
                'precio': round( (float(precio) * 1.1))
            }

            
            # Agrega el diccionario a la lista de datos
            data.append(registro)


    with open(listadoJson, 'w') as jf: 
        json.dump(data, jf, ensure_ascii=False, indent=2)


crearJson()