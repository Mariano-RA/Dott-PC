# -*- coding: utf-8 -*-
"""Ajusta diccionarios.json a las subcategorías del maestro maestro_categorias.json (proveedor AIR no se modifica)."""

import json
import os

DIR = os.path.dirname(os.path.abspath(__file__))
DICCIONARIOS_PATH = os.path.join(DIR, "diccionarios.json")
# maestro_categorias.json en la raíz del repo
MAESTRO_PATH = os.path.join(DIR, "..", "..", "..", "maestro_categorias.json")
PROVEEDOR_IGNORADO = "air"

# Subcategorías válidas del maestro (para referencia)
# computadoras_portatiles: PC de Escritorio, All in One, Mini PC, Notebooks, Tablets, Servidores
# componentes_pc: Procesadores, Motherboards, Memorias RAM, Almacenamiento Interno, Tarjetas de Video, Fuentes de Alimentación, Gabinetes, Refrigeración
# perifericos: Mouses y Mousepads, Teclados, Combos Teclado + Mouse, Auriculares y Micrófonos, Parlantes, Cámaras Web
# gaming: Consolas, Joysticks y Volantes, Sillas y Escritorios Gamers, Streaming
# monitores_proyeccion: Monitores, Proyectores, Soportes y Pantallas
# conectividad_redes: Routers y Access Points, Switches y Hubs, Placas de Red y Adaptadores
# almacenamiento_externo_flash: Discos Externos, Pendrives y Memorias USB, Tarjetas de Memoria
# impresion_insumos: Impresoras, Scanners, Insumos
# cables_adaptadores: Cables, Adaptadores y Conversores
# energia: UPS, Estabilizadores y Protectores
# seguridad_smart_home: Cámaras de Seguridad e IP, Smart Home y Domótica
# electronica_hogar: TV y Audio, Celulares y Telefonía, Electrodomésticos y Climatización, Movilidad Urbana
# ofertas_destacados: Super ofertas, Destacados, Outlet

