import base64
import contextlib
import csv
import io
import json
import os
import pandas as pd
import pika
import sys
import logging
import time
from typing import Any, Dict, Tuple
from normalizador_categorias import normalizar_categoria, guardar_categorias_nuevas


# Directorios y configuración de logs

log_directory = os.path.join(os.getcwd(), "logs")  # ahora es /app/logs
if not os.path.exists(log_directory):
    os.makedirs(log_directory, exist_ok=True)

log_file = os.path.join(log_directory, "app.log")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler(log_file),
        logging.StreamHandler()
    ]
)
# Evitar salida de depuración de xlrd al leer .xls (ej. MEGA)
logging.getLogger("xlrd").setLevel(logging.WARNING)

csv.field_size_limit(sys.maxsize)

# Configuración de RabbitMQ
rabbit_url = os.environ['RABBITMQ_URL']
rabbit_queue = os.environ["RABBITMQ_QUEUE"]
rabbit_python_queue = os.environ["RABBITMQ_PYTHON_QUEUE"]
rabbit_retry_delay = int(os.environ.get("RABBITMQ_RETRY_DELAY", "5"))

def log_exception(message):
    logging.exception(f"{message}")

def calcular_precio(precio, iva=0):
    precio = float(precio.replace(',', '.')) if isinstance(precio, str) else float(precio)
    iva = float(iva.replace(',', '.')) if isinstance(iva, str) else float(iva)

    return round(float(precio) * (1 + float(iva)/100))


def _is_excel_binary(file_data: bytes) -> bool:
    # XLSX: ZIP container (PK). XLS (BIFF/OLE): D0 CF 11 E0.
    return file_data.startswith(b"PK") or (len(file_data) >= 8 and file_data[:8] == b"\xD0\xCF\x11\xE0\xA1\xB1\x1A\xE1")


def _read_excel_to_rows(file_data: bytes):
    """Lee Excel (.xls o .xlsx) y devuelve lista de filas (cada fila es lista de celdas como string)."""
    engine = "xlrd" if (len(file_data) >= 8 and file_data[:8] == b"\xD0\xCF\x11\xE0\xA1\xB1\x1A\xE1") else "openpyxl"
    with open(os.devnull, "w", encoding="utf-8") as devnull:
        with contextlib.redirect_stdout(devnull):
            try:
                df = pd.read_excel(io.BytesIO(file_data), header=None, engine=engine)
            except Exception:
                engine = "xlrd" if engine == "openpyxl" else "openpyxl"
                df = pd.read_excel(io.BytesIO(file_data), header=None, engine=engine)
    df = df.fillna("")
    return [[str(cell).strip() for cell in row] for row in df.values.tolist()]


def _rows_from_csv_or_excel(file_data: bytes, csv_delimiter=",", csv_encoding="utf-8"):
    if _is_excel_binary(file_data):
        return _read_excel_to_rows(file_data)

    decoded = file_data.decode(csv_encoding, errors="replace").splitlines()
    return [row for row in csv.reader(decoded, delimiter=csv_delimiter)]


def procesar_proveedor(nombre_proveedor, archivo_base64):
    try:
        file_data = base64.b64decode(archivo_base64)
        archivo_bytesio = io.BytesIO(file_data)

        # Lógica dinámica según proveedor
        if nombre_proveedor == 'air':
            data = tablaAir(archivo_bytesio)
        elif nombre_proveedor == 'eikon':
            data = tablaEikon(archivo_bytesio)
        elif nombre_proveedor == 'elit':
            data = tablaElit(archivo_bytesio)
        elif nombre_proveedor == 'hdc':
            data = tablaHdc(archivo_bytesio)
        elif nombre_proveedor == 'invid':
            data = tablaInvid(archivo_bytesio)
        elif nombre_proveedor == 'nb':
            data = tablaNb(archivo_bytesio)
        elif nombre_proveedor == 'mega':
            data = tablaMega(archivo_bytesio)   
        else:
            raise ValueError(f"Proveedor no soportado: {nombre_proveedor}")

        guardar_categorias_nuevas()
        enviar_resultado_a_rabbitmq(nombre_proveedor, data)
        return True
    except Exception as ex:
        log_exception(f"Error en {nombre_proveedor}: {ex}")
        return False


