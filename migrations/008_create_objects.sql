START TRANSACTION;
CREATE TABLE IF NOT EXISTS objects (
                                       id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                                       user_id BIGINT UNSIGNED NOT NULL,
                                       category_id BIGINT UNSIGNED DEFAULT NULL,
                                       name VARCHAR(255) NOT NULL,
                                       price_cents INT UNSIGNED NOT NULL,
                                       currency CHAR(3) NOT NULL DEFAULT 'RON',
                                       purchase_date DATE NOT NULL,
                                       expected_life_months INT UNSIGNED NOT NULL,
                                       maintenance_cents_per_month INT UNSIGNED NOT NULL DEFAULT 0,
                                       hours_saved_per_month DECIMAL(10,2) DEFAULT 0,
                                       notes TEXT,
                                       CONSTRAINT fk_obj_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                                       CONSTRAINT fk_obj_cat FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
                                       INDEX idx_obj_user (user_id)
);
COMMIT;