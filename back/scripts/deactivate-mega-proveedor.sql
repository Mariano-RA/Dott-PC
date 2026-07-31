-- Baja lógica de MEGA en descarga automática / catálogo (Proveedores.activo = false).
-- "Todos" en fetch-prices solo incluye proveedores activos con fetcher.
-- Reactivar: UPDATE Proveedores SET activo = 1 WHERE nombre = 'mega';
--
-- From project root:
--   mysql -h HOST -u USER -p DATABASE < back/scripts/deactivate-mega-proveedor.sql

UPDATE Proveedores
SET activo = 0
WHERE nombre = 'mega';
