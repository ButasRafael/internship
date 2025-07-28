START TRANSACTION;
CREATE TABLE IF NOT EXISTS scenarios (
                                         id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                                         user_id BIGINT UNSIGNED NOT NULL,
                                         name VARCHAR(255) NOT NULL,
                                         params_json JSON NOT NULL,
                                         created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                         CONSTRAINT fk_scn_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                                         INDEX idx_scn_user (user_id)
);
COMMIT;