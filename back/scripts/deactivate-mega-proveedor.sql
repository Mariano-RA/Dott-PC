-- Baja lógica de MEGA (Proveedores.activo = false).
-- El maestro es la única fuente: inactivo queda fuera de catálogo, dólar,
-- descarga automática, CSV y cache masivo de imágenes.
-- Reactivar: UPDATE Proveedores SET activo = 1 WHERE nombre = 'mega';
--
-- From project root:
--   mysql -h HOST -u USER -p DATABASE < back/scripts/deactivate-mega-proveedor.sql

UPDATE Proveedores
SET activo = 0
WHERE nombre = 'mega';
