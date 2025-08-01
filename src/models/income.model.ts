import { pool } from '../config/db.js'
import type { ResultSetHeader, RowDataPacket } from 'mysql2'

export interface IncomeRow extends RowDataPacket {
    id: number
    user_id: number
    received_at: string
    amount_cents: number
    currency: string
    source: 'salary' | 'freelance' | 'bonus' | 'dividend' | 'interest' | 'gift' | 'other'
    recurring: 'none' | 'weekly' | 'monthly' | 'yearly'
    notes: string | null
}

interface CreateArgs
    extends Omit<IncomeRow, 'id' | 'notes'> {
    notes?: string | null
}

type UpdateArgs = Partial<
    Pick<
        IncomeRow,
        'received_at' | 'amount_cents' | 'currency' | 'source' | 'recurring' | 'notes'
    >
>

export class Income {
    static async create(args: CreateArgs): Promise<IncomeRow | null> {
        const {
            user_id,
            received_at,
            amount_cents,
            currency = 'RON',
            source = 'other',
            recurring = 'none',
            notes = null,
        } = args
        const [res] = await pool.execute<ResultSetHeader>(
            `INSERT INTO incomes
       (user_id, received_at, amount_cents, currency, source, recurring, notes)
       VALUES (?,?,?,?,?,?,?)`,
            [user_id, received_at, amount_cents, currency, source, recurring, notes],
        )
        return this.findById(res.insertId, user_id)
    }

    static async findById(
        id: number,
        user_id: number,
    ): Promise<IncomeRow | null> {
        const [rows] = await pool.execute<IncomeRow[]>(
            `SELECT * FROM incomes WHERE id=? AND user_id=?`,
            [id, user_id],
        )
        return rows[0] ?? null
    }

    static async findAllByUser(user_id: number): Promise<IncomeRow[]> {
        const [rows] = await pool.execute<IncomeRow[]>(
            `SELECT * FROM incomes WHERE user_id=? ORDER BY received_at DESC, id DESC`,
            [user_id],
        )
        return rows
    }

    static async update(
        id: number,
        user_id: number,
        data: UpdateArgs,
    ): Promise<IncomeRow | null> {
        const allowed = [
            'received_at',
            'amount_cents',
            'currency',
            'source',
            'recurring',
            'notes',
        ] as const
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
            `UPDATE incomes SET ${fields.join(', ')} WHERE id=? AND user_id=?`,
            values,
        )
        return this.findById(id, user_id)
    }

    static async remove(id: number, user_id: number): Promise<void> {
        await pool.execute(`DELETE FROM incomes WHERE id=? AND user_id=?`, [
            id,
            user_id,
        ])
    }
}