# Mapeo: valor antiguo -> subcategoría del maestro
MAPEO_VALORES = {
    "Refrigeracion": "Refrigeración",
    "Refrigeración": "Refrigeración",
    "Computadoras": "PC de Escritorio",
    "All in One": "All in One",
    "ALL IN ONE": "All in One",
    "All In One": "All in One",
    "Mini PC": "Mini PC",
    "Notebooks": "Notebooks",
    "Tablets": "Tablets",
    "Servidores": "Servidores",
    "Procesadores": "Procesadores",
    "Motherboards": "Motherboards",
    "Memorias RAM": "Memorias RAM",
    "Discos": "Almacenamiento Interno",
    "Almacenamiento Portatil": "Discos Externos",
    "Placas de video": "Tarjetas de Video",
    "Placas de Video": "Tarjetas de Video",
    "PLACAS DE VIDEO": "Tarjetas de Video",
    "Placa de video": "Tarjetas de Video",
    "Placa De Video": "Tarjetas de Video",
    "Fuentes": "Fuentes de Alimentación",
    "Gabinetes": "Gabinetes",
    "Mouses": "Mouses y Mousepads",
    "Mouse": "Mouses y Mousepads",
    "MOUSE": "Mouses y Mousepads",
    "Teclados": "Teclados",
    "TECLADOS": "Teclados",
    "Auriculares": "Auriculares y Micrófonos",
    "AURICULARES": "Auriculares y Micrófonos",
    "Parlantes": "Parlantes",
    "PARLANTES": "Parlantes",
    "Webcams": "Cámaras Web",
    "WEBCAMS": "Cámaras Web",
    "WEBCAM": "Cámaras Web",
    "CAMARAS WEB": "Cámaras Web",
    "Camaras Web": "Cámaras Web",
    "Microfonos": "Auriculares y Micrófonos",
    "Micrófonos": "Auriculares y Micrófonos",
    "MICROFONOS": "Auriculares y Micrófonos",
    "Gamer": "Joysticks y Volantes",
    "GAMER": "Joysticks y Volantes",
    "Sillas": "Sillas y Escritorios Gamers",
    "SILLAS": "Sillas y Escritorios Gamers",
    "SILLAS NIBIO": "Sillas y Escritorios Gamers",
    "Consolas": "Consolas",
    "Monitores": "Monitores",
    "MONITORES": "Monitores",
    "Proyectores": "Proyectores",
    "PROYECTORES": "Proyectores",
    "Soportes": "Soportes y Pantallas",
    "SOPORTES": "Soportes y Pantallas",
    "Conectividad": "Routers y Access Points",
    "CONECTIVIDAD": "Routers y Access Points",
    "Cables y Adaptadores": "Cables",
    "CABLES Y ADAPTADORES": "Cables",
    "Impresoras e Insumos": "Impresoras",
    "Estabilizadores y UPS": "Estabilizadores y Protectores",
    "UPS Y ESTABILIZADORES": "Estabilizadores y Protectores",
    "Ups": "UPS",
    "UPS": "UPS",
    "Ofertas y destacados": "Destacados",
    "Electro": "TV y Audio",
    "ELECTRO": "TV y Audio",
    "Telefonia": "Celulares y Telefonía",
    "TELEFONIA": "Celulares y Telefonía",
    "Telefonía": "Celulares y Telefonía",
    "Smartwatch": "Celulares y Telefonía",
    "Software": "Insumos",
    "SOFTWARE": "Insumos",
    "Accesorios": "Adaptadores y Conversores",
    "ACCESORIOS": "Adaptadores y Conversores",
    "Camaras IP": "Cámaras de Seguridad e IP",
    "Cámaras IP": "Cámaras de Seguridad e IP",
    "CAMARAS IP": "Cámaras de Seguridad e IP",
    "Smart Home": "Smart Home y Domótica",
    "Casa Inteligente": "Smart Home y Domótica",
    "CASA INTELIGENTE": "Smart Home y Domótica",
    "Outlet": "Outlet",
    "Super ofertas": "Super ofertas",
    "SUPER OFERTAS": "Super ofertas",
    "DESTACADOS": "Destacados",
    "Electrodomésticos": "Electrodomésticos y Climatización",
    "Pendrives y Memorias USB": "Pendrives y Memorias USB",
    "Tarjetas de Memoria": "Tarjetas de Memoria",
    "Scanners": "Scanners",
    "Insumos": "Insumos",
    "Impresoras": "Impresoras",
    "Adaptadores y Conversores": "Adaptadores y Conversores",
    "Cables": "Cables",
    "Routers y Access Points": "Routers y Access Points",
    "Switches y Hubs": "Switches y Hubs",
    "Placas de Red y Adaptadores": "Placas de Red y Adaptadores",
    "Estabilizadores y Protectores": "Estabilizadores y Protectores",
    "Cámaras de Seguridad e IP": "Cámaras de Seguridad e IP",
    "Smart Home y Domótica": "Smart Home y Domótica",
    "TV y Audio": "TV y Audio",
    "Celulares y Telefonía": "Celulares y Telefonía",
    "Electrodomésticos y Climatización": "Electrodomésticos y Climatización",
    "Movilidad Urbana": "Movilidad Urbana",
    "Destacados": "Destacados",
    "Combos Teclado + Mouse": "Combos Teclado + Mouse",
    "Almacenamiento Interno": "Almacenamiento Interno",
    "Tarjetas de Video": "Tarjetas de Video",
    "Fuentes de Alimentación": "Fuentes de Alimentación",
    "Refrigeración": "Refrigeración",
    "Mouses y Mousepads": "Mouses y Mousepads",
    "Auriculares y Micrófonos": "Auriculares y Micrófonos",
    "Cámaras Web": "Cámaras Web",
    "Joysticks y Volantes": "Joysticks y Volantes",
    "Sillas y Escritorios Gamers": "Sillas y Escritorios Gamers",
    "Streaming": "Streaming",
    "Soportes y Pantallas": "Soportes y Pantallas",
    "Discos Externos": "Discos Externos",
    "PC de Escritorio": "PC de Escritorio",
    # Variantes y casos adicionales
    "Pad Mouse": "Mouses y Mousepads",
    "PAD MOUSE": "Mouses y Mousepads",
    "Mouse Pad": "Mouses y Mousepads",
    "Mouse Pads": "Mouses y Mousepads",
    "MOUSEPADS": "Mouses y Mousepads",
    "Mousepads": "Mouses y Mousepads",
    "Nas": "Almacenamiento Interno",
    "NAS": "Almacenamiento Interno",
    "Cargadores Portátiles": "Discos Externos",
    "Card Reader": "Pendrives y Memorias USB",
    "CARD READER": "Pendrives y Memorias USB",
    "Unidades Opticas": "Adaptadores y Conversores",
    "UNIDADES OPTICAS": "Adaptadores y Conversores",
    "Repuestos": "Adaptadores y Conversores",
    "REPUESTOS": "Adaptadores y Conversores",
    "VARIOS": "Adaptadores y Conversores",
    "Varios": "Adaptadores y Conversores",
    "Case para Discos": "Gabinetes",
    "CASE PARA DISCOS": "Gabinetes",
    "MESAS PARA COMPUTADORAS": "Electrodomésticos y Climatización",
    "Mesas para PC": "Electrodomésticos y Climatización",
    "MOBILIARIO - Mesas para PC": "Electrodomésticos y Climatización",
    "MOBILIARIO - Mesas para TV": "Electrodomésticos y Climatización",
    "Sistemas Operativos": "Insumos",
    "SISTEMAS OPERATIVOS": "Insumos",
    "Maletines y Mochilas": "Adaptadores y Conversores",
    "MALETINES Y MOCHILAS": "Adaptadores y Conversores",
    "Mochilas": "Adaptadores y Conversores",
    "Bolsos": "Adaptadores y Conversores",
    "Fundas": "Adaptadores y Conversores",
    "Estuches": "Adaptadores y Conversores",
    "Bases Notebook": "Adaptadores y Conversores",
    "Dockings": "Adaptadores y Conversores",
    "Imagen": "Monitores",
    "Pantallas": "Monitores",
    "Trituradora": "Electrodomésticos y Climatización",
    "Video Juegos": "Joysticks y Volantes",
    "Accesorios Videojuegos": "Joysticks y Volantes",
    "Accesorios gamer": "Joysticks y Volantes",
    "KIT ACTUALIZACION": "PC de Escritorio",
    "Computadoras /KIT PC": "PC de Escritorio",
    "INFORMATICA - Mineria": "PC de Escritorio",
    "Tabletas Digitalizadoras": "Tablets",
    "Escaner": "Scanners",
    "Papelería": "Insumos",
    "Papel Resma": "Insumos",
    "Rollos": "Insumos",
    "Garantías": "Adaptadores y Conversores",
    "Candados": "Adaptadores y Conversores",
    "Alargues": "Cables",
    "Controladores": "Adaptadores y Conversores",
    "Conectores": "Cables",
    "Cintas Matriciales": "Insumos",
    "DVR Autonomos": "Cámaras de Seguridad e IP",
    "Seguridad": "Cámaras de Seguridad e IP",
    "Seguridad /Accesorios": "Cámaras de Seguridad e IP",
    "Seguridad /Alarmas": "Smart Home y Domótica",
    "Seguridad /Controles de Acceso": "Cámaras de Seguridad e IP",
    "Seguridad /Porteros": "Smart Home y Domótica",
}

