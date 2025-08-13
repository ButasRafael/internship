ALTER TABLE exchange_rates
    MODIFY rate DECIMAL(20,8) NOT NULL CHECK (rate > 0);
