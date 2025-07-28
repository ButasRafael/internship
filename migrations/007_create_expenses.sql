START TRANSACTION;
CREATE TABLE IF NOT EXISTS expenses (
                                        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                                        user_id BIGINT UNSIGNED NOT NULL,
                                        category_id BIGINT UNSIGNED DEFAULT NULL,
                                        name VARCHAR(255) NOT NULL,
                                        amount_cents INT UNSIGNED NOT NULL,
                                        currency CHAR(3) NOT NULL DEFAULT 'RON',
                                        frequency ENUM('once','weekly','monthly','yearly') NOT NULL,
                                        start_date DATE NOT NULL,
                                        end_date DATE DEFAULT NULL,
                                        is_active TINYINT(1) NOT NULL DEFAULT 1,
                                        notes TEXT,
                                        CONSTRAINT fk_exp_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                                        CONSTRAINT fk_exp_cat  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
                                        INDEX idx_exp_user (user_id),
                                        INDEX idx_exp_user_active (user_id, is_active)
);
COMMIT;