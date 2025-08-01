import { pool } from '../config/db.js'
import type { ResultSetHeader, RowDataPacket } from 'mysql2'

export interface ObjectRow extends RowDataPacket {
    id: number
    user_id: number
    category_id: number | null
    name: string
    price_cents: number
    currency: string
    purchase_date: string
    expected_life_months: number
    maintenance_cents_per_month: number
    hours_saved_per_month: number
    notes: string | null
    image_path: string | null
    created_at: string
}

interface CreateArgs
    extends Omit<
        ObjectRow,
        | 'id'
        | 'created_at'
        | 'maintenance_cents_per_month'
        | 'hours_saved_per_month'
        | 'notes'
        | 'image_path'
    > {
    maintenance_cents_per_month?: number
    hours_saved_per_month?: number
    notes?: string | null
    image_path?: string | null
}

type UpdateArgs = Partial<
    Pick<
        ObjectRow,
        | 'category_id'
        | 'name'
        | 'price_cents'
        | 'currency'
        | 'purchase_date'
        | 'expected_life_months'
        | 'maintenance_cents_per_month'
        | 'hours_saved_per_month'
        | 'notes'
        | 'image_path'
    >
>

export class ObjectModel {
    static async create({
                            user_id,
                            category_id = null,
                            name,
                            price_cents,
                            currency = 'RON',
                            purchase_date,
                            expected_life_months,
                            maintenance_cents_per_month = 0,
                            hours_saved_per_month = 0,
                            notes = null,
                            image_path = null,
                        }: CreateArgs): Promise<ObjectRow | null> {
        const [res] = await pool.execute<ResultSetHeader>(
            `INSERT INTO objects
             (user_id,category_id,name,price_cents,currency,purchase_date,expected_life_months,maintenance_cents_per_month,hours_saved_per_month,notes,image_path)
             VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
            [
                user_id,
                category_id,
                name,
                price_cents,
                currency,
                purchase_date,
                expected_life_months,
                maintenance_cents_per_month,
                hours_saved_per_month,
                notes,
                image_path,
            ],
        )
        return this.findById(res.insertId, user_id)
    }

    static async findById(
        id: number,
        user_id: number,
    ): Promise<ObjectRow | null> {
        const [rows] = await pool.execute<ObjectRow[]>(
            `SELECT * FROM objects WHERE id=? AND user_id=?`,
            [id, user_id],
        )
        return rows[0] ?? null
    }

    static async findAllByUser(user_id: number): Promise<ObjectRow[]> {
        const [rows] = await pool.execute<ObjectRow[]>(
            `SELECT * FROM objects WHERE user_id=? ORDER BY id DESC`,
            [user_id],
        )
        return rows
    }

    static async update(
        id: number,
        user_id: number,
        data: UpdateArgs,
    ): Promise<ObjectRow | null> {
        const allowed = [
            'category_id',
            'name',
            'price_cents',
            'currency',
            'purchase_date',
            'expected_life_months',
            'maintenance_cents_per_month',
            'hours_saved_per_month',
            'notes',
            'image_path',
        ] as const
        const fields: string[] = []
        const values: unknown[] = []
        for (const [k, v] of Object.entries(data) as [keyof UpdateArgs, unknown][]) {
            if (allowed.includes(k)) {
                fields.push(`${k}=?`)
                values.push(v)
            }
        }
        if (!fields.length) return this.findById(id, user_id)
        values.push(id, user_id)
        await pool.execute(
            `UPDATE objects SET ${fields.join(', ')} WHERE id=? AND user_id=?`,
            values,
        )
        return this.findById(id, user_id)
    }

    static async remove(id: number, user_id: number): Promise<void> {
        await pool.execute(`DELETE FROM objects WHERE id=? AND user_id=?`, [
            id,
            user_id,
        ])
    }
}
