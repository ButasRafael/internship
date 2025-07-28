import { pool } from '../src/config/db.js';

const TABLES_IN_DROP_ORDER = [
    'role_permissions','permissions','roles',
    'notifications','alerts',
    'goal_contributions','goals',
    'budget_allocations','budgets',
    'activities','objects','expenses',
    'categories','scenarios','exchange_rates',
    'incomes','users',
    'schema_migrations',
];

async function resetDb() {
    const conn = await pool.getConnection();
    try {
        await conn.query('SET FOREIGN_KEY_CHECKS = 0');
        for (const t of TABLES_IN_DROP_ORDER) {
            console.log(`→ dropping ${t}`);
            await conn.query(`DROP TABLE IF EXISTS \`${t}\``);
        }
        await conn.query('SET FOREIGN_KEY_CHECKS = 1');
        console.log('database cleared');
    } finally {
        conn.release();
    }
}

resetDb().catch(err => {
    console.error('reset failed', err);
    process.exit(1);
});
