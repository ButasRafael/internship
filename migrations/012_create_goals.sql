START TRANSACTION;
CREATE TABLE IF NOT EXISTS goals (
                                     id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                                     user_id BIGINT UNSIGNED NOT NULL,
                                     name VARCHAR(255) NOT NULL,
                                     target_amount_cents INT UNSIGNED DEFAULT NULL,
                                     target_hours DECIMAL(10,2) DEFAULT NULL,
                                     deadline_date DATE DEFAULT NULL,
                                     priority TINYINT UNSIGNED DEFAULT 3,
                                     status ENUM('active','paused','done','cancelled') NOT NULL DEFAULT 'active',
                                     currency CHAR(3) NOT NULL DEFAULT 'RON',
                                     created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                     CONSTRAINT fk_goal_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                                     INDEX idx_goal_user (user_id)
);
COMMIT;