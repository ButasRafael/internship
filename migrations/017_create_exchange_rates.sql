START TRANSACTION;
CREATE TABLE IF NOT EXISTS exchange_rates (
                                              day DATE NOT NULL,
                                              base CHAR(3) NOT NULL,
                                              quote CHAR(3) NOT NULL,
                                              rate DECIMAL(20,8) NOT NULL,
                                              PRIMARY KEY (day, base, quote)
);
COMMIT;