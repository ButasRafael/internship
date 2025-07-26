import { pool } from './db.js';
import { logger } from '../utils/logger.js';
import bcrypt from 'bcryptjs';

const TABLES_IN_DROP_ORDER = [
    'role_permissions',
    'permissions',
    'roles',
    'notifications',
    'alerts',
    'goal_contributions',
    'goals',
    'budget_allocations',
    'budgets',
    'activities',
    'objects',
    'expenses',
    'categories',
    'scenarios',
    'exchange_rates',
    'incomes',
    'users'
];

const ddlStatements = [
    `CREATE TABLE IF NOT EXISTS roles (
                                          id   BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                                          name VARCHAR(64) NOT NULL UNIQUE
     )`,

    `CREATE TABLE IF NOT EXISTS permissions (
                                                id     BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                                                action VARCHAR(128) NOT NULL UNIQUE
     )`,

    `CREATE TABLE IF NOT EXISTS role_permissions (
                                                     role_id       BIGINT UNSIGNED NOT NULL,
                                                     permission_id BIGINT UNSIGNED NOT NULL,
                                                     PRIMARY KEY (role_id, permission_id),
                                                     CONSTRAINT fk_rp_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
                                                     CONSTRAINT fk_rp_perm FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
     )`,

    `CREATE TABLE IF NOT EXISTS users (
                                          id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                                          email          VARCHAR(255) UNIQUE NOT NULL,
                                          password_hash  VARCHAR(255) NULL,
                                          role_id        BIGINT UNSIGNED NOT NULL,
                                          token_version  INT NOT NULL DEFAULT 0,
                                          hourly_rate    DECIMAL(10,2) NOT NULL DEFAULT 0,
                                          currency       CHAR(3) NOT NULL DEFAULT 'RON',
                                          timezone       VARCHAR(64) NOT NULL DEFAULT 'Europe/Bucharest',
                                          created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                          CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles(id)
     )`,

    `CREATE TABLE IF NOT EXISTS categories (
                                               id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                                               user_id BIGINT UNSIGNED NOT NULL,
                                               name VARCHAR(255) NOT NULL,
                                               kind ENUM('expense','object','activity','mixed') NOT NULL DEFAULT 'expense',
                                               CONSTRAINT fk_cat_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                                               UNIQUE KEY uq_category_user_name (user_id, name)
     )`,

    `CREATE TABLE IF NOT EXISTS expenses (
                                             id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                                             user_id BIGINT UNSIGNED NOT NULL,
                                             category_id BIGINT UNSIGNED DEFAULT NULL,
                                             name VARCHAR(255) NOT NULL,
                                             amount_cents INT UNSIGNED NOT NULL,
                                             currency CHAR(3) NOT NULL DEFAULT 'RON',
                                             frequency ENUM('once','weekly','monthly','yearly') NOT NULL,
                                             start_date DATE NOT NULL,
                                             end_date DATE DEFAULT NULL,
                                             is_active TINYINT(1) NOT NULL DEFAULT 1,
                                             notes TEXT,
                                             CONSTRAINT fk_exp_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                                             CONSTRAINT fk_exp_cat  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
                                             INDEX idx_exp_user (user_id),
                                             INDEX idx_exp_user_active (user_id, is_active)
     )`,

    `CREATE TABLE IF NOT EXISTS objects (
                                            id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                                            user_id BIGINT UNSIGNED NOT NULL,
                                            category_id BIGINT UNSIGNED DEFAULT NULL,
                                            name VARCHAR(255) NOT NULL,
                                            price_cents INT UNSIGNED NOT NULL,
                                            currency CHAR(3) NOT NULL DEFAULT 'RON',
                                            purchase_date DATE NOT NULL,
                                            expected_life_months INT UNSIGNED NOT NULL,
                                            maintenance_cents_per_month INT UNSIGNED NOT NULL DEFAULT 0,
                                            hours_saved_per_month DECIMAL(10,2) DEFAULT 0,
                                            notes TEXT,
                                            CONSTRAINT fk_obj_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                                            CONSTRAINT fk_obj_cat FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
                                            INDEX idx_obj_user (user_id)
     )`,

    `CREATE TABLE IF NOT EXISTS activities (
                                               id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                                               user_id BIGINT UNSIGNED NOT NULL,
                                               category_id BIGINT UNSIGNED DEFAULT NULL,
                                               name VARCHAR(255) NOT NULL,
                                               duration_minutes INT UNSIGNED NOT NULL,
                                               frequency ENUM('once','weekly','monthly','yearly') NOT NULL,
                                               direct_cost_cents INT UNSIGNED NOT NULL DEFAULT 0,
                                               saved_minutes INT UNSIGNED NOT NULL DEFAULT 0,
                                               currency CHAR(3) NOT NULL DEFAULT 'RON',
                                               notes TEXT,
                                               CONSTRAINT fk_act_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                                               CONSTRAINT fk_act_cat  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
                                               INDEX idx_act_user (user_id)
     )`,

    `CREATE TABLE IF NOT EXISTS budgets (
                                            id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                                            user_id BIGINT UNSIGNED NOT NULL,
                                            period_start DATE NOT NULL,
                                            period_end   DATE NOT NULL,
                                            currency CHAR(3) NOT NULL DEFAULT 'RON',
                                            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                            CONSTRAINT fk_budget_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                                            INDEX idx_budget_user_period (user_id, period_start, period_end)
     )`,

    `CREATE TABLE IF NOT EXISTS budget_allocations (
                                                       id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                                                       budget_id BIGINT UNSIGNED NOT NULL,
                                                       category_id BIGINT UNSIGNED NOT NULL,
                                                       amount_cents INT UNSIGNED NOT NULL,
                                                       CONSTRAINT fk_alloc_budget FOREIGN KEY (budget_id) REFERENCES budgets(id) ON DELETE CASCADE,
                                                       CONSTRAINT fk_alloc_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
                                                       UNIQUE KEY uq_alloc_budget_category (budget_id, category_id)
     )`,

    `CREATE TABLE IF NOT EXISTS goals (
                                          id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                                          user_id BIGINT UNSIGNED NOT NULL,
                                          name VARCHAR(255) NOT NULL,
                                          target_amount_cents INT UNSIGNED DEFAULT NULL,
                                          target_hours DECIMAL(10,2) DEFAULT NULL,
                                          deadline_date DATE DEFAULT NULL,
                                          priority TINYINT UNSIGNED DEFAULT 3,
                                          status ENUM('active','paused','done','cancelled') NOT NULL DEFAULT 'active',
                                          currency CHAR(3) NOT NULL DEFAULT 'RON',
                                          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                          CONSTRAINT fk_goal_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                                          INDEX idx_goal_user (user_id)
     )`,

    `CREATE TABLE IF NOT EXISTS goal_contributions (
                                                       id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                                                       goal_id BIGINT UNSIGNED NOT NULL,
                                                       contributed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                                       amount_cents INT UNSIGNED DEFAULT NULL,
                                                       hours DECIMAL(10,2) DEFAULT NULL,
                                                       source_type ENUM('income','expense_cut','activity_saving','manual') NOT NULL DEFAULT 'manual',
                                                       CONSTRAINT fk_gc_goal FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE,
                                                       INDEX idx_gc_goal (goal_id)
     )`,

    `CREATE TABLE IF NOT EXISTS scenarios (
                                              id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                                              user_id BIGINT UNSIGNED NOT NULL,
                                              name VARCHAR(255) NOT NULL,
                                              params_json JSON NOT NULL,
                                              created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                              CONSTRAINT fk_scn_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                                              INDEX idx_scn_user (user_id)
     )`,

    `CREATE TABLE IF NOT EXISTS alerts (
     id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
     user_id BIGINT UNSIGNED NOT NULL,
     name VARCHAR(255) NOT NULL,
     rule_type ENUM('percent_expenses_of_income','object_breakeven_reached','budget_overrun') NOT NULL,
     rule_config JSON NOT NULL,
     is_active TINYINT(1) NOT NULL DEFAULT 1,
     created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
     CONSTRAINT fk_alert_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
     INDEX idx_alert_user (user_id)
   )`,

    `CREATE TABLE IF NOT EXISTS notifications (
     id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
     alert_id BIGINT UNSIGNED NOT NULL,
     sent_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
     channel ENUM('email','telegram','webhook') NOT NULL DEFAULT 'email',
     payload_json JSON NOT NULL,
     CONSTRAINT fk_notif_alert FOREIGN KEY (alert_id) REFERENCES alerts(id) ON DELETE CASCADE,
     INDEX idx_notif_alert (alert_id)
   )`,

    `CREATE TABLE IF NOT EXISTS exchange_rates (
     day DATE NOT NULL,
     base CHAR(3) NOT NULL,
     quote CHAR(3) NOT NULL,
     rate DECIMAL(20,8) NOT NULL,
     PRIMARY KEY (day, base, quote)
   )`,

    `CREATE TABLE IF NOT EXISTS incomes (
                                            id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                                            user_id BIGINT UNSIGNED NOT NULL,
                                            received_at DATETIME NOT NULL,
                                            amount_cents INT UNSIGNED NOT NULL,
                                            currency CHAR(3) NOT NULL DEFAULT 'RON',
                                            source ENUM('salary','freelance','bonus','dividend','interest','gift','other') NOT NULL DEFAULT 'other',
                                            recurring ENUM('none','weekly','monthly','yearly') NOT NULL DEFAULT 'none',
                                            notes TEXT,
                                            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                            CONSTRAINT fk_income_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                                            INDEX idx_income_user_date (user_id, received_at)
     )`
];