def _extraer_payload(mensaje: Dict[str, Any]) -> Tuple[str, str]:
    data = mensaje.get("data")
    if not isinstance(data, dict):
        raise ValueError("Payload invalido: falta objeto 'data'")

    proveedor = data.get("nombreProveedor")
    contenido_base64 = data.get("base64")

    if not proveedor or not isinstance(proveedor, str):
        raise ValueError("Payload invalido: 'nombreProveedor' es requerido")

    if not contenido_base64 or not isinstance(contenido_base64, str):
        raise ValueError("Payload invalido: 'base64' es requerido")

    return proveedor.strip().lower(), contenido_base64

def tablaAir(archivo_bytesios):
    try:
        file_data = archivo_bytesios.read()
        csv_reader = _rows_from_csv_or_excel(file_data, csv_delimiter=",", csv_encoding="iso-8859-1")
        data = []
        # Skip header row when present.
        rows = csv_reader[1:] if len(csv_reader) > 1 else []
        for row in rows:
            if len(row) < 11:
                continue
            if all(x != "0" for x in row[5:9]):
                registro = {
                    'proveedor': 'air',
                    'producto': row[1],
                    'categoria': normalizar_categoria('air', row[10], row[1]),
                    'precio': calcular_precio(row[2], row[4])
                }
                data.append(registro)
        if not data and rows:
            logging.warning("AIR: se leyeron %d filas pero ninguna cumplió el filtro (len>=11, row[5:9] no todos '0'). Revisar formato CSV.", len(rows))
        return data
    except Exception as ex:
        logging.exception(f"Error procesando datos del proveedor AIR: {ex}")
        return []

def tablaEikon(archivo_bytesio):
    try:
        df = pd.read_excel(archivo_bytesio)
        df = df.drop([0, 1, 2, 3])
        df.reset_index(drop=True, inplace=True)
        data = []
        for index, row in df.iterrows():
            registro = {
                "proveedor": "eikon",
                "producto": row[1],
                'categoria': normalizar_categoria('eikon', row[5], ''),
                "precio": calcular_precio(row[3])
            }

            data.append(registro)

        return data
    
    except Exception as ex:
        logging.exception(f"Error procesando datos del proveedor EIKON: {ex}")
        return []

def tablaElit(archivo_bytesio):
    try:
        raw = archivo_bytesio.read()
        if _is_excel_binary(raw):
            df = pd.read_excel(io.BytesIO(raw))
            data = []
            for _, row in df.iterrows():
                registro = {
                    "proveedor": "elit",
                    "producto": row[1],
                    "categoria": normalizar_categoria("elit", row[5], ""),
                    "precio": calcular_precio(row[8], float(row[9]) + float(row[10])),
                }
                data.append(registro)
            return data

        # CSV (endpoint /productos/csv). Intentamos mapear por nombres de columnas.
        text = raw.decode("utf-8", errors="replace")
        sample = "\n".join([ln for ln in text.splitlines() if ln.strip()][:20])
        try:
            dialect = csv.Sniffer().sniff(sample, delimiters=";,|\t")
            delimiter = dialect.delimiter
        except Exception:
            delimiter = ";"

        reader = csv.reader(text.splitlines(), delimiter=delimiter)
        rows = [r for r in reader if r and any(str(c).strip() for c in r)]
        if not rows:
            return []

        header = [str(c).strip().lower() for c in rows[0]]
        idx = {name: i for i, name in enumerate(header) if name}

        def _first_idx(*names):
            for n in names:
                if n in idx:
                    return idx[n]
            return None

        producto_i = _first_idx("producto", "nombre", "descripcion", "descripción", "articulo", "artículo")
        cat_i = _first_idx("categoria", "categoría", "rubro", "linea", "línea")
        sub_i = _first_idx("subcategoria", "subcategoría", "sub_rubro", "subrubro")
        precio_i = _first_idx("pvp_ars", "pvp", "precio", "precio_ars", "importe", "valor")
        iva_i = _first_idx("iva", "iva_porcentaje", "alicuota_iva", "alícuota_iva")
        imp_i = _first_idx("impuesto_interno", "imp_interno", "interno")

        def _to_float(v):
            if v is None:
                return None
            s = str(v).strip()
            if not s:
                return None
            s = s.replace("U$s", "").replace("%", "").replace("+", "").strip()
            s = s.replace(".", "").replace(",", ".") if s.count(",") == 1 and s.count(".") >= 1 else s.replace(",", ".")
            try:
                return float(s)
            except Exception:
                return None

        data = []
        for r in rows[1:]:
            try:
                producto = str(r[producto_i]).strip() if producto_i is not None and producto_i < len(r) else ""
                if not producto:
                    continue
                cat = ""
                if cat_i is not None and cat_i < len(r):
                    cat = str(r[cat_i]).strip()
                if not cat and sub_i is not None and sub_i < len(r):
                    cat = str(r[sub_i]).strip()

                precio = _to_float(r[precio_i]) if precio_i is not None and precio_i < len(r) else None
                if precio is None:
                    continue
                iva = _to_float(r[iva_i]) if iva_i is not None and iva_i < len(r) else 0.0
                imp = _to_float(r[imp_i]) if imp_i is not None and imp_i < len(r) else 0.0
                iva_total = float(iva or 0) + float(imp or 0)

                registro = {
                    "proveedor": "elit",
                    "producto": producto,
                    "categoria": normalizar_categoria("elit", cat, ""),
                    "precio": calcular_precio(precio, iva_total),
                }
                data.append(registro)
            except Exception:
                continue

        return data
    except Exception as ex:
        logging.exception(f"Error procesando datos del proveedor ELIT: {ex}")
        return []

