import { pool } from '../config/db.js';

export class Goal {
    static async create({
                            user_id,
                            name,
                            target_amount_cents = null,
                            target_hours = null,
                            deadline_date = null,
                            priority = 3,
                            status = 'active',
                            currency = 'RON'
                        }) {
        const [res] = await pool.execute(
            `INSERT INTO goals
       (user_id,name,target_amount_cents,target_hours,deadline_date,priority,status,currency)
       VALUES (?,?,?,?,?,?,?,?)`,
            [
                user_id, name, target_amount_cents, target_hours, deadline_date,
                priority, status, currency
            ]
        );
        return this.findById(res.insertId, user_id);
    }

    static async findById(id, user_id) {
        const [rows] = await pool.execute(
            `SELECT * FROM goals WHERE id=? AND user_id=?`,
            [id, user_id]
        );
        return rows[0] ?? null;
    }

    static async findAllByUser(user_id) {
        const [rows] = await pool.execute(
            `SELECT * FROM goals WHERE user_id=? ORDER BY created_at DESC`,
            [user_id]
        );
        return rows;
    }

    static async update(id, user_id, data) {
        const allowed = [
            'name', 'target_amount_cents', 'target_hours', 'deadline_date',
            'priority', 'status', 'currency'
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
            `UPDATE goals SET ${fields.join(', ')} WHERE id=? AND user_id=?`,
            values
        );
        return this.findById(id, user_id);
    }

    static async remove(id, user_id) {
        await pool.execute(`DELETE FROM goals WHERE id=? AND user_id=?`, [id, user_id]);
    }
}
