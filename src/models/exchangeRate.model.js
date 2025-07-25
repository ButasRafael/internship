import { pool } from '../config/db.js';

export class ExchangeRate {
    static async upsert({ day, base, quote, rate }) {
        await pool.execute(
            `INSERT INTO exchange_rates (day, base, quote, rate)
             VALUES (?,?,?,?)
                 ON DUPLICATE KEY UPDATE rate = VALUES(rate)`,
            [day, base, quote, rate]
        );
        return this.find(day, base, quote);
    }

    static async find(day, base, quote) {
        const [rows] = await pool.execute(
            `SELECT * FROM exchange_rates WHERE day=? AND base=? AND quote=?`,
            [day, base, quote]
        );
        return rows[0] ?? null;
    }

    static async findAll(filters = {}) {
        const { day, base, quote } = filters;
        const where = [];
        const params = [];
        if (day)   { where.push('day = ?');   params.push(day); }
        if (base)  { where.push('base = ?');  params.push(base); }
        if (quote) { where.push('quote = ?'); params.push(quote); }

        const sql = `SELECT * FROM exchange_rates ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY day`;
        const [rows] = await pool.execute(sql, params);
        return rows;
    }

    static async findBetween(base, quote, from, to) {
        const [rows] = await pool.execute(
            `SELECT * FROM exchange_rates
       WHERE base=? AND quote=? AND day BETWEEN ? AND ?
       ORDER BY day`,
            [base, quote, from, to]
        );
        return rows;
    }

    static async remove(day, base, quote) {
        await pool.execute(
            `DELETE FROM exchange_rates WHERE day=? AND base=? AND quote=?`,
            [day, base, quote]
        );
    }
}
