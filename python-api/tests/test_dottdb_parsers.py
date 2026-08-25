import os
import io
import json
import unittest
from unittest import mock

# Requerido por módulos que leen env al importar
os.environ.setdefault("RABBITMQ_URL", "localhost")
os.environ.setdefault("RABBITMQ_QUEUE", "q_out")
os.environ.setdefault("RABBITMQ_PYTHON_QUEUE", "q_in")

from parsers import air, nb, mega, elit, invid, extraer_payload


class TestAirParser(unittest.TestCase):
    def test_tabla_air_parsea_fila_valida(self):
        csv_text = (
            "h0,h1,h2,h3,h4,h5,h6,h7,h8,h9,h10\n"
            "x,Producto AIR,100,x,21,1,1,1,1,x,CategoriaRaw\n"
        )
        data = air.parse(io.BytesIO(csv_text.encode("iso-8859-1")))
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]["proveedor"], "air")
        self.assertEqual(data[0]["producto"], "Producto AIR")
        self.assertEqual(data[0]["categoriaRaw"], "CategoriaRaw")
        self.assertEqual(data[0]["categoria"], "CategoriaRaw")
        self.assertEqual(data[0]["precio"], 121)
        self.assertIsNone(data[0]["imagenUrl"])
        self.assertIsNone(data[0]["descripcion"])

    def test_enrich_descripciones_usa_mas_info(self):
        registros = [
            {
                "proveedor": "air",
                "codigo": "CX62682",
                "producto": "PC",
                "categoriaRaw": "cat",
                "categoria": "cat",
                "precio": 100,
                "imagenUrl": None,
                "descripcion": None,
            }
        ]

        class FakeResp:
            def raise_for_status(self):
                return None

            def json(self):
                return {"codiart": "CX62682", "texto": "Panel IPS\n8GB RAM"}

        fake_session = mock.Mock()
        fake_session.get.return_value = FakeResp()

        out = air.enrich_descripciones(registros, session=fake_session, max_workers=1)
        self.assertEqual(out[0]["descripcion"], "Panel IPS\n8GB RAM")
        fake_session.get.assert_called()
        args, kwargs = fake_session.get.call_args
        self.assertIn("mas_info.php", args[0])
        self.assertEqual(kwargs.get("params", {}).get("codiart"), "CX62682")


class TestNbParser(unittest.TestCase):
    def test_tabla_nb_parsea_fila_valida(self):
        csv_text = (
            "h0;h1;h2;h3;h4;h5;h6;h7;h8;h9;h10\n"
            "x;x;CategoriaNB;Producto NB;x;x;x;x;x;x;150\n"
        )
        data = nb.parse(io.BytesIO(csv_text.encode("utf-8")))
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]["proveedor"], "nb")
        self.assertEqual(data[0]["producto"], "Producto NB")
        self.assertEqual(data[0]["categoriaRaw"], "CategoriaNB")
        self.assertEqual(data[0]["categoria"], "CategoriaNB")
        self.assertEqual(data[0]["precio"], 150)
        self.assertIsNone(data[0].get("descripcion"))

    def test_tabla_nb_lee_columna_atributos(self):
        csv_text = (
            "CODIGO;X;CATEGORIA;PRODUCTO;IMAGEN;A;B;C;D;E;PRECIO;ATRIBUTOS\n"
            "sku1;x;CatNB;Producto NB;img;x;x;x;x;x;150;RAM 16GB / SSD 512\n"
        )
        data = nb.parse(io.BytesIO(csv_text.encode("utf-8")))
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]["descripcion"], "RAM 16GB / SSD 512")
        self.assertIsNone(data[0].get("atributos"))

    def test_tabla_nb_lineas_kv_a_atributos(self):
        csv_text = (
            "CODIGO;X;CATEGORIA;PRODUCTO;IMAGEN;A;B;C;D;E;PRECIO;ATRIBUTOS\n"
            'sku1;x;CatNB;Producto NB;img;x;x;x;x;x;150;"RAM: 16GB\nSSD: 512GB"\n'
        )
        data = nb.parse(io.BytesIO(csv_text.encode("utf-8")))
        self.assertEqual(len(data), 1)
        self.assertIsNone(data[0]["descripcion"])
        self.assertEqual(
            data[0]["atributos"],
            [{"nombre": "RAM", "valor": "16GB"}, {"nombre": "SSD", "valor": "512GB"}],
        )


class TestMegaParser(unittest.TestCase):
    def test_tabla_mega_parsea_categoria_y_producto(self):
        csv_text = (
            "Componentes;;;;\n"
            "1;\"Producto Mega\";U$s 100;x;+21%\n"
        )
        data = mega.parse(io.BytesIO(csv_text.encode("utf-8")))
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]["proveedor"], "mega")
        self.assertEqual(data[0]["producto"], "Producto Mega")
        self.assertEqual(data[0]["categoriaRaw"], "Componentes")
        self.assertEqual(data[0]["categoria"], "Componentes")
        self.assertEqual(data[0]["precio"], 121)


