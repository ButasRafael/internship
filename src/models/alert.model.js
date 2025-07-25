import { pool } from '../config/db.js';

export class Alert {
    static async create({ user_id, name, rule_type, rule_config, is_active = 1 }) {
        const [res] = await pool.execute(
            `INSERT INTO alerts (user_id, name, rule_type, rule_config, is_active)
       VALUES (?,?,?,?,?)`,
            [user_id, name, rule_type, JSON.stringify(rule_config), is_active]
        );
        return this.findById(res.insertId, user_id);
    }

    static async findById(id, user_id) {
        const [rows] = await pool.execute(
            `SELECT * FROM alerts WHERE id=? AND user_id=?`,
            [id, user_id]
        );
        return rows[0] ?? null;
    }

    static async findAllByUser(user_id) {
        const [rows] = await pool.execute(
            `SELECT * FROM alerts WHERE user_id=? ORDER BY created_at DESC`,
            [user_id]
        );
        return rows;
    }

    static async update(id, user_id, data) {
        const allowed = ['name', 'rule_type', 'rule_config', 'is_active'];
        const fields = [];
        const values = [];
        for (const [k, v] of Object.entries(data)) {
            if (allowed.includes(k)) {
                fields.push(`${k}=?`);
                values.push(k === 'rule_config' ? JSON.stringify(v) : v);
            }
        }
        if (!fields.length) return this.findById(id, user_id);

        values.push(id, user_id);
        await pool.execute(
            `UPDATE alerts SET ${fields.join(', ')} WHERE id=? AND user_id=?`,
            values
        );
        return this.findById(id, user_id);
    }

    static async toggle(id, user_id, is_active) {
        await pool.execute(
            `UPDATE alerts SET is_active=? WHERE id=? AND user_id=?`,
            [is_active ? 1 : 0, id, user_id]
        );
        return this.findById(id, user_id);
    }

    static async remove(id, user_id) {
        await pool.execute(`DELETE FROM alerts WHERE id=? AND user_id=?`, [id, user_id]);
    }
}
