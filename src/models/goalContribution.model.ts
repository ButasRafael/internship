import { pool } from '../config/db.js'
import type { ResultSetHeader, RowDataPacket } from 'mysql2'

export interface GoalContributionRow extends RowDataPacket {
    id: number
    goal_id: number
    contributed_at: string
    amount_cents: number | null
    hours: number | null
    source_type: 'income' | 'expense_cut' | 'activity_saving' | 'manual'
}

interface CreateArgs {
    goal_id: number
    contributed_at?: string | null
    amount_cents?: number | null
    hours?: number | null
    source_type?: GoalContributionRow['source_type']
}

type UpdateArgs = Partial<
    Pick<
        GoalContributionRow,
        'contributed_at' | 'amount_cents' | 'hours' | 'source_type'
    >
>

export class GoalContribution {
    static async create(
        user_id: number,
        {
            goal_id,
            contributed_at = null,
            amount_cents = null,
            hours = null,
            source_type = 'manual',
        }: CreateArgs,
    ): Promise<GoalContributionRow | null> {
        const [[goal]] = await pool.execute<RowDataPacket[]>(
            `SELECT id FROM goals WHERE id=? AND user_id=?`,
            [goal_id, user_id],
        )
        if (!goal) return null
        const [res] = await pool.execute<ResultSetHeader>(
            `INSERT INTO goal_contributions
                 (goal_id, contributed_at, amount_cents, hours, source_type)
             VALUES (?, COALESCE(?, CURRENT_TIMESTAMP), ?, ?, ?)`,
            [goal_id, contributed_at, amount_cents, hours, source_type],
        )
        return this.findByIdForUser(res.insertId, user_id)
    }

    static async findByIdForUser(
        id: number,
        user_id: number,
    ): Promise<GoalContributionRow | null> {
        const [rows] = await pool.execute<GoalContributionRow[]>(
            `SELECT gc.*
             FROM goal_contributions gc
                      JOIN goals g ON g.id = gc.goal_id
             WHERE gc.id = ? AND g.user_id = ?`,
            [id, user_id],
        )
        return rows[0] ?? null
    }

    static async findAllByGoal(
        goal_id: number,
        user_id: number,
    ): Promise<GoalContributionRow[]> {
        const [rows] = await pool.execute<GoalContributionRow[]>(
            `SELECT gc.*
             FROM goal_contributions gc
                      JOIN goals g ON g.id = gc.goal_id
             WHERE gc.goal_id = ? AND g.user_id = ?
             ORDER BY gc.contributed_at DESC`,
            [goal_id, user_id],
        )
        return rows
    }

    static async update(
        id: number,
        goal_id: number,
        user_id: number,
        data: UpdateArgs,
    ): Promise<GoalContributionRow | null> {
        const existing = await this.findByIdForUser(id, user_id)
        if (!existing || existing.goal_id !== Number(goal_id)) return null
        const allowed = ['contributed_at', 'amount_cents', 'hours', 'source_type'] as const
        const fields: string[] = []
        const values: unknown[] = []
        for (const [k, v] of Object.entries(data) as [keyof UpdateArgs, unknown][]) {
            if (allowed.includes(k)) {
                if (k === 'contributed_at' && (v === null || v === undefined)) {
                    fields.push(`contributed_at = CURRENT_TIMESTAMP`)
                } else {
                    fields.push(`${k} = ?`)
                    values.push(v)
                }
            }
        }
        if (!fields.length) return this.findByIdForUser(id, user_id)
        values.push(id)
        await pool.execute(
            `UPDATE goal_contributions SET ${fields.join(', ')} WHERE id = ?`,
            values,
        )
        return this.findByIdForUser(id, user_id)
    }

    static async remove(
        id: number,
        goal_id: number,
        user_id: number,
    ): Promise<boolean> {
        const existing = await this.findByIdForUser(id, user_id)
        if (!existing || existing.goal_id !== Number(goal_id)) return false
        await pool.execute(`DELETE FROM goal_contributions WHERE id=?`, [id])
        return true
    }

    static async removeByGoal(
        goal_id: number,
        user_id: number,
    ): Promise<number> {
        const [[goal]] = await pool.execute<RowDataPacket[]>(
            `SELECT id FROM goals WHERE id=? AND user_id=?`,
            [goal_id, user_id],
        )
        if (!goal) return 0
        const [res] = await pool.execute<ResultSetHeader>(
            `DELETE gc FROM goal_contributions gc
                                JOIN goals g ON g.id = gc.goal_id
             WHERE gc.goal_id = ? AND g.user_id = ?`,
            [goal_id, user_id],
        )
        return res.affectedRows
    }
}
