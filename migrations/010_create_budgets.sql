START TRANSACTION;
CREATE TABLE IF NOT EXISTS budgets (
                                       id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                                       user_id BIGINT UNSIGNED NOT NULL,
                                       period_start DATE NOT NULL,
                                       period_end   DATE NOT NULL,
                                       currency CHAR(3) NOT NULL DEFAULT 'RON',
                                       created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                       CONSTRAINT fk_budget_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                                       INDEX idx_budget_user_period (user_id, period_start, period_end)
);
COMMIT;