class TestElitParser(unittest.TestCase):
    def test_producto_to_registro_incluye_atributos(self):
        item = {
            "codigo_producto": "ABC",
            "nombre": "Notebook",
            "sub_categoria": "Notebooks",
            "precio": 100,
            "iva": 0.21,
            "stock_total": 2,
            "stock_deposito_cliente": 0,
            "stock_deposito_cd": 0,
            "imagenes": ["https://example.com/a.jpg"],
            "atributos": [
                {"nombre": "RAM", "valor": "16GB"},
                {"nombre": "SSD", "valor": "512GB"},
            ],
        }
        reg = elit.producto_to_registro(item)
        self.assertIsNotNone(reg)
        self.assertEqual(reg["codigo"], "ABC")
        self.assertEqual(
            reg["atributos"],
            [{"nombre": "RAM", "valor": "16GB"}, {"nombre": "SSD", "valor": "512GB"}],
        )
        self.assertIsNone(reg["descripcion"])

    def test_producto_to_registro_mapea_clave_atributo_de_api(self):
        """La API Elit usa {atributo, valor}, no {nombre, valor}."""
        item = {
            "codigo_producto": "RR-212",
            "nombre": "Cooler",
            "sub_categoria": "Coolers",
            "precio": 100,
            "iva": 0.21,
            "stock_total": 1,
            "stock_deposito_cliente": 0,
            "stock_deposito_cd": 0,
            "descripcion": "Tipo: Aire. Color: Negro",
            "atributos": [
                {"atributo": "Tipo", "valor": "Aire"},
                {"atributo": "Color", "valor": "Negro"},
            ],
        }
        reg = elit.producto_to_registro(item)
        self.assertEqual(
            reg["atributos"],
            [{"nombre": "Tipo", "valor": "Aire"}, {"nombre": "Color", "valor": "Negro"}],
        )
        # No duplicar el flatten de la API en descripcion.
        self.assertIsNone(reg["descripcion"])

    def test_producto_to_registro_fallback_descripcion_aplanada(self):
        item = {
            "codigo_producto": "X1",
            "nombre": "Prod",
            "categoria": "Cat",
            "precio": 10,
            "iva": 21,
            "stock_total": 1,
            "stock_deposito_cliente": 0,
            "stock_deposito_cd": 0,
            "atributos": [],
            "descripcion": "Tipo: Aire. Color: Negro",
        }
        reg = elit.producto_to_registro(item)
        self.assertIsNone(reg["descripcion"])
        self.assertEqual(
            reg["atributos"],
            [{"nombre": "Tipo", "valor": "Aire"}, {"nombre": "Color", "valor": "Negro"}],
        )

    def test_parse_json_con_atributos(self):
        payload = {
            "resultado": [
                {
                    "codigo_producto": "SKU1",
                    "nombre": "Prod Elit",
                    "categoria": "Cat",
                    "precio": 50,
                    "iva": 21,
                    "stock_total": 1,
                    "stock_deposito_cliente": 0,
                    "stock_deposito_cd": 0,
                    "atributos": [{"nombre": "Color", "valor": "Negro"}],
                }
            ]
        }
        data = elit.parse(io.BytesIO(json.dumps(payload).encode("utf-8")))
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]["atributos"], [{"nombre": "Color", "valor": "Negro"}])


class TestElitFetcher(unittest.TestCase):
    def test_primera_pagina_no_envia_offset_cero(self):
        from fetchers.fetch_elit import _elit_api_params

        self.assertEqual(_elit_api_params(0), {"limit": 100})
        self.assertEqual(_elit_api_params(100), {"limit": 100, "offset": 100})

    def test_json_api_pagina_con_paginador(self):
        from fetchers import fetch_elit

        payload = {
            "codigo": 200,
            "paginador": {"total": 2, "limit": 100, "offset": 0},
            "resultado": [
                {
                    "codigo_producto": "A",
                    "nombre": "Prod A",
                    "categoria": "Cat",
                    "precio": 10,
                    "iva": 21,
                    "stock_total": 1,
                }
            ],
        }

        class FakeResp:
            def __init__(self, body):
                self._payload = body
                self.status_code = 200
                self.text = json.dumps(body)

            def raise_for_status(self):
                return None

            def json(self):
                return self._payload

        with mock.patch("fetchers.fetch_elit.requests.post") as post:
            post.return_value = FakeResp(payload)
            data = fetch_elit._fetch_elit_json_api(1, "tok")
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]["codigo"], "A")
        _, kwargs = post.call_args
        self.assertEqual(kwargs["params"], {"limit": 100})
        self.assertNotIn("offset", kwargs["params"])
        self.assertEqual(kwargs["json"], {"user_id": 1, "token": "tok"})


