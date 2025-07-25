import { pool } from '../config/db.js';

export class BudgetAllocation {
    static async create(user_id, { budget_id, category_id, amount_cents }) {
        const [[b]] = await pool.execute(
            `SELECT id FROM budgets WHERE id=? AND user_id=?`,
            [budget_id, user_id]
        );
        if (!b) return null;

        const [res] = await pool.execute(
            `INSERT INTO budget_allocations (budget_id, category_id, amount_cents)
             VALUES (?,?,?)`,
            [budget_id, category_id, amount_cents]
        );
        return this.findById(res.insertId, budget_id, user_id);
    }

    static async findById(id, budget_id, user_id) {
        const [rows] = await pool.execute(
            `SELECT ba.*
             FROM budget_allocations ba
                      JOIN budgets b ON b.id = ba.budget_id
             WHERE ba.id = ? AND ba.budget_id = ? AND b.user_id = ?`,
            [id, budget_id, user_id]
        );
        return rows[0] ?? null;
    }

    static async findAllByBudget(budget_id, user_id) {
        const [rows] = await pool.execute(
            `SELECT ba.*
             FROM budget_allocations ba
                      JOIN budgets b ON b.id = ba.budget_id
             WHERE ba.budget_id = ? AND b.user_id = ?
             ORDER BY ba.id`,
            [budget_id, user_id]
        );
        return rows;
    }

    static async update(id, budget_id, user_id, data) {
        const allowed = ['category_id', 'amount_cents'];
        const fields = [];
        const values = [];
        for (const [k, v] of Object.entries(data)) {
            if (allowed.includes(k)) {
                fields.push(`${k}=?`);
                values.push(v);
            }
        }
        if (!fields.length) {
            return this.findById(id, budget_id, user_id);
        }

        const existing = await this.findById(id, budget_id, user_id);
        if (!existing) return null;

        values.push(id);
        await pool.execute(
            `UPDATE budget_allocations SET ${fields.join(', ')} WHERE id=?`,
            values
        );
        return this.findById(id, budget_id, user_id);
    }

    static async remove(id, budget_id, user_id) {
        const existing = await this.findById(id, budget_id, user_id);
        if (!existing) return false;

        await pool.execute(`DELETE FROM budget_allocations WHERE id=?`, [id]);
        return true;
    }
}