const PERMISSIONS = [
    'activity_view','activity_manage',
    'expense_view','expense_manage',
    'category_view','category_manage',
    'object_view','object_manage',
    'budget_view','budget_manage',
    'budget_allocation_view','budget_allocation_manage',
    'goal_view','goal_manage',
    'goal_contribution_view','goal_contribution_manage',
    'alert_view','alert_manage',
    'notification_view','notification_manage',
    'scenario_view','scenario_manage',
    'income_view','income_manage',
    'user_view','user_manage',
    'exchange_rate_view','exchange_rate_manage'
];

const seedUsers = [
    { email: 'alice@example.com', role_id: 1, hourly_rate: 100, currency: 'RON', password: 'demo1234' }, // admin
    { email: 'bob@example.com',   role_id: 2, hourly_rate: 80,  currency: 'RON', password: 'demo1234' }, // user
    { email: 'carol@example.com', role_id: 2, hourly_rate: 120, currency: 'RON', password: 'demo1234' }  // user
];

const seedCategories = (userId) => ([
    [userId, 'Housing', 'expense'],
    [userId, 'Subscriptions', 'expense'],
    [userId, 'Objects', 'object'],
    [userId, 'Activities', 'activity'],
    [userId, 'Food', 'expense']
]);

const seedFx = () => ([
    ['2025-08-01', 'EUR', 'RON', 4.97],
    ['2025-08-01', 'USD', 'RON', 4.55]
]);

