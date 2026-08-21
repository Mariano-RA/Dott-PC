-- Descripción y atributos técnicos por producto.
-- Ejecutar a mano en prod (DB_SYNC no está habilitado por defecto).

ALTER TABLE Productos
  ADD COLUMN descripcion TEXT NULL,
  ADD COLUMN atributos JSON NULL;
