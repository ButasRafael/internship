import { pool } from '../config/db.js';
import { ResultSetHeader, RowDataPacket } from 'mysql2/promise';

export type AlertRule =
    | 'percent_expenses_of_income'
    | 'object_breakeven_reached'
    | 'budget_overrun';

export interface AlertCreateInput {
    user_id: number;
    name: string;
    rule_type: AlertRule;
    rule_config: Record<string, unknown>;
    is_active?: boolean | number;
}

export type AlertUpdateInput = Partial<
    Omit<AlertCreateInput, 'user_id' | 'rule_config'>
> & { rule_config?: Record<string, unknown> };

export interface AlertRow extends RowDataPacket {
    id: number;
    user_id: number;
    name: string;
    rule_type: AlertRule;
    rule_config: unknown;
    is_active: 0 | 1;
    created_at: string;
}

export class Alert {
    static async create(input: AlertCreateInput): Promise<AlertRow | null> {
        const {
            user_id,
            name,
            rule_type,
            rule_config,
            is_active = 1,
        } = input;

        const [res] = await pool.execute<ResultSetHeader>(
            `INSERT INTO alerts (user_id, name, rule_type, rule_config, is_active)
       VALUES (?,?,?,?,?)`,
            [user_id, name, rule_type, JSON.stringify(rule_config), is_active ? 1 : 0],
        );

        return this.findById(res.insertId, user_id);
    }

    static async findById(
        id: number,
        user_id: number,
    ): Promise<AlertRow | null> {
        const [rows] = await pool.execute<AlertRow[]>(
            'SELECT * FROM alerts WHERE id=? AND user_id=?',
            [id, user_id],
        );
        return rows[0] ?? null;
    }

    static async findAllByUser(user_id: number): Promise<AlertRow[]> {
        const [rows] = await pool.execute<AlertRow[]>(
            'SELECT * FROM alerts WHERE user_id=? ORDER BY created_at DESC',
            [user_id],
        );
        return rows;
    }

    static async update(
        id: number,
        user_id: number,
        data: AlertUpdateInput,
    ): Promise<AlertRow | null> {
        const allowed: (keyof AlertUpdateInput)[] = [
            'name',
            'rule_type',
            'rule_config',
            'is_active',
        ];

        const fields: string[] = [];
        const values: unknown[] = [];

        for (const [k, v] of Object.entries(data) as [
            keyof AlertUpdateInput,
            unknown,
        ][]) {
            if (!allowed.includes(k)) continue;

            if (k === 'rule_config') {
                fields.push('rule_config = ?');
                values.push(JSON.stringify(v));
            } else {
                fields.push(`${k} = ?`);
                values.push(v);
            }
        }

        if (!fields.length) return this.findById(id, user_id);

        values.push(id, user_id);
        await pool.execute(
            `UPDATE alerts SET ${fields.join(', ')} WHERE id=? AND user_id=?`,
            values,
        );
        return this.findById(id, user_id);
    }

    static async toggle(
        id: number,
        user_id: number,
        is_active: boolean,
    ): Promise<AlertRow | null> {
        await pool.execute(
            'UPDATE alerts SET is_active=? WHERE id=? AND user_id=?',
            [is_active ? 1 : 0, id, user_id],
        );
        return this.findById(id, user_id);
    }

    static async remove(id: number, user_id: number): Promise<void> {
        await pool.execute('DELETE FROM alerts WHERE id=? AND user_id=?', [
            id,
            user_id,
        ]);
    }
}
