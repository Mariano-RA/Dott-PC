-- Run this after deploying the CuotaPlanes migration.
-- It removes the legacy Cuotas table, now replaced by CuotaPlanes.
USE dottdb;
DROP TABLE IF EXISTS Cuotas;
