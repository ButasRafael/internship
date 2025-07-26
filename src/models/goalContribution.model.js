import { pool } from '../config/db.js';

export class GoalContribution {
    static async create(user_id, {
        goal_id,
        contributed_at = null,
        amount_cents = null,
        hours = null,
        source_type = 'manual'
    }) {
        const [[goal]] = await pool.execute(
            `SELECT id FROM goals WHERE id=? AND user_id=?`,
            [goal_id, user_id]
        );
        if (!goal) return null;

        const [res] = await pool.execute(
            `INSERT INTO goal_contributions
       (goal_id, contributed_at, amount_cents, hours, source_type)
       VALUES (?, COALESCE(?, CURRENT_TIMESTAMP), ?, ?, ?)`,
            [goal_id, contributed_at, amount_cents, hours, source_type]
        );
        return this.findByIdForUser(res.insertId, user_id);
    }

    static async findByIdForUser(id, user_id) {
        const [rows] = await pool.execute(
            `SELECT gc.*
             FROM goal_contributions gc
                      JOIN goals g ON g.id = gc.goal_id
             WHERE gc.id = ? AND g.user_id = ?`,
            [id, user_id]
        );
        return rows[0] ?? null;
    }

    static async findAllByGoal(goal_id, user_id) {
        const [rows] = await pool.execute(
            `SELECT gc.*
             FROM goal_contributions gc
                      JOIN goals g ON g.id = gc.goal_id
             WHERE gc.goal_id = ? AND g.user_id = ?
             ORDER BY gc.contributed_at DESC`,
            [goal_id, user_id]
        );
        return rows;
    }

    static async update(id, goal_id, user_id, data) {
        const existing = await this.findByIdForUser(id, user_id);
        if (!existing || existing.goal_id !== Number(goal_id)) return null;

        const allowed = ['contributed_at', 'amount_cents', 'hours', 'source_type'];
        const fields = [];
        const values = [];
        for (const [k, v] of Object.entries(data)) {
            if (allowed.includes(k)) {
                if (k === 'contributed_at' && (v === null || v === undefined)) {
                    fields.push(`contributed_at = CURRENT_TIMESTAMP`);
                } else {
                    fields.push(`${k} = ?`);
                    values.push(v);
                }
            }
        }
        if (!fields.length) return this.findByIdForUser(id, user_id);

        values.push(id);
        await pool.execute(
            `UPDATE goal_contributions SET ${fields.join(', ')} WHERE id = ?`,
            values
        );
        return this.findByIdForUser(id, user_id);
    }

    static async remove(id, goal_id, user_id) {
        const existing = await this.findByIdForUser(id, user_id);
        if (!existing || existing.goal_id !== Number(goal_id)) return false;

        await pool.execute(`DELETE FROM goal_contributions WHERE id=?`, [id]);
        return true;
    }

    static async removeByGoal(goal_id, user_id) {
        const [[goal]] = await pool.execute(
            `SELECT id FROM goals WHERE id=? AND user_id=?`,
            [goal_id, user_id]
        );
        if (!goal) return 0;

        const [res] = await pool.execute(
            `DELETE gc FROM goal_contributions gc
        JOIN goals g ON g.id = gc.goal_id
       WHERE gc.goal_id = ? AND g.user_id = ?`,
            [goal_id, user_id]
        );
        return res.affectedRows;
    }
}
