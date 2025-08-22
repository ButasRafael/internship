START TRANSACTION;
CREATE TABLE IF NOT EXISTS notifications (
                                             id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                                             alert_id BIGINT UNSIGNED NOT NULL,
                                             sent_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                             channel ENUM('email','telegram','webhook','websocket') NOT NULL DEFAULT 'email',
                                             payload_json JSON NOT NULL,
                                             dedupe_key VARCHAR(190)
                                                 GENERATED ALWAYS AS (JSON_UNQUOTE(JSON_EXTRACT(payload_json, '$.dedupe_key'))) STORED,

                                             CONSTRAINT fk_notif_alert FOREIGN KEY (alert_id) REFERENCES alerts(id) ON DELETE CASCADE,

                                             INDEX idx_notif_alert (alert_id),
                                             INDEX idx_notif_dedupe (alert_id, channel, dedupe_key, sent_at),

                                             UNIQUE KEY uq_notif_stamp (alert_id, channel, sent_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
COMMIT;