def tablaHdc(archivo_bytesio):
    try:
        df = pd.read_excel(archivo_bytesio)
        df = df.drop([0,1]).reset_index(drop=True)
        data = []
        for index, row in df.iterrows():
                registro = {
                    "proveedor": "hdc",
                    "producto": row[3],
                    'categoria': normalizar_categoria('hdc', row[0], ''),
                    "precio": calcular_precio(row[4], row[5])
                }
                data.append(registro)
        return data
    except Exception as ex:
        logging.exception(f"Error procesando datos del proveedor HDC: {ex}")
        return []

def tablaInvid(archivo_bytesio):
    try:
        try:
            df = pd.read_excel(archivo_bytesio, header=None)
        except ValueError:
            # Algunos listados vienen como .xls (requiere xlrd)
            try:
                archivo_bytesio.seek(0)
            except Exception:
                pass
            df = pd.read_excel(archivo_bytesio, header=None, engine="xlrd")
        df = df.drop([0, 1, 2, 3, 4, 5, 6]).reset_index(drop=True)
        categoria_actual = ""
        data = []
        for index, row in df.iterrows():            
            if pd.isna(row[0]) or (row[0] == "" and len(str(row[1])) > 1):
                categoria_actual = str(row[1]).strip()
                continue 
            if pd.notna(row[0]) and isinstance(row[8], (int, float)):
                registro = {
                    "proveedor": "invid",
                    "producto": row[1],
                    "precio": calcular_precio(row[8]),
                    'categoria': normalizar_categoria('invid', categoria_actual, '')
                }
                data.append(registro)
        return data
    except Exception as ex:
        logging.exception(f"Error procesando datos del proveedor INVID: {ex}")
        return []

def tablaNb(archivo_bytesio):
    try:
        file_data = archivo_bytesio.read()
        csv_data = _rows_from_csv_or_excel(file_data, csv_delimiter=";", csv_encoding="utf-8")
        data = []
        rows = csv_data[1:] if len(csv_data) > 1 else []
        for row in rows:
            if len(row) < 11:
                continue
            registro = {
                "proveedor": "nb",
                "producto": row[3],
                'categoria': normalizar_categoria('nb', row[2], ''),
                "precio": calcular_precio(row[10])
            }
            data.append(registro)
        return data
    except Exception as ex:
        logging.exception(f"Error procesando datos del proveedor NB: {ex}")
        return []

def _safe_float(val, default=None):
    if val is None or (isinstance(val, str) and not val.strip()):
        return default
    s = str(val).replace("U$s", "").replace("+", "").replace("%", "").strip()
    try:
        return float(s)
    except (ValueError, TypeError):
        return default


def _parse_mega_row(partes_or_list, from_excel=False):
    """Extrae (producto, precio_ars, iva_porcentaje) de una fila; devuelve None si no es fila de producto."""
    if from_excel:
        if len(partes_or_list) < 5:
            return None
        producto = str(partes_or_list[1]).strip().replace('"', '')
        precio_ars = _safe_float(partes_or_list[2])
        iva_porcentaje = _safe_float(partes_or_list[4])
        if not producto or precio_ars is None or iva_porcentaje is None:
            return None
        return (producto, precio_ars, iva_porcentaje)
    # CSV: partes ya son strings
    partes = partes_or_list
    if len(partes) < 5:
        return None
    producto = partes[1].strip().replace('"', '')
    precio_ars = _safe_float(partes[2])
    iva_porcentaje = _safe_float(partes[4])
    if not producto or precio_ars is None or iva_porcentaje is None:
        return None
    return (producto, precio_ars, iva_porcentaje)


