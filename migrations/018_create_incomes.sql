START TRANSACTION;
CREATE TABLE IF NOT EXISTS incomes (
                                       id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                                       user_id BIGINT UNSIGNED NOT NULL,
                                       received_at DATETIME NOT NULL,
                                       amount_cents INT UNSIGNED NOT NULL,
                                       currency CHAR(3) NOT NULL DEFAULT 'RON',
                                       source ENUM('salary','freelance','bonus','dividend','interest','gift','other') NOT NULL DEFAULT 'other',
                                       recurring ENUM('none','weekly','monthly','yearly') NOT NULL DEFAULT 'none',
                                       notes TEXT,
                                       created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                       CONSTRAINT fk_income_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                                       INDEX idx_income_user_date (user_id, received_at)
);
COMMIT;