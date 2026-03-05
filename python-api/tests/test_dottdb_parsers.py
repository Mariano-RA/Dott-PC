import os
import io
import unittest
from unittest.mock import patch

# Required by dottDB module at import time.
os.environ.setdefault("RABBITMQ_URL", "localhost")
os.environ.setdefault("RABBITMQ_QUEUE", "q_out")
os.environ.setdefault("RABBITMQ_PYTHON_QUEUE", "q_in")

import dottDB


class TestDottDbParsers(unittest.TestCase):
    @patch("dottDB.normalizar_categoria", return_value="CatNorm")
    def test_tabla_air_parsea_fila_valida(self, _mock_categoria):
        csv_text = (
            "h0,h1,h2,h3,h4,h5,h6,h7,h8,h9,h10\n"
            "x,Producto AIR,100,x,21,1,1,1,1,x,CategoriaRaw\n"
        )
        data = dottDB.tablaAir(io.BytesIO(csv_text.encode("iso-8859-1")))

        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]["proveedor"], "air")
        self.assertEqual(data[0]["producto"], "Producto AIR")
        self.assertEqual(data[0]["categoria"], "CatNorm")
        self.assertEqual(data[0]["precio"], 121)

    @patch("dottDB.normalizar_categoria", return_value="CatNorm")
    def test_tabla_nb_parsea_fila_valida(self, _mock_categoria):
        csv_text = (
            "h0;h1;h2;h3;h4;h5;h6;h7;h8;h9;h10\n"
            "x;x;CategoriaNB;Producto NB;x;x;x;x;x;x;150\n"
        )
        data = dottDB.tablaNb(io.BytesIO(csv_text.encode("utf-8")))

        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]["proveedor"], "nb")
        self.assertEqual(data[0]["producto"], "Producto NB")
        self.assertEqual(data[0]["categoria"], "CatNorm")
        self.assertEqual(data[0]["precio"], 150)

    @patch("dottDB.normalizar_categoria", return_value="CatNorm")
    def test_tabla_mega_parsea_categoria_y_producto(self, _mock_categoria):
        csv_text = (
            "Componentes;;;;\n"
            "1;\"Producto Mega\";U$s 100;x;+21%\n"
        )
        data = dottDB.tablaMega(io.BytesIO(csv_text.encode("utf-8")))

        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]["proveedor"], "mega")
        self.assertEqual(data[0]["producto"], "Producto Mega")
        self.assertEqual(data[0]["categoria"], "CatNorm")
        self.assertEqual(data[0]["precio"], 121)

    def test_extraer_payload_valido(self):
        proveedor, contenido = dottDB._extraer_payload(
            {"data": {"nombreProveedor": " AIR ", "base64": "abc"}}
        )
        self.assertEqual(proveedor, "air")
        self.assertEqual(contenido, "abc")

    def test_extraer_payload_invalido(self):
        with self.assertRaises(ValueError):
            dottDB._extraer_payload({"data": {"nombreProveedor": "air"}})


if __name__ == "__main__":
    unittest.main()