def _xls_to_csv_semicolon(file_data: bytes) -> str:
    """Convierte XLS/XLSX a texto CSV con separador ; (como el flujo anterior de MEGA)."""
    rows = _read_excel_to_rows(file_data)
    lines = []
    for row in rows:
        # Celdas como string; si contienen ";" se escapan entre comillas para CSV
        cells = []
        for c in row:
            s = str(c).strip() if c is not None else ""
            if ";" in s or "\n" in s or '"' in s:
                s = '"' + s.replace('"', '""') + '"'
            cells.append(s)
        lines.append(";".join(cells))
    return "\n".join(lines)


def tablaMega(archivo_bytesio):
    try:
        raw = archivo_bytesio.read()
        registros = []
        current_category = ""

        # MEGA entrega .xls: se convierte a CSV con ";" como antes y se procesa igual.
        if _is_excel_binary(raw):
            raw = _xls_to_csv_semicolon(raw).encode("utf-8", errors="replace")

        csv_data = raw.decode("utf-8", errors="replace").splitlines()
        for line in csv_data:
            if line.endswith(";;;;"):
                current_category = line.split(";")[0].strip()
            else:
                partes = line.strip().split(";")
                parsed = _parse_mega_row(partes, from_excel=False)
                if parsed is None:
                    continue
                producto, precio_ars, iva_porcentaje = parsed
                precio_final = calcular_precio(precio_ars, iva_porcentaje)
                registros.append({
                    "proveedor": "mega",
                    "producto": producto,
                    "categoria": normalizar_categoria("mega", current_category or "", ""),
                    "precio": precio_final,
                })
        return registros
    except Exception as ex:
        logging.exception(f"Error procesando datos del proveedor MEGA: {ex}")
        return []


def callback(ch, method, properties, body):
    try:
        mensaje = json.loads(body.decode('utf-8'))
        proveedor, archivo_base64 = _extraer_payload(mensaje)
        logging.info(f"Recibido mensaje para proveedor {proveedor}")
        process_ok = procesar_proveedor(proveedor, archivo_base64)
        if process_ok:
            ch.basic_ack(delivery_tag=method.delivery_tag)
        else:
            # Error funcional (proveedor no soportado / parse fallido): no requeue para evitar loop infinito.
            ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)
    except (json.JSONDecodeError, ValueError, TypeError) as e:
        logging.exception(f"Mensaje invalido o incompleto: {e}", exc_info=True)
        ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)
    except Exception as e:
        logging.exception(f"Error inesperado en callback: {e}", exc_info=True)
        ch.basic_nack(delivery_tag=method.delivery_tag, requeue=True)

def enviar_resultado_a_rabbitmq(nombre_proveedor, data):
    try:
        mensaje = {
            "pattern": "carga_tabla",
            "data": {
                "proveedor_actualizado": nombre_proveedor,
                "resultado": data,
            }
        }

        mensaje_json = json.dumps(mensaje)

        # Publish using a short-lived connection so this function works
        # even when the consumer channel is recreated after reconnects.
        with pika.BlockingConnection(
            pika.ConnectionParameters(host=rabbit_url)
        ) as publish_connection:
            publish_channel = publish_connection.channel()
            publish_channel.queue_declare(queue=rabbit_queue, durable=True)
            publish_channel.basic_publish(
                exchange='',
                routing_key=rabbit_queue,
                body=mensaje_json,
            )

        logging.info(f"Se enviaron datos para actualizar proveedor: {nombre_proveedor}")
    except Exception as ex:
        logging.exception(f"Error enviado datos del proveedor {nombre_proveedor}: {ex}")

def run_consumer_with_retry():
    while True:
        try:
            with pika.BlockingConnection(
                pika.ConnectionParameters(host=rabbit_url)
            ) as connection:
                channel = connection.channel()
                channel.queue_declare(queue=rabbit_python_queue, durable=True)
                channel.basic_consume(
                    queue=rabbit_python_queue,
                    on_message_callback=callback,
                    auto_ack=False
                )
                logging.info("Iniciando ejecución del consumidor...")
                channel.start_consuming()
        except KeyboardInterrupt:
            logging.exception("Ejecución detenida por el usuario.")
            break
        except Exception as e:
            logging.exception(
                f"No se pudo conectar/consumir RabbitMQ: {e}. Reintentando en {rabbit_retry_delay}s",
                exc_info=True
            )
            time.sleep(rabbit_retry_delay)


if __name__ == "__main__":
    run_consumer_with_retry()
