import requests
from bs4 import BeautifulSoup
import os

def descargar_imagen(url, nombre_archivo):
    response = requests.get(url, stream=True)
    if response.status_code == 200:
        with open(nombre_archivo, 'wb') as archivo:
            for chunk in response.iter_content(1024):
                archivo.write(chunk)

def web_scraping_imagenes(url_tienda):
    response = requests.get(url_tienda)
    if response.status_code == 200:
        soup = BeautifulSoup(response.text, 'html.parser')
        productos = soup.find_all('div', class_='producto')  # Asegúrate de inspeccionar el HTML para encontrar la clase adecuada

        for i, producto in enumerate(productos):
            imagen_tag = producto.find('img')
            if imagen_tag:
                imagen_url = imagen_tag['src']
                nombre_archivo = f"producto_{i}.jpg"
                descargar_imagen(imagen_url, nombre_archivo)
                print(f"Imagen {i + 1} descargada: {nombre_archivo}")

if __name__ == "__main__":
    url_tienda = "https://www.bestbuy.com/site/mobile-cell-phones/unlocked-mobile-phones/pcmcat156400050037.c?id=pcmcat156400050037"  # Reemplaza esta URL por la de la tienda que deseas scrape

    web_scraping_imagenes(url_tienda)
