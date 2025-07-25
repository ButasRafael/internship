import { pool } from '../config/db.js';

export class Budget {
    static async create({ user_id, period_start, period_end, currency = 'RON' }) {
        const [res] = await pool.execute(
            `INSERT INTO budgets (user_id, period_start, period_end, currency)
             VALUES (?,?,?,?)`,
            [user_id, period_start, period_end, currency]
        );
        return this.findById(res.insertId, user_id);
    }

    static async findById(id, user_id) {
        const [rows] = await pool.execute(
            `SELECT * FROM budgets WHERE id=? AND user_id=?`,
            [id, user_id]
        );
        return rows[0] ?? null;
    }

    static async findAllByUser(user_id) {
        const [rows] = await pool.execute(
            `SELECT * FROM budgets WHERE user_id=? ORDER BY period_start DESC`,
            [user_id]
        );
        return rows;
    }

    static async update(id, user_id, data) {
        const allowed = ['period_start', 'period_end', 'currency'];
        const fields = [];
        const values = [];
        for (const [k, v] of Object.entries(data)) {
            if (allowed.includes(k)) {
                fields.push(`${k}=?`);
                values.push(v);
            }
        }
        if (!fields.length) return this.findById(id, user_id);

        values.push(id, user_id);
        await pool.execute(
            `UPDATE budgets SET ${fields.join(', ')} WHERE id=? AND user_id=?`,
            values
        );
        return this.findById(id, user_id);
    }

    static async remove(id, user_id) {

        await pool.execute(`DELETE FROM budgets WHERE id=? AND user_id=?`, [id, user_id]);
    }
}
