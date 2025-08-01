import { pool } from '../config/db.js'
import type { ResultSetHeader, RowDataPacket } from 'mysql2'

export interface ScenarioRow extends RowDataPacket {
    id: number
    user_id: number
    name: string
    params_json: unknown
    created_at: string
}

interface CreateArgs {
    user_id: number
    name: string
    params_json: unknown
}

type UpdateArgs = Partial<Pick<ScenarioRow, 'name' | 'params_json'>>

export class Scenario {
    static async create({ user_id, name, params_json }: CreateArgs): Promise<ScenarioRow | null> {
        const [res] = await pool.execute<ResultSetHeader>(
            `INSERT INTO scenarios (user_id,name,params_json) VALUES (?,?,?)`,
            [user_id, name, JSON.stringify(params_json)],
        )
        return this.findById(res.insertId, user_id)
    }

    static async findById(id: number, user_id: number): Promise<ScenarioRow | null> {
        const [rows] = await pool.execute<ScenarioRow[]>(
            `SELECT * FROM scenarios WHERE id=? AND user_id=?`,
            [id, user_id],
        )
        return rows[0] ?? null
    }

    static async findAllByUser(user_id: number): Promise<ScenarioRow[]> {
        const [rows] = await pool.execute<ScenarioRow[]>(
            `SELECT * FROM scenarios WHERE user_id=? ORDER BY created_at DESC`,
            [user_id],
        )
        return rows
    }

    static async update(
        id: number,
        user_id: number,
        data: UpdateArgs,
    ): Promise<ScenarioRow | null> {
        const allowed = ['name', 'params_json'] as const
        const fields: string[] = []
        const values: unknown[] = []
        for (const [k, v] of Object.entries(data) as [keyof UpdateArgs, unknown][]) {
            if (allowed.includes(k)) {
                fields.push(`${k}=?`)
                values.push(k === 'params_json' ? JSON.stringify(v) : v)
            }
        }
        if (!fields.length) return this.findById(id, user_id)
        values.push(id, user_id)
        await pool.execute(`UPDATE scenarios SET ${fields.join(', ')} WHERE id=? AND user_id=?`, values)
        return this.findById(id, user_id)
    }

    static async remove(id: number, user_id: number): Promise<void> {
        await pool.execute(`DELETE FROM scenarios WHERE id=? AND user_id=?`, [id, user_id])
    }
}
