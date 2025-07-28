START TRANSACTION;
CREATE TABLE IF NOT EXISTS users (
    id             BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    email          VARCHAR(255)     UNIQUE NOT NULL,
    password_hash  VARCHAR(255),
    role_id        BIGINT UNSIGNED  NOT NULL,
    token_version  INT              NOT NULL DEFAULT 0,
    hourly_rate    DECIMAL(10,2)    NOT NULL DEFAULT 0,
    currency       CHAR(3)          NOT NULL DEFAULT 'RON',
    timezone       VARCHAR(64)      NOT NULL DEFAULT 'Europe/Bucharest',
    created_at     TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id)
);
COMMIT;
