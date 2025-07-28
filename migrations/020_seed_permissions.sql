START TRANSACTION;
INSERT INTO permissions (action)
VALUES
    ('activity_view'),
    ('activity_manage'),
    ('expense_view'),
    ('expense_manage'),
    ('category_view'),
    ('category_manage'),
    ('object_view'),
    ('object_manage'),
    ('budget_view'),
    ('budget_manage'),
    ('budget_allocation_view'),
    ('budget_allocation_manage'),
    ('goal_view'),
    ('goal_manage'),
    ('goal_contribution_view'),
    ('goal_contribution_manage'),
    ('alert_view'),
    ('alert_manage'),
    ('notification_view'),
    ('notification_manage'),
    ('scenario_view'),
    ('scenario_manage'),
    ('income_view'),
    ('income_manage'),
    ('user_view'),
    ('user_manage'),
    ('exchange_rate_view'),
    ('exchange_rate_manage')
ON DUPLICATE KEY UPDATE
    action = VALUES(action);
COMMIT;
