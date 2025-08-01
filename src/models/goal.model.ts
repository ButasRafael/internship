import { pool } from '../config/db.js'
import type { ResultSetHeader, RowDataPacket } from 'mysql2'

export interface GoalRow extends RowDataPacket {
    id: number
    user_id: number
    name: string
    target_amount_cents: number | null
    target_hours: number | null
    deadline_date: string | null
    priority: 1 | 2 | 3 | 4 | 5
    status: 'active' | 'paused' | 'done' | 'cancelled'
    currency: string
    created_at: string
}

interface CreateArgs
    extends Omit<
        GoalRow,
        'id' | 'created_at' | 'target_amount_cents' | 'target_hours' | 'deadline_date'
    > {
    target_amount_cents?: number | null
    target_hours?: number | null
    deadline_date?: string | null
}

type UpdateArgs = Partial<
    Pick<
        GoalRow,
        | 'name'
        | 'target_amount_cents'
        | 'target_hours'
        | 'deadline_date'
        | 'priority'
        | 'status'
        | 'currency'
    >
>

export class Goal {
    static async create(args: CreateArgs): Promise<GoalRow | null> {
        const {
            user_id,
            name,
            target_amount_cents = null,
            target_hours = null,
            deadline_date = null,
            priority = 3,
            status = 'active',
            currency = 'RON',
        } = args
        const [res] = await pool.execute<ResultSetHeader>(
            `INSERT INTO goals
       (user_id,name,target_amount_cents,target_hours,deadline_date,priority,status,currency)
       VALUES (?,?,?,?,?,?,?,?)`,
            [
                user_id,
                name,
                target_amount_cents,
                target_hours,
                deadline_date,
                priority,
                status,
                currency,
            ],
        )
        return this.findById(res.insertId, user_id)
    }

    static async findById(
        id: number,
        user_id: number,
    ): Promise<GoalRow | null> {
        const [rows] = await pool.execute<GoalRow[]>(
            `SELECT * FROM goals WHERE id=? AND user_id=?`,
            [id, user_id],
        )
        return rows[0] ?? null
    }

    static async findAllByUser(user_id: number): Promise<GoalRow[]> {
        const [rows] = await pool.execute<GoalRow[]>(
            `SELECT * FROM goals WHERE user_id=? ORDER BY created_at DESC`,
            [user_id],
        )
        return rows
    }

    static async update(
        id: number,
        user_id: number,
        data: UpdateArgs,
    ): Promise<GoalRow | null> {
        const allowed = [
            'name',
            'target_amount_cents',
            'target_hours',
            'deadline_date',
            'priority',
            'status',
            'currency',
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
            `UPDATE goals SET ${fields.join(', ')} WHERE id=? AND user_id=?`,
            values,
        )
        return this.findById(id, user_id)
    }

    static async remove(id: number, user_id: number): Promise<void> {
        await pool.execute(`DELETE FROM goals WHERE id=? AND user_id=?`, [
            id,
            user_id,
        ])
    }
}
