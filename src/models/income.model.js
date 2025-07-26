import { pool } from '../config/db.js';

export class Income {
    static async create({
                            user_id,
                            received_at,
                            amount_cents,
                            currency = 'RON',
                            source = 'other',
                            recurring = 'none',
                            notes = null
                        }) {
        const [res] = await pool.execute(
            `INSERT INTO incomes
       (user_id, received_at, amount_cents, currency, source, recurring, notes)
       VALUES (?,?,?,?,?,?,?)`,
            [user_id, received_at, amount_cents, currency, source, recurring, notes]
        );
        return this.findById(res.insertId, user_id);
    }

    static async findById(id, user_id) {
        const [rows] = await pool.execute(
            `SELECT * FROM incomes WHERE id=? AND user_id=?`,
            [id, user_id]
        );
        return rows[0] ?? null;
    }

    static async findAllByUser(user_id) {
        const [rows] = await pool.execute(
            `SELECT * FROM incomes WHERE user_id=? ORDER BY received_at DESC, id DESC`,
            [user_id]
        );
        return rows;
    }

    static async update(id, user_id, data) {
        const allowed = ['received_at', 'amount_cents', 'currency', 'source', 'recurring', 'notes'];
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
            `UPDATE incomes SET ${fields.join(', ')} WHERE id=? AND user_id=?`,
            values
        );
        return this.findById(id, user_id);
    }

    static async remove(id, user_id) {
        await pool.execute(`DELETE FROM incomes WHERE id=? AND user_id=?`, [id, user_id]);
    }
}
