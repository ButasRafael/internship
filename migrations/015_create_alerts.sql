START TRANSACTION;
CREATE TABLE IF NOT EXISTS alerts (
                                      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                                      user_id BIGINT UNSIGNED NOT NULL,
                                      name VARCHAR(255) NOT NULL,
                                      rule_type ENUM('percent_expenses_of_income','object_breakeven_reached','budget_overrun') NOT NULL,
                                      rule_config JSON NOT NULL,
                                      is_active TINYINT(1) NOT NULL DEFAULT 1,
                                      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                      CONSTRAINT fk_alert_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                                      INDEX idx_alert_user (user_id),
                                      UNIQUE KEY uq_alert_user_name (user_id, name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
COMMIT;