START TRANSACTION;
CREATE TABLE IF NOT EXISTS permissions (
    id     BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    action VARCHAR(128) NOT NULL UNIQUE
);
COMMIT;