import { pool } from '../config/db.js';
import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise';

export interface UserHourlyRateRow extends RowDataPacket {
    id: number;
    user_id: number;
    effective_month: string; // DATE in DB; use 'YYYY-MM-01'
    hourly_rate: number;
    created_at?: string;
    updated_at?: string;
}

export class UserHourlyRate {
    static async upsert(
        user_id: number,
        month: string, // 'YYYY-MM'
        hourly_rate: number,
    ): Promise<UserHourlyRateRow | null> {
        const [res] = await pool.execute<ResultSetHeader>(
            `INSERT INTO user_hourly_rates (user_id, effective_month, hourly_rate)
             VALUES (?, DATE(CONCAT(?, '-01')), ?)
             ON DUPLICATE KEY UPDATE hourly_rate = VALUES(hourly_rate), updated_at = CURRENT_TIMESTAMP`,
            [user_id, month, hourly_rate],
        );
        // retrieve the row (insertId may be 0 for update; fetch by PK on (user_id, month))
        const [rows] = await pool.execute<UserHourlyRateRow[]>(
            `SELECT * FROM user_hourly_rates
             WHERE user_id=? AND effective_month = DATE(CONCAT(?, '-01'))`,
            [user_id, month],
        );
        return rows[0] ?? null;
    }

    static async listByUser(user_id: number): Promise<UserHourlyRateRow[]> {
        const [rows] = await pool.execute<UserHourlyRateRow[]>(
            `SELECT * FROM user_hourly_rates
             WHERE user_id=?
             ORDER BY effective_month ASC`,
            [user_id],
        );
        return rows;
    }

    static async listUpToMonth(user_id: number, toMonth: string): Promise<UserHourlyRateRow[]> {
        const [rows] = await pool.execute<UserHourlyRateRow[]>(
            `SELECT * FROM user_hourly_rates
             WHERE user_id=? AND effective_month <= DATE(CONCAT(?, '-01'))
             ORDER BY effective_month ASC`,
            [user_id, toMonth],
        );
        return rows;
    }
}

