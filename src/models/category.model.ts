import { pool } from '../config/db.js'
import type { ResultSetHeader, RowDataPacket } from 'mysql2'

export interface CategoryRow extends RowDataPacket {
    id: number
    user_id: number
    name: string
    kind: 'expense' | 'object' | 'activity' | 'mixed'
}

interface CreateArgs {
    user_id: number
    name: string
    kind?: CategoryRow['kind']
}

type UpdateArgs = Partial<Pick<CategoryRow, 'name' | 'kind'>>

export class Category {
    static async create({
                            user_id,
                            name,
                            kind = 'expense',
                        }: CreateArgs): Promise<CategoryRow | null> {
        const [res] = await pool.execute<ResultSetHeader>(
            `INSERT INTO categories (user_id,name,kind) VALUES (?,?,?)`,
            [user_id, name, kind],
        )
        return this.findById(res.insertId, user_id)
    }

    static async findById(
        id: number,
        user_id: number,
    ): Promise<CategoryRow | null> {
        const [rows] = await pool.execute<CategoryRow[]>(
            `SELECT * FROM categories WHERE id=? AND user_id=?`,
            [id, user_id],
        )
        return rows[0] ?? null
    }

    static async findAllByUser(user_id: number): Promise<CategoryRow[]> {
        const [rows] = await pool.execute<CategoryRow[]>(
            `SELECT * FROM categories WHERE user_id=? ORDER BY id`,
            [user_id],
        )
        return rows
    }

    static async update(
        id: number,
        user_id: number,
        data: UpdateArgs,
    ): Promise<CategoryRow | null> {
        const allowed = ['name', 'kind'] as const
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
            `UPDATE categories SET ${fields.join(', ')} WHERE id=? AND user_id=?`,
            values,
        )
        return this.findById(id, user_id)
    }

    static async remove(id: number, user_id: number): Promise<void> {
        await pool.execute(`DELETE FROM categories WHERE id=? AND user_id=?`, [
            id,
            user_id,
        ])
    }
}
