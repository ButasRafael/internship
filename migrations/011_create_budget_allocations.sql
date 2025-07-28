START TRANSACTION;
CREATE TABLE IF NOT EXISTS budget_allocations (
                                                  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                                                  budget_id BIGINT UNSIGNED NOT NULL,
                                                  category_id BIGINT UNSIGNED NOT NULL,
                                                  amount_cents INT UNSIGNED NOT NULL,
                                                  CONSTRAINT fk_alloc_budget FOREIGN KEY (budget_id) REFERENCES budgets(id) ON DELETE CASCADE,
                                                  CONSTRAINT fk_alloc_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
                                                  UNIQUE KEY uq_alloc_budget_category (budget_id, category_id)
);
COMMIT;