# Overrides por (proveedor, clave): la clave estaba en una categoría incorrecta
OVERRIDES_KEY = {
    ("eikon", "ALL IN ONE"): "All in One",
    ("eikon", "MESAS PARA COMPUTADORAS"): "Electrodomésticos y Climatización",
    ("eikon", "SISTEMAS OPERATIVOS"): "Insumos",
    ("eikon", "CARD READER"): "Pendrives y Memorias USB",
    ("eikon", "TARJETAS DE MEMORIA"): "Tarjetas de Memoria",
    ("eikon", "PEN DRIVE"): "Pendrives y Memorias USB",
    ("eikon", "CASE PARA DISCOS"): "Gabinetes",
    ("eikon", "OUTLET"): "Outlet",
    ("elit", "Mouse Pad"): "Mouses y Mousepads",
    ("mega", "DVR Autonomos"): "Cámaras de Seguridad e IP",
    ("invid", "Impresoras /Multifunción"): "Impresoras",
    ("elit", "Ups"): "UPS",
    ("invid", "Seguridad /Cámaras IP"): "Cámaras de Seguridad e IP",
    ("invid", "Seguridad /Cámaras Analógicas"): "Cámaras de Seguridad e IP",
    ("invid", "Seguridad /Cámaras Especiales"): "Cámaras de Seguridad e IP",
    ("invid", "Seguridad /Cámaras PTZ"): "Cámaras de Seguridad e IP",
    ("invid", "Seguridad /DVR"): "Cámaras de Seguridad e IP",
    ("invid", "Seguridad /NVR"): "Cámaras de Seguridad e IP",
    ("invid", "Seguridad /Kit cámaras wifi"): "Cámaras de Seguridad e IP",
    ("invid", "Conectividad /Smart Home"): "Smart Home y Domótica",
    ("invid", "Gamers /Sillas"): "Sillas y Escritorios Gamers",
    ("invid", "Energía /UPS"): "UPS",
    ("invid", "Energía /Estabilizadores"): "Estabilizadores y Protectores",
    ("elit", "Protectores"): "Estabilizadores y Protectores",
    ("elit", "Unidad de Energia"): "Estabilizadores y Protectores",
    ("eikon", "UPS"): "UPS",
    ("eikon", "ESTABILIZADORES DE TENSION"): "Estabilizadores y Protectores",
    ("nb", "Camaras Ip"): "Cámaras de Seguridad e IP",
    ("nb", "CAMARAS IP"): "Cámaras de Seguridad e IP",
    ("hdc", "Camaras de Seguridad"): "Cámaras de Seguridad e IP",
    ("hdc", "DVR"): "Cámaras de Seguridad e IP",
}