const seedIncomes = (userId, currency, i) => {
    switch (i) {
        case 0:
            return [
                [userId, '2025-08-01 09:00:00', 2000000, currency, 'salary',   'monthly', 'Salary August'],
                [userId, '2025-08-15 12:00:00',  200000, currency, 'freelance','none',    'Side gig']
            ];
        case 1:
            return [
                [userId, '2025-09-01 09:00:00', 1500000, currency, 'salary', 'monthly', 'Salary September']
            ];
        case 2:
            return [
                [userId, '2025-10-01 09:00:00', 2500000, currency, 'salary', 'monthly', 'Salary October'],
                [userId, '2025-10-10 17:00:00',  500000, currency, 'bonus',  'none',    'Performance bonus']
            ];
        default:
            return [];
    }
};

function makePerUserSeeds(i, { userId, currency, categoryIds }) {
    switch (i) {
        case 0:
            return {
                expenses: [
                    [userId, categoryIds.Subscriptions, 'Netflix',  5999,  'RON', 'monthly', '2025-08-01', null, 1, null],
                    [userId, categoryIds.Housing,       'Chirie',  220000, 'RON', 'monthly', '2025-08-01', null, 1, null],
                    [userId, categoryIds.Food,          'Kaufland', 12000, 'RON', 'weekly',  '2025-08-01', null, 1, 'Grocery']
                ],
                objects: [
                    [userId, categoryIds.Objects, 'Espressor', 120000, 'RON', '2025-07-01', 24, 0, 2.5, 'face cafea rapid']
                ],
                activities: [
                    [userId, categoryIds.Activities, 'Gătit acasă',     60, 'weekly', 3000, 45, 'RON', 'Merită?'],
                    [userId, categoryIds.Activities, 'Bolt spre birou', 20, 'weekly', 2000, 15, 'RON', null]
                ],
                budgets: [
                    [userId, '2025-08-01', '2025-08-31', currency]
                ],
                budget_allocations: (budgetId) => ([
                    [budgetId, categoryIds.Housing,       2200000],
                    [budgetId, categoryIds.Subscriptions, 100000],
                    [budgetId, categoryIds.Food,           80000]
                ]),
                goals: [
                    [userId, 'Fond de urgență', 1000000, null, '2026-06-01', 1, 'active', currency]
                ],
                goal_contribs: (goalId) => ([
                    [goalId, '2025-08-05 10:00:00', 100000, null, 'income']
                ]),
                scenarios: [
                    [userId, 'Trec la 150 RON/h', JSON.stringify({ new_hourly_rate: 150, compare: 'current' })]
                ],
                alerts: [
                    [userId, 'Cheltuieli > 30% din venit', 'percent_expenses_of_income', JSON.stringify({ threshold: 0.3 }), 1]
                ],
                notifications: (alertId) => ([
                    [alertId, '2025-08-10 09:00:00', 'email', JSON.stringify({ msg: 'Depășești 30% din venitul lunar!' })]
                ])
            };

        case 1:
            return {
                expenses: [
                    [userId, categoryIds.Subscriptions, 'HBO Max', 2999, 'RON', 'monthly', '2025-08-01', null, 1, null],
                    [userId, categoryIds.Food,          'Glovo',   8000, 'RON', 'weekly',  '2025-08-01', null, 1, 'Food delivery']
                ],
                objects: [
                    [userId, categoryIds.Objects, 'Bicicletă', 150000, 'RON', '2025-04-10', 60, 0, 3.0, 'Economisesc transport']
                ],
                activities: [
                    [userId, categoryIds.Activities, 'Meal prep duminică', 120, 'weekly', 2000, 60, 'RON', 'Prep reduces time during the week']
                ],
                budgets: [
                    [userId, '2025-09-01', '2025-09-30', currency]
                ],
                budget_allocations: (budgetId) => ([
                    [budgetId, categoryIds.Food,          150000],
                    [budgetId, categoryIds.Subscriptions,  50000]
                ]),
                goals: [
                    [userId, 'Vacanță Mare', 300000, null, '2026-08-01', 2, 'active', currency]
                ],
                goal_contribs: (goalId) => ([
                    [goalId, '2025-09-01 08:00:00', 20000, null, 'income']
                ]),
                scenarios: [
                    [userId, 'Reduc cheltuieli cu 20%', JSON.stringify({ cut_expenses_percent: 0.2 })]
                ],
                alerts: [
                    [userId, 'Buget Food > 1000 RON', 'budget_overrun', JSON.stringify({ category: 'Food', limit_cents: 100000 }), 1]
                ],
                notifications: (alertId) => ([
                    [alertId, '2025-09-15 09:00:00', 'email', JSON.stringify({ msg: 'Ai depășit bugetul la Food!' })]
                ])
            };

        case 2:
            return {
                expenses: [
                    [userId, categoryIds.Subscriptions, 'Spotify',  2799,  'RON', 'monthly', '2025-08-01', null, 1, null],
                    [userId, categoryIds.Housing,       'Chirie',  180000, 'RON', 'monthly', '2025-08-01', null, 1, null],
                    [userId, categoryIds.Food,          'Mega',    10000,  'RON', 'weekly',  '2025-08-01', null, 1, null]
                ],
                objects: [
                    [userId, categoryIds.Objects, 'MacBook Pro', 1200000, 'RON', '2025-05-01', 48, 0, 4.0, 'Boost la productivitate']
                ],
                activities: [
                    [userId, categoryIds.Activities, 'Curier în loc de mers personal', 40, 'monthly', 2500, 90, 'RON', 'Economisesc 1.5h']
                ],
                budgets: [
                    [userId, '2025-10-01', '2025-10-31', currency]
                ],
                budget_allocations: (budgetId) => ([
                    [budgetId, categoryIds.Housing,       1800000],
                    [budgetId, categoryIds.Subscriptions,  80000],
                    [budgetId, categoryIds.Food,          120000]
                ]),
                goals: [
                    [userId, 'Avans apartament', 3000000, null, '2027-01-01', 1, 'active', currency]
                ],
                goal_contribs: (goalId) => ([
                    [goalId, '2025-10-05 15:00:00', 500000, null, 'manual']
                ]),
                scenarios: [
                    [userId, 'Trec pe 4 zile/săpt.', JSON.stringify({ work_days_per_week: 4, expected_rate: 140 })]
                ],
                alerts: [
                    [userId, 'Obiect amortizat', 'object_breakeven_reached', JSON.stringify({ object_name: 'MacBook Pro' }), 1]
                ],
                notifications: (alertId) => ([
                    [alertId, '2025-10-20 09:00:00', 'email', JSON.stringify({ msg: 'MacBook aproape amortizat!' })]
                ])
            };

        default:
            throw new Error('Unexpected user index');
    }
}

