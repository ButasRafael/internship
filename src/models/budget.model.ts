import { pool } from '../config/db.js'
import type { ResultSetHeader, RowDataPacket } from 'mysql2'

export interface BudgetRow extends RowDataPacket {
    id: number
    user_id: number
    period_start: string
    period_end: string
    currency: string
    created_at: string
}

interface CreateArgs {
    user_id: number
    period_start: string
    period_end: string
    currency?: string
}

type UpdateArgs = Partial<
    Pick<BudgetRow, 'period_start' | 'period_end' | 'currency'>
>

export class Budget {
    static async create({
                            user_id,
                            period_start,
                            period_end,
                            currency = 'RON',
                        }: CreateArgs): Promise<BudgetRow | null> {
        const [res] = await pool.execute<ResultSetHeader>(
            `INSERT INTO budgets (user_id,period_start,period_end,currency)
             VALUES (?,?,?,?)`,
            [user_id, period_start, period_end, currency],
        )
        return this.findById(res.insertId, user_id)
    }

    static async findById(
        id: number,
        user_id: number,
    ): Promise<BudgetRow | null> {
        const [rows] = await pool.execute<BudgetRow[]>(
            `SELECT * FROM budgets WHERE id=? AND user_id=?`,
            [id, user_id],
        )
        return rows[0] ?? null
    }

    static async findAllByUser(user_id: number): Promise<BudgetRow[]> {
        const [rows] = await pool.execute<BudgetRow[]>(
            `SELECT * FROM budgets WHERE user_id=? ORDER BY period_start DESC`,
            [user_id],
        )
        return rows
    }

    static async update(
        id: number,
        user_id: number,
        data: UpdateArgs,
    ): Promise<BudgetRow | null> {
        const allowed = ['period_start', 'period_end', 'currency'] as const
        const fields: string[] = []
        const values: unknown[] = []
        for (const [k, v] of Object.entries(data) as [keyof UpdateArgs, unknown][]) {
            if (allowed.includes(k) && v !== undefined) {
                fields.push(`${k}=?`)
                values.push(v)
            }
        }
        if (!fields.length) return this.findById(id, user_id)
        values.push(id, user_id)
        await pool.execute(
            `UPDATE budgets SET ${fields.join(', ')} WHERE id=? AND user_id=?`,
            values,
        )
        return this.findById(id, user_id)
    }

    static async remove(id: number, user_id: number): Promise<void> {
        await pool.execute(`DELETE FROM budgets WHERE id=? AND user_id=?`, [
            id,
            user_id,
        ])
    }
}