# Claves cuyo nombre indica subcategoría de energía (UPS / Estabilizadores)
def override_energia(provider: str, key: str, value: str) -> str:
    k = key.upper()
    if "UPS" in k and "ESTABILIZADOR" not in k:
        return "UPS"
    if "ESTABILIZADOR" in k or "PROTECTOR" in k or "TENSION" in k:
        return "Estabilizadores y Protectores"
    return value

# Claves que indican cámaras de seguridad
def override_camaras(provider: str, key: str, value: str) -> str:
    k = key.upper()
    if "CAMARA" in k and ("IP" in k or "SEGURIDAD" in k or "DVR" in k or "NVR" in k or "CCTV" in k or "BULLET" in k or "DOMO" in k):
        return "Cámaras de Seguridad e IP"
    return value

# Claves que indican Smart Home
def override_smart_home(provider: str, key: str, value: str) -> str:
    k = key.upper()
    if "SMART HOME" in k or "CASA INTELIGENTE" in k or "DOMOTICA" in k:
        return "Smart Home y Domótica"
    return value

# Almacenamiento: Discos externos vs Pendrives vs Tarjetas
def override_almacenamiento(provider: str, key: str, value: str) -> str:
    k = key.upper()
    if value in ("Discos Externos", "Almacenamiento Interno"):
        return value
    if "PEN DRIVE" in k or "PENDRIVE" in k or "MEMORIAS USB" in k or "USB" in k and "MEMORIA" in k:
        return "Pendrives y Memorias USB"
    if "TARJETA" in k and "MEMORIA" in k or "SD " in k or "MICROSD" in k:
        return "Tarjetas de Memoria"
    if "DISCO EXTERNO" in k or "EXTERNO" in k and "DISCO" in k:
        return "Discos Externos"
    return value

# Impresión: Impresoras vs Scanners vs Insumos
def override_impresion(provider: str, key: str, value: str) -> str:
    k = key.upper()
    if value not in ("Impresoras", "Scanners", "Insumos"):
        return value
    if "SCANNER" in k or "ESCANER" in k:
        return "Scanners"
    if "CARTUCHO" in k or "TONER" in k or "TINTA" in k or "PAPEL" in k or "RESMA" in k or "INSUMO" in k or "CONSUMIBLE" in k:
        return "Insumos"
    if "IMPRESORA" in k:
        return "Impresoras"
    return value

# Conectividad: Routers vs Switches vs Placas de red
def override_conectividad(provider: str, key: str, value: str) -> str:
    if value not in ("Routers y Access Points", "Switches y Hubs", "Placas de Red y Adaptadores"):
        return value
    k = key.upper()
    if "SWITCH" in k or "HUB" in k:
        return "Switches y Hubs"
    if "ROUTER" in k or "ACCESS POINT" in k or "EXTENSOR" in k:
        return "Routers y Access Points"
    if "PLACA" in k and "RED" in k or "ADAPTADOR" in k and "RED" in k or "PCI" in k or "USB" in k and "WIFI" in k:
        return "Placas de Red y Adaptadores"
    return value


def main():
    with open(DICCIONARIOS_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    for provider, mappings in data.items():
        if provider.lower() == PROVEEDOR_IGNORADO:
            continue
        for key, old_value in list(mappings.items()):
            # 1) Override explícito por (proveedor, clave)
            if (provider, key) in OVERRIDES_KEY:
                new_value = OVERRIDES_KEY[(provider, key)]
                mappings[key] = new_value
                continue
            # 2) Mapeo por valor
            new_value = MAPEO_VALORES.get(old_value, old_value)
            # 3) Ajustes por contexto de la clave
            new_value = override_energia(provider, key, new_value)
            new_value = override_camaras(provider, key, new_value)
            new_value = override_smart_home(provider, key, new_value)
            new_value = override_almacenamiento(provider, key, new_value)
            new_value = override_impresion(provider, key, new_value)
            new_value = override_conectividad(provider, key, new_value)
            mappings[key] = new_value

    with open(DICCIONARIOS_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print("diccionarios.json actualizado según maestro_categorias.json (proveedor AIR sin cambios).")


if __name__ == "__main__":
    main()
