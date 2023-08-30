import csv
import json


#Direccion archivos
listadoCsv = 'Repo-Python-DB-DottAPI/nuevosScripts/Air/Listado/articulos.csv'
listadoJson = 'Repo-Python-DB-DottAPI/nuevosScripts/Air/Json/listadoAir.json'
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


def crearArchivoJson():

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

            if(row[2] != "A"):

                descripcion = row[1]
                rubro = row[10]
                iva = row[4]
                precio = row[2]


                # Crea un diccionario con los datos de cada registro
                registro = {
                    'proveedor':'air',
                    'producto': descripcion,
                    'categoria': encontrar_valor(obtenerDiccionario('air'), rubro),
                    'precio': round( (float(precio) * (1 + (float(iva)/100)) * 1.1))
                }

                # Agrega el diccionario a la lista de datos
                data.append(registro)

    # Convierte la lista de datos a formato JSON
    # json_data = json.dumps(data, indent=4)

    with open(listadoJson, 'w') as jf: 
        json.dump(data, jf, ensure_ascii=False, indent=2)


crearArchivoJson()