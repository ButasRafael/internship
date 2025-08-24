START TRANSACTION;
CREATE TABLE IF NOT EXISTS user_hourly_rates (
    id               BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id          BIGINT UNSIGNED NOT NULL,
    effective_month  DATE NOT NULL,
    hourly_rate      DECIMAL(10,2) NOT NULL DEFAULT 0,
    created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_uhr_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uq_user_month (user_id, effective_month),
    INDEX idx_user_month (user_id, effective_month)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
COMMIT;

