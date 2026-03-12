-- Add gateways column to CalculatorSettings (JSON config per payment gateway).
-- Run this on your MySQL DB if you get: Unknown column 'CalculatorSetting.gateways' in 'field list'
--
-- From project root:
--   mysql -h HOST -u USER -p DATABASE < back/scripts/add-calculator-gateways-column.sql
-- Or paste the ALTER below into your MySQL client.

ALTER TABLE CalculatorSettings
  ADD COLUMN gateways TEXT NULL
  COMMENT 'JSON: { tacataca, payway, mercadopago } with costs, vat, plans (TypeORM simple-json)'
  AFTER vat;
