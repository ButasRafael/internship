START TRANSACTION;
ALTER TABLE users
    ADD COLUMN email_verified TINYINT(1) NOT NULL DEFAULT 0
        COMMENT '0 = pending, 1 = verified';
COMMIT;
