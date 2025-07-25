import { pool } from '../config/db.js';

export class Category {
    static async create({ user_id, name, kind = 'expense' }) {
        const [res] = await pool.execute(
            `INSERT INTO categories (user_id, name, kind) VALUES (?,?,?)`,
            [user_id, name, kind]
        );
        return this.findById(res.insertId, user_id);
    }

    static async findById(id, user_id) {
        const [rows] = await pool.execute(
            `SELECT * FROM categories WHERE id=? AND user_id=?`,
            [id, user_id]
        );
        return rows[0] ?? null;
    }

    static async findAllByUser(user_id) {
        const [rows] = await pool.execute(
            `SELECT * FROM categories WHERE user_id=? ORDER BY id`,
            [user_id]
        );
        return rows;
    }

    static async update(id, user_id, data) {
        const allowed = ['name', 'kind'];
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
            `UPDATE categories SET ${fields.join(', ')} WHERE id=? AND user_id=?`,
            values
        );
        return this.findById(id, user_id);
    }

    static async remove(id, user_id) {
        await pool.execute(`DELETE FROM categories WHERE id=? AND user_id=?`, [id, user_id]);
    }
}
