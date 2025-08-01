import { pool } from '../config/db.js'
import type { ResultSetHeader, RowDataPacket } from 'mysql2'

export interface BudgetAllocationRow extends RowDataPacket {
    id: number
    budget_id: number
    category_id: number
    amount_cents: number
}

interface CreateArgs {
    budget_id: number
    category_id: number
    amount_cents: number
}

type UpdateArgs = Partial<
    Pick<BudgetAllocationRow, 'category_id' | 'amount_cents'>
>

export class BudgetAllocation {
    static async create(
        user_id: number,
        { budget_id, category_id, amount_cents }: CreateArgs,
    ): Promise<BudgetAllocationRow | null> {
        const [[b]] = await pool.execute<RowDataPacket[]>(
            `SELECT id FROM budgets WHERE id=? AND user_id=?`,
            [budget_id, user_id],
        )
        if (!b) return null
        const [res] = await pool.execute<ResultSetHeader>(
            `INSERT INTO budget_allocations (budget_id,category_id,amount_cents)
             VALUES (?,?,?)`,
            [budget_id, category_id, amount_cents],
        )
        return this.findById(res.insertId, budget_id, user_id)
    }

    static async findById(
        id: number,
        budget_id: number,
        user_id: number,
    ): Promise<BudgetAllocationRow | null> {
        const [rows] = await pool.execute<BudgetAllocationRow[]>(
            `SELECT ba.*
             FROM budget_allocations ba
                      JOIN budgets b ON b.id = ba.budget_id
             WHERE ba.id=? AND ba.budget_id=? AND b.user_id=?`,
            [id, budget_id, user_id],
        )
        return rows[0] ?? null
    }

    static async findAllByBudget(
        budget_id: number,
        user_id: number,
    ): Promise<BudgetAllocationRow[]> {
        const [rows] = await pool.execute<BudgetAllocationRow[]>(
            `SELECT ba.*
             FROM budget_allocations ba
                      JOIN budgets b ON b.id = ba.budget_id
             WHERE ba.budget_id=? AND b.user_id=?
             ORDER BY ba.id`,
            [budget_id, user_id],
        )
        return rows
    }

    static async update(
        id: number,
        budget_id: number,
        user_id: number,
        data: UpdateArgs,
    ): Promise<BudgetAllocationRow | null> {
        const allowed = ['category_id', 'amount_cents'] as const
        const fields: string[] = []
        const values: unknown[] = []
        for (const [k, v] of Object.entries(data) as [keyof UpdateArgs, unknown][]) {
            if (allowed.includes(k) && v !== undefined) {
                fields.push(`${k}=?`)
                values.push(v)
            }
        }
        if (!fields.length) return this.findById(id, budget_id, user_id)
        const exists = await this.findById(id, budget_id, user_id)
        if (!exists) return null
        values.push(id)
        await pool.execute(
            `UPDATE budget_allocations SET ${fields.join(', ')} WHERE id=?`,
            values,
        )
        return this.findById(id, budget_id, user_id)
    }

    static async remove(
        id: number,
        budget_id: number,
        user_id: number,
    ): Promise<boolean> {
        const existing = await this.findById(id, budget_id, user_id)
        if (!existing) return false
        await pool.execute(`DELETE FROM budget_allocations WHERE id=?`, [id])
        return true
    }
}
