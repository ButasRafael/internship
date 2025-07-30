import { pool } from '../config/db.js';

export class ObjectModel {
    static async create({
                            user_id, category_id = null, name,
                            price_cents, currency = 'RON',
                            purchase_date, expected_life_months,
                            maintenance_cents_per_month = 0,
                            hours_saved_per_month = 0,
                            notes = null,
                            image_path = null
                        }) {
        const [res] = await pool.execute(
            `INSERT INTO objects
       (user_id,category_id,name,price_cents,currency,purchase_date,expected_life_months,maintenance_cents_per_month,hours_saved_per_month,notes, image_path)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
            [
                user_id, category_id, name, price_cents, currency,
                purchase_date, expected_life_months, maintenance_cents_per_month,
                hours_saved_per_month, notes, image_path
            ]
        );
        return this.findById(res.insertId, user_id);
    }

    static async findById(id, user_id) {
        const [rows] = await pool.execute(
            `SELECT * FROM objects WHERE id=? AND user_id=?`,
            [id, user_id]
        );
        return rows[0] ?? null;
    }

    static async findAllByUser(user_id) {
        const [rows] = await pool.execute(
            `SELECT * FROM objects WHERE user_id=? ORDER BY id DESC`,
            [user_id]
        );
        return rows;
    }

    static async update(id, user_id, data) {
        const allowed = [
            'category_id', 'name', 'price_cents', 'currency', 'purchase_date',
            'expected_life_months', 'maintenance_cents_per_month', 'hours_saved_per_month', 'notes', 'image_path'
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
            `UPDATE objects SET ${fields.join(', ')} WHERE id=? AND user_id=?`,
            values
        );
        return this.findById(id, user_id);
    }

    static async remove(id, user_id) {
        await pool.execute(`DELETE FROM objects WHERE id=? AND user_id=?`, [id, user_id]);
    }
}
