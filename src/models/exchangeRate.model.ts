import { pool } from '../config/db.js';
import type { RowDataPacket } from 'mysql2';

export interface ExchangeRateData {
    day:   string;
    base:  string;
    quote: string;
    rate:  number;
}

export interface ExchangeRateRow extends RowDataPacket, ExchangeRateData {}

export class ExchangeRate {

    static async upsert(data: ExchangeRateData): Promise<ExchangeRateRow | null> {
        if (!Number.isFinite(data.rate) || data.rate <= 0) {
            throw new Error(`Invalid rate: ${data.rate}`);
        }
        const { day, base, quote, rate } = data;
        await pool.execute(
            `INSERT INTO exchange_rates (day,base,quote,rate)
             VALUES (?,?,?,?)
             ON DUPLICATE KEY UPDATE rate = VALUES(rate)`,
            [day, base, quote, rate]
        );
        return this.find(day, base, quote);
    }

    static async find(day: string, base: string, quote: string) {
        const [rows] = await pool.execute<ExchangeRateRow[]>(
            `SELECT * FROM exchange_rates WHERE day=? AND base=? AND quote=?`,
            [day, base, quote]
        );
        return rows[0] ?? null;
    }

    static async findAll(filters: Partial<Pick<ExchangeRateData, 'day' | 'base' | 'quote'>> = {}) {
        const { day, base, quote } = filters;
        const where: string[] = [];
        const params: unknown[] = [];
        if (day)  { where.push('day=?');   params.push(day); }
        if (base) { where.push('base=?');  params.push(base); }
        if (quote){ where.push('quote=?'); params.push(quote); }

        const sql = `SELECT * FROM exchange_rates${
                where.length ? ' WHERE ' + where.join(' AND ') : ''
        } ORDER BY day`;
        const [rows] = await pool.execute<ExchangeRateRow[]>(sql, params);
        return rows;
    }

    static async latest(base: string, quote: string) {
        const [rows] = await pool.execute<ExchangeRateRow[]>(
            `SELECT rate FROM exchange_rates
             WHERE base=? AND quote=?
             ORDER BY day DESC
             LIMIT 1`,
            [base, quote]
        );
        return rows[0]?.rate ?? null;
    }

    static async remove(day: string, base: string, quote: string) {
        await pool.execute(
            `DELETE FROM exchange_rates WHERE day=? AND base=? AND quote=?`,
            [day, base, quote]
        );
    }
}
