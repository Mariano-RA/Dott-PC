-- Galería: varias imágenes por producto.
-- Si DB_SYNC=true, TypeORM puede crear columnas/tablas nuevas pero NO siempre
-- elimina el unique viejo de ProductImages (proveedorId, codigo). Ejecutar a mano.

ALTER TABLE ProductImages
  ADD COLUMN sortOrder INT NOT NULL DEFAULT 0,
  ADD COLUMN isPrimary TINYINT(1) NOT NULL DEFAULT 1;

-- Reemplazar el unique de una imagen por unique (proveedor, codigo, orden).
-- El nombre del índice viejo puede variar; inspeccionar con: SHOW INDEX FROM ProductImages;
-- Ejemplo:
-- ALTER TABLE ProductImages DROP INDEX IDX_....;

CREATE UNIQUE INDEX IDX_product_images_prov_codigo_order
  ON ProductImages (proveedorId, codigo, sortOrder);

CREATE INDEX IDX_product_images_prov_codigo
  ON ProductImages (proveedorId, codigo);

CREATE TABLE IF NOT EXISTS ProductImageSources (
  id INT NOT NULL AUTO_INCREMENT,
  proveedorId INT NOT NULL,
  codigo VARCHAR(128) NOT NULL,
  sortOrder INT NOT NULL DEFAULT 0,
  sourceUrl VARCHAR(1024) NOT NULL,
  createdAt DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updatedAt DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY IDX_product_image_sources_prov_codigo_order (proveedorId, codigo, sortOrder)
);