async function seedRBAC(conn) {
    await conn.query(`INSERT IGNORE INTO roles (id, name) VALUES (1,'admin'), (2,'user')`);

    const [[{ pc }]] = await conn.query(`SELECT COUNT(*) pc FROM permissions`);
    if (pc === 0) {
        await conn.query(
            `INSERT INTO permissions (action) VALUES ${PERMISSIONS.map(() => '(?)').join(',')}`,
            PERMISSIONS
        );
    }

    const [perms] = await conn.query(`SELECT id, action FROM permissions`);

    const adminPairs = perms.map(p => [1, p.id]);
    await conn.query(`INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES ?`, [adminPairs]);

    const userAllowed = perms.filter(p => !/^user_/.test(p.action) && !/^exchange_rate_/.test(p.action));
    const userPairs = userAllowed.map(p => [2, p.id]);
    await conn.query(`INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES ?`, [userPairs]);
}

export async function bootstrapDb() {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        if (process.env.RESET_DB === 'true') {
            logger.warn('RESET_DB=true - dropping all tables');
            await conn.query('SET FOREIGN_KEY_CHECKS = 0');
            for (const t of TABLES_IN_DROP_ORDER) {
                await conn.query(`DROP TABLE IF EXISTS ${t}`);
            }
            await conn.query('SET FOREIGN_KEY_CHECKS = 1');
        }

        for (const stmt of ddlStatements) {
            await conn.query(stmt);
        }

        await seedRBAC(conn);

        if (process.env.SEED_DEMO === 'true') {
            const [[{ count }]] = await conn.query('SELECT COUNT(*) AS count FROM users');
            if (count === 0) {
                const values = [];
                for (const u of seedUsers) {
                    const password_hash = await bcrypt.hash(u.password, 12);
                    values.push([
                        u.email,
                        password_hash,
                        u.role_id,
                        0,
                        u.hourly_rate,
                        u.currency,
                        'Europe/Bucharest'
                    ]);
                }
                const [userRes] = await conn.query(
                    `INSERT INTO users (email, password_hash, role_id, token_version, hourly_rate, currency, timezone)
           VALUES ?`,
                    [values]
                );
                logger.info('users seeded');

                const firstUserId = userRes.insertId;
                const userIds = [firstUserId, firstUserId + 1, firstUserId + 2];

                await conn.query(
                    'INSERT INTO exchange_rates (day, base, quote, rate) VALUES ?',
                    [seedFx()]
                );

                for (let i = 0; i < userIds.length; i++) {
                    const userId = userIds[i];
                    const { currency } = seedUsers[i];

                    const incomes = seedIncomes(userId, currency, i);
                    if (incomes.length) {
                        await conn.query(
                            `INSERT INTO incomes
               (user_id, received_at, amount_cents, currency, source, recurring, notes)
               VALUES ?`,
                            [incomes]
                        );
                    }

                    await conn.query(
                        'INSERT INTO categories (user_id,name,kind) VALUES ?',
                        [seedCategories(userId)]
                    );

                    const [catRows] = await conn.query(
                        'SELECT id, name FROM categories WHERE user_id=?',
                        [userId]
                    );
                    const categoryIds = {};
                    for (const c of catRows) categoryIds[c.name] = c.id;

                    const pack = makePerUserSeeds(i, { userId, currency, categoryIds });

                    if (pack.expenses?.length) {
                        await conn.query(
                            `INSERT INTO expenses
               (user_id,category_id,name,amount_cents,currency,frequency,start_date,end_date,is_active,notes)
               VALUES ?`,
                            [pack.expenses]
                        );
                    }

                    if (pack.objects?.length) {
                        await conn.query(
                            `INSERT INTO objects
               (user_id,category_id,name,price_cents,currency,purchase_date,expected_life_months,maintenance_cents_per_month,hours_saved_per_month,notes)
               VALUES ?`,
                            [pack.objects]
                        );
                    }

                    if (pack.activities?.length) {
                        await conn.query(
                            `INSERT INTO activities
               (user_id,category_id,name,duration_minutes,frequency,direct_cost_cents,saved_minutes,currency,notes)
               VALUES ?`,
                            [pack.activities]
                        );
                    }

                    if (pack.budgets?.length) {
                        const [budRes] = await conn.query(
                            `INSERT INTO budgets (user_id,period_start,period_end,currency) VALUES ?`,
                            [pack.budgets]
                        );
                        const budgetId = budRes.insertId;
                        if (pack.budget_allocations) {
                            await conn.query(
                                `INSERT INTO budget_allocations (budget_id,category_id,amount_cents) VALUES ?`,
                                [pack.budget_allocations(budgetId)]
                            );
                        }
                    }

                    if (pack.goals?.length) {
                        const [goalRes] = await conn.query(
                            `INSERT INTO goals
               (user_id,name,target_amount_cents,target_hours,deadline_date,priority,status,currency)
               VALUES ?`,
                            [pack.goals]
                        );
                        const goalId = goalRes.insertId;
                        if (pack.goal_contribs) {
                            await conn.query(
                                `INSERT INTO goal_contributions
                 (goal_id,contributed_at,amount_cents,hours,source_type) VALUES ?`,
                                [pack.goal_contribs(goalId)]
                            );
                        }
                    }

                    if (pack.scenarios?.length) {
                        await conn.query(
                            `INSERT INTO scenarios (user_id,name,params_json) VALUES ?`,
                            [pack.scenarios]
                        );
                    }

                    if (pack.alerts?.length) {
                        const [alertRes] = await conn.query(
                            `INSERT INTO alerts (user_id,name,rule_type,rule_config,is_active)
               VALUES ?`,
                            [pack.alerts]
                        );
                        const alertId = alertRes.insertId;
                        if (pack.notifications) {
                            await conn.query(
                                `INSERT INTO notifications (alert_id,sent_at,channel,payload_json)
                 VALUES ?`,
                                [pack.notifications(alertId)]
                            );
                        }
                    }
                }

                logger.info('Demo data inserted for all remaining tables');
            }
        }

        await conn.commit();
        logger.info('DB schema verified');
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
}
