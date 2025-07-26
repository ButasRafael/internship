import { pool } from '../config/db.js';

export class User {
    static async create({
                            email,
                            role_id = 2,
                            hourly_rate = 0,
                            currency = 'RON',
                            timezone = 'Europe/Bucharest',
                            password_hash = null
                        }) {
        const [res] = await pool.execute(
            `INSERT INTO users (email, password_hash, role_id, token_version, hourly_rate, currency, timezone)
             VALUES (?,?,?,?,?,?,?)`,
            [email, password_hash, role_id, 0, hourly_rate, currency, timezone]
        );
        return this.findById(res.insertId);
    }

    static async findById(id) {
        const [rows] = await pool.execute(`SELECT * FROM users WHERE id=?`, [id]);
        return rows[0] ?? null;
    }

    static async findByEmail(email) {
        const [rows] = await pool.execute(`SELECT * FROM users WHERE email=?`, [email]);
        return rows[0] ?? null;
    }

    static async findAll() {
        const [rows] = await pool.execute(`SELECT * FROM users ORDER BY id`);
        return rows;
    }

    static async update(id, data) {
        const allowed = ['email', 'role_id', 'hourly_rate', 'currency', 'timezone', 'password_hash'];
        const fields = [];
        const values = [];
        for (const [k, v] of Object.entries(data)) {
            if (allowed.includes(k)) {
                fields.push(`${k}=?`);
                values.push(v);
            }
        }
        if (!fields.length) return this.findById(id);
        values.push(id);
        await pool.execute(`UPDATE users SET ${fields.join(', ')} WHERE id=?`, values);
        return this.findById(id);
    }

    static async incrementTokenVersion(id) {
        await pool.execute(`UPDATE users SET token_version = token_version + 1 WHERE id=?`, [id]);
        return this.findById(id);
    }

    static async remove(id) {
        await pool.execute(`DELETE FROM users WHERE id=?`, [id]);
    }
}
