import { pool } from '../config/db.js'
import type { ResultSetHeader, RowDataPacket } from 'mysql2'

export interface ExpenseRow extends RowDataPacket {
    id: number
    user_id: number
    category_id: number | null
    name: string
    amount_cents: number
    currency: string
    frequency: 'once' | 'weekly' | 'monthly' | 'yearly'
    start_date: string
    end_date: string | null
    is_active: 0 | 1
    notes: string | null
}

interface CreateArgs
    extends Omit<
        ExpenseRow,
        'id' | 'is_active' | 'end_date' | 'notes' | 'category_id'
    > {
    category_id?: number | null
    end_date?: string | null
    is_active?: 0 | 1
    notes?: string | null
}

type UpdateArgs = Partial<
    Pick<
        ExpenseRow,
        | 'category_id'
        | 'name'
        | 'amount_cents'
        | 'currency'
        | 'frequency'
        | 'start_date'
        | 'end_date'
        | 'is_active'
        | 'notes'
    >
>

export class Expense {
    static async create(args: CreateArgs): Promise<ExpenseRow | null> {
        const {
            user_id,
            category_id = null,
            name,
            amount_cents,
            currency = 'RON',
            frequency,
            start_date,
            end_date = null,
            is_active = 1,
            notes = null,
        } = args
        const [res] = await pool.execute<ResultSetHeader>(
            `INSERT INTO expenses
       (user_id,category_id,name,amount_cents,currency,frequency,start_date,end_date,is_active,notes)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
            [
                user_id,
                category_id,
                name,
                amount_cents,
                currency,
                frequency,
                start_date,
                end_date,
                is_active,
                notes,
            ],
        )
        return this.findById(res.insertId, user_id)
    }

    static async findById(
        id: number,
        user_id: number,
    ): Promise<ExpenseRow | null> {
        const [rows] = await pool.execute<ExpenseRow[]>(
            `SELECT * FROM expenses WHERE id=? AND user_id=?`,
            [id, user_id],
        )
        return rows[0] ?? null
    }

    static async findAllByUser(
        user_id: number,
        opts: { activeOnly?: boolean } = {},
    ): Promise<ExpenseRow[]> {
        const sql = opts.activeOnly
            ? `SELECT * FROM expenses WHERE user_id=? AND is_active=1 ORDER BY id DESC`
            : `SELECT * FROM expenses WHERE user_id=? ORDER BY id DESC`
        const [rows] = await pool.execute<ExpenseRow[]>(sql, [user_id])
        return rows
    }

    static async update(
        id: number,
        user_id: number,
        data: UpdateArgs,
    ): Promise<ExpenseRow | null> {
        const allowed = [
            'category_id',
            'name',
            'amount_cents',
            'currency',
            'frequency',
            'start_date',
            'end_date',
            'is_active',
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
            `UPDATE expenses SET ${fields.join(', ')} WHERE id=? AND user_id=?`,
            values,
        )
        return this.findById(id, user_id)
    }

    static async remove(id: number, user_id: number): Promise<void> {
        await pool.execute(`DELETE FROM expenses WHERE id=? AND user_id=?`, [
            id,
            user_id,
        ])
    }
}