class TestInvidParser(unittest.TestCase):
    def test_categoria_desde_categories_con_padre(self):
        item = {
            "ID": "0415879",
            "TITLE": "Pen Drive",
            "PRICE": "10",
            "CATEGORY": "Pen Drive",
            "CATEGORIES": [
                {
                    "ID": "20",
                    "NAME": "Pen Drive",
                    "IS_PRIMARY": True,
                    "PARENT": {"ID": "2", "NAME": "Almacenamiento"},
                }
            ],
        }
        reg = invid.articulo_to_registro(item)
        self.assertEqual(reg["categoriaRaw"], "Almacenamiento /Pen Drive")
        self.assertEqual(reg["categoria"], "Almacenamiento /Pen Drive")

    def test_categoria_tres_niveles_desde_categories(self):
        item = {
            "ID": "1",
            "TITLE": "Cable UTP",
            "PRICE": "10",
            "CATEGORY": "De red",
            "CATEGORIES": [
                {
                    "ID": "3",
                    "NAME": "De red",
                    "IS_PRIMARY": True,
                    "PARENT": {"ID": "2", "NAME": "Cables"},
                },
                {
                    "ID": "2",
                    "NAME": "Cables",
                    "IS_PRIMARY": False,
                    "PARENT": {"ID": "1", "NAME": "Conectividad"},
                },
            ],
        }
        self.assertEqual(
            invid.categoria_from_articulo(item),
            "Conectividad /Cables /De red",
        )

    def test_categoria_fallback_category_si_no_hay_categories(self):
        item = {
            "ID": "2",
            "TITLE": "Proyector",
            "PRICE": "10",
            "CATEGORY": "Proyectores",
        }
        self.assertEqual(invid.categoria_from_articulo(item), "Proyectores")

    def test_articulo_to_registro_long_description(self):
        item = {
            "ID": "123",
            "TITLE": "Mouse USB",
            "FINAL_PRICE": "10",
            "CATEGORY": "Perifericos",
            "IMAGE_URL": "https://example.com/m.jpg",
            "LONG_DESCRIPTION": "  Sensor óptico 1600 DPI  ",
        }
        reg = invid.articulo_to_registro(item)
        self.assertIsNotNone(reg)
        self.assertEqual(reg["descripcion"], "Sensor óptico 1600 DPI")
        self.assertIsNone(reg["atributos"])

    def test_articulo_to_registro_strips_html_long_description(self):
        item = {
            "ID": "125",
            "TITLE": "Mouse USB",
            "FINAL_PRICE": "10",
            "CATEGORY": "Perifericos",
            "LONG_DESCRIPTION": (
                "<p>Sensor &oacute;ptico <b>1600 DPI</b></p>"
                "<ul><li>USB</li><li>Negro</li></ul>"
            ),
        }
        reg = invid.articulo_to_registro(item)
        self.assertIsNotNone(reg)
        self.assertEqual(reg["descripcion"], "Sensor óptico 1600 DPI\nUSB\nNegro")
        self.assertNotIn("<", reg["descripcion"])
        self.assertIsNone(reg["atributos"])

    def test_articulo_to_registro_tabla_html_a_atributos(self):
        html = """
<table style="height: 341px; width: 610px;" border="0" cellspacing="0" cellpadding="0">
<tbody>
<tr>
<td width="296" height="20"><strong>Descripci&oacute;n</strong></td>
<td width="268">Brazo articulado cl&aacute;sico</td>
</tr>
<tr>
<td height="20"><strong>Recomendado para</strong></td>
<td>Configuraciones con varios monitores</td>
</tr>
<tr>
<td height="20"><strong>Colores</strong></td>
<td>Negro</td>
</tr>
<tr>
<td height="20"><strong>Alcance horizontal</strong></td>
<td>78 cm&nbsp; 95 cm</td>
</tr>
<tr>
<td height="20"><strong>Capacidad de carga</strong></td>
<td>250&ndash;1000 g</td>
</tr>
</tbody>
</table>
"""
        item = {
            "ID": "126",
            "TITLE": "Brazo monitor",
            "FINAL_PRICE": "50",
            "CATEGORY": "Soportes",
            "LONG_DESCRIPTION": html,
        }
        reg = invid.articulo_to_registro(item)
        self.assertIsNotNone(reg)
        self.assertEqual(reg["descripcion"], "Brazo articulado clásico")
        self.assertEqual(
            reg["atributos"],
            [
                {"nombre": "Recomendado para", "valor": "Configuraciones con varios monitores"},
                {"nombre": "Colores", "valor": "Negro"},
                {"nombre": "Alcance horizontal", "valor": "78 cm 95 cm"},
                {"nombre": "Capacidad de carga", "valor": "250–1000 g"},
            ],
        )

    def test_articulo_sin_long_description(self):
        item = {
            "ID": "124",
            "TITLE": "Teclado",
            "PRICE": "20",
            "CATEGORY": "Perifericos",
        }
        reg = invid.articulo_to_registro(item)
        self.assertIsNotNone(reg)
        self.assertIsNone(reg["descripcion"])
        self.assertIsNone(reg["atributos"])

class TestExtraerPayload(unittest.TestCase):
    def test_extraer_payload_valido(self):
        proveedor, contenido = extraer_payload(
            {"data": {"nombreProveedor": " AIR ", "base64": "abc"}}
        )
        self.assertEqual(proveedor, "air")
        self.assertEqual(contenido, "abc")

    def test_extraer_payload_invalido(self):
        with self.assertRaises(ValueError):
            extraer_payload({"data": {"nombreProveedor": "air"}})


if __name__ == "__main__":
    unittest.main()
