START TRANSACTION;
CREATE TABLE IF NOT EXISTS goal_contributions (
                                                  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                                                  goal_id BIGINT UNSIGNED NOT NULL,
                                                  contributed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                                  amount_cents INT UNSIGNED DEFAULT NULL,
                                                  hours DECIMAL(10,2) DEFAULT NULL,
                                                  source_type ENUM('income','expense_cut','activity_saving','manual') NOT NULL DEFAULT 'manual',
                                                  CONSTRAINT fk_gc_goal FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE,
                                                  INDEX idx_gc_goal (goal_id)
);
COMMIT;