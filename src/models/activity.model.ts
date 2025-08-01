import { pool } from '../config/db.js';
import { ResultSetHeader, RowDataPacket } from 'mysql2/promise';

export type Frequency = 'once' | 'weekly' | 'monthly' | 'yearly';

export interface ActivityCreateInput {
    user_id: number;
    category_id?: number | null;
    name: string;
    duration_minutes: number;
    frequency: Frequency;
    direct_cost_cents?: number;
    saved_minutes?: number;
    currency?: string;
    notes?: string | null;
}

export type ActivityUpdateInput = Partial<
    Omit<ActivityCreateInput, 'user_id'>
>;

export interface ActivityRow extends RowDataPacket {
    id: number;
    user_id: number;
    category_id: number | null;
    name: string;
    duration_minutes: number;
    frequency: Frequency;
    direct_cost_cents: number;
    saved_minutes: number;
    currency: string;
    notes: string | null;
    created_at: string; // MySQL DATETIME → string in JS
}

export class Activity {
    static async create(data: ActivityCreateInput): Promise<ActivityRow | null> {
        const {
            user_id,
            category_id = null,
            name,
            duration_minutes,
            frequency,
            direct_cost_cents = 0,
            saved_minutes = 0,
            currency = 'RON',
            notes = null,
        } = data;

        const [res] = await pool.execute<ResultSetHeader>(
            `INSERT INTO activities
       (user_id, category_id, name, duration_minutes, frequency,
        direct_cost_cents, saved_minutes, currency, notes)
       VALUES (?,?,?,?,?,?,?,?,?)`,
            [
                user_id,
                category_id,
                name,
                duration_minutes,
                frequency,
                direct_cost_cents,
                saved_minutes,
                currency,
                notes,
            ],
        );

        return this.findById(res.insertId, user_id);
    }

    static async findById(
        id: number,
        user_id: number,
    ): Promise<ActivityRow | null> {
        const [rows] = await pool.execute<ActivityRow[]>(
            'SELECT * FROM activities WHERE id=? AND user_id=?',
            [id, user_id],
        );
        return rows[0] ?? null;
    }

    static async findAllByUser(user_id: number): Promise<ActivityRow[]> {
        const [rows] = await pool.execute<ActivityRow[]>(
            'SELECT * FROM activities WHERE user_id=? ORDER BY id DESC',
            [user_id],
        );
        return rows;
    }

    static async update(
        id: number,
        user_id: number,
        data: ActivityUpdateInput,
    ): Promise<ActivityRow | null> {
        const allowed: (keyof ActivityUpdateInput)[] = [
            'category_id',
            'name',
            'duration_minutes',
            'frequency',
            'direct_cost_cents',
            'saved_minutes',
            'currency',
            'notes',
        ];

        const fields: string[] = [];
        const values: unknown[] = [];

        for (const [k, v] of Object.entries(data) as [
            keyof ActivityUpdateInput,
            unknown,
        ][]) {
            if (allowed.includes(k)) {
                fields.push(`${k} = ?`);
                values.push(v);
            }
        }

        if (!fields.length) return this.findById(id, user_id);

        values.push(id, user_id);
        await pool.execute(
            `UPDATE activities SET ${fields.join(', ')} WHERE id=? AND user_id=?`,
            values,
        );
        return this.findById(id, user_id);
    }

    static async remove(id: number, user_id: number): Promise<void> {
        await pool.execute('DELETE FROM activities WHERE id=? AND user_id=?', [
            id,
            user_id,
        ]);
    }
}
