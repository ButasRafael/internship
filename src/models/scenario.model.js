import { pool } from '../config/db.js';

export class Scenario {
    static async create({ user_id, name, params_json }) {
        const [res] = await pool.execute(
            `INSERT INTO scenarios (user_id, name, params_json)
       VALUES (?,?,?)`,
            [user_id, name, JSON.stringify(params_json)]
        );
        return this.findById(res.insertId, user_id);
    }


    static async findById(id, user_id) {
        const [rows] = await pool.execute(
            `SELECT * FROM scenarios WHERE id=? AND user_id=?`,
            [id, user_id]
        );
        return rows[0] ?? null;
    }

    static async findAllByUser(user_id) {
        const [rows] = await pool.execute(
            `SELECT * FROM scenarios WHERE user_id=? ORDER BY created_at DESC`,
            [user_id]
        );
        return rows;
    }

    static async update(id, user_id, data) {
        const allowed = ['name', 'params_json'];
        const fields = [];
        const values = [];
        for (const [k, v] of Object.entries(data)) {
            if (allowed.includes(k)) {
                fields.push(`${k}=?`);
                values.push(k === 'params_json' ? JSON.stringify(v) : v);
            }
        }
        if (!fields.length) return this.findById(id, user_id);

        values.push(id, user_id);
        await pool.execute(
            `UPDATE scenarios SET ${fields.join(', ')} WHERE id=? AND user_id=?`,
            values
        );
        return this.findById(id, user_id);
    }


    static async remove(id, user_id) {
        await pool.execute(`DELETE FROM scenarios WHERE id=? AND user_id=?`, [id, user_id]);
    }
}
