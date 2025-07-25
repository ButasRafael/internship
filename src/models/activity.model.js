import { pool } from '../config/db.js';

export class Activity {
    static async create({
                            user_id, category_id = null, name,
                            duration_minutes, frequency,
                            direct_cost_cents = 0, saved_minutes = 0,
                            currency = 'RON', notes = null
                        }) {
        const [res] = await pool.execute(
            `INSERT INTO activities
       (user_id,category_id,name,duration_minutes,frequency,direct_cost_cents,saved_minutes,currency,notes)
       VALUES (?,?,?,?,?,?,?,?,?)`,
            [
                user_id, category_id, name, duration_minutes, frequency,
                direct_cost_cents, saved_minutes, currency, notes
            ]
        );
        return this.findById(res.insertId, user_id);
    }

    static async findById(id, user_id) {
        const [rows] = await pool.execute(
            `SELECT * FROM activities WHERE id=? AND user_id=?`,
            [id, user_id]
        );
        return rows[0] ?? null;
    }

    static async findAllByUser(user_id) {
        const [rows] = await pool.execute(
            `SELECT * FROM activities WHERE user_id=? ORDER BY id DESC`,
            [user_id]
        );
        return rows;
    }

    static async update(id, user_id, data) {
        const allowed = [
            'category_id', 'name', 'duration_minutes', 'frequency', 'direct_cost_cents',
            'saved_minutes', 'currency', 'notes'
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
            `UPDATE activities SET ${fields.join(', ')} WHERE id=? AND user_id=?`,
            values
        );
        return this.findById(id, user_id);
    }

    static async remove(id, user_id) {
        await pool.execute(`DELETE FROM activities WHERE id=? AND user_id=?`, [id, user_id]);
    }
}
