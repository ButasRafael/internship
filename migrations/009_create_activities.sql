START TRANSACTION;
CREATE TABLE IF NOT EXISTS activities (
                                          id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                                          user_id BIGINT UNSIGNED NOT NULL,
                                          category_id BIGINT UNSIGNED DEFAULT NULL,
                                          name VARCHAR(255) NOT NULL,
                                          duration_minutes INT UNSIGNED NOT NULL,
                                          frequency ENUM('once','weekly','monthly','yearly') NOT NULL,
                                          direct_cost_cents INT UNSIGNED NOT NULL DEFAULT 0,
                                          saved_minutes INT UNSIGNED NOT NULL DEFAULT 0,
                                          currency CHAR(3) NOT NULL DEFAULT 'RON',
                                          notes TEXT,
                                          CONSTRAINT fk_act_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                                          CONSTRAINT fk_act_cat  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
                                          INDEX idx_act_user (user_id)
);
COMMIT;