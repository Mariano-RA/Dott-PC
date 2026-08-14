-- Pasarela usada para cuotas en catálogo, detalle de producto y carrito.
--
-- From project root:
--   mysql -h HOST -u USER -p DATABASE < back/scripts/add-calculator-display-gateway-column.sql

ALTER TABLE CalculatorSettings
  ADD COLUMN displayGatewayKey VARCHAR(64) NULL
  COMMENT 'Pasarela para cuotas de vitrina (catálogo/carrito)'
  AFTER vat;
