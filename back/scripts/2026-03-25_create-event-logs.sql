-- Persistent backend event logs (Admin -> Logs).
-- Compatible with MySQL 8+ (and most MySQL 5.7+ setups).

CREATE TABLE IF NOT EXISTS `event_logs` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `level` VARCHAR(10) NOT NULL,
  `source` VARCHAR(64) NOT NULL,
  `action` VARCHAR(64) NOT NULL,
  `message` VARCHAR(500) NOT NULL,
  `metaJson` LONGTEXT NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_event_logs_created_at` (`created_at`),
  INDEX `idx_event_logs_level` (`level`),
  INDEX `idx_event_logs_source` (`source`),
  INDEX `idx_event_logs_action` (`action`)
);

