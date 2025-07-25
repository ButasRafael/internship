import { pool } from '../config/db.js';

export class Expense {
    static async create({
                            user_id, category_id = null, name,
                            amount_cents, currency = 'RON',
                            frequency, start_date, end_date = null,
                            is_active = 1, notes = null
                        }) {
        const [res] = await pool.execute(
            `INSERT INTO expenses
             (user_id,category_id,name,amount_cents,currency,frequency,start_date,end_date,is_active,notes)
             VALUES (?,?,?,?,?,?,?,?,?,?)`,
            [user_id, category_id, name, amount_cents, currency, frequency, start_date, end_date, is_active, notes]
        );
        return this.findById(res.insertId, user_id);
    }

    static async findById(id, user_id) {
        const [rows] = await pool.execute(
            `SELECT * FROM expenses WHERE id=? AND user_id=?`,
            [id, user_id]
        );
        return rows[0] ?? null;
    }

    static async findAllByUser(user_id, { activeOnly = false } = {}) {
        const sql = activeOnly
            ? `SELECT * FROM expenses WHERE user_id=? AND is_active=1 ORDER BY id DESC`
            : `SELECT * FROM expenses WHERE user_id=? ORDER BY id DESC`;
        const [rows] = await pool.execute(sql, [user_id]);
        return rows;
    }

    static async update(id, user_id, data) {
        const allowed = [
            'category_id', 'name', 'amount_cents', 'currency',
            'frequency', 'start_date', 'end_date', 'is_active', 'notes'
        ];
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
            `UPDATE expenses SET ${fields.join(', ')} WHERE id=? AND user_id=?`,
            values
        );
        return this.findById(id, user_id);
    }

    static async remove(id, user_id) {
        await pool.execute(`DELETE FROM expenses WHERE id=? AND user_id=?`, [id, user_id]);
    }
}
