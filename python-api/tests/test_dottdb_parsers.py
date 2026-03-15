import os
import io
import unittest
# Requerido por módulos que leen env al importar
os.environ.setdefault("RABBITMQ_URL", "localhost")
os.environ.setdefault("RABBITMQ_QUEUE", "q_out")
os.environ.setdefault("RABBITMQ_PYTHON_QUEUE", "q_in")

from parsers import air, nb, mega, extraer_payload


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
