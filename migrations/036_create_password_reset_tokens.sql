START TRANSACTION;

CREATE TABLE IF NOT EXISTS password_reset_tokens (
                                                     id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                                                     user_id      BIGINT UNSIGNED NOT NULL,
                                                     token_hash   CHAR(64) NOT NULL,
                                                     expires_at   DATETIME NOT NULL,
                                                     used_at      DATETIME DEFAULT NULL,
                                                     created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                                     CONSTRAINT fk_prt_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                                                     INDEX idx_prt_user (user_id),
                                                     UNIQUE KEY uq_prt_token (token_hash)
);

COMMIT;
