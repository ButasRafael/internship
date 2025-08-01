import { pool } from '../config/db.js'
import type { ResultSetHeader, RowDataPacket } from 'mysql2'

export interface UserRow extends RowDataPacket {
    id: number
    email: string
    password_hash: string | null
    role_id: number
    token_version: number
    hourly_rate: number
    currency: string
    timezone: string
    email_verified: 0 | 1;
    created_at: string
}

interface CreateArgs
    extends Omit<
        UserRow,
        'id' | 'token_version' | 'created_at' | 'password_hash' | 'role_id' | 'hourly_rate'
    > {
    role_id?: number
    hourly_rate?: number
    password_hash?: string | null
}

type UpdateArgs = Partial<
    Pick<UserRow, 'email' | 'role_id' | 'hourly_rate' | 'currency' | 'timezone' | 'password_hash' | 'email_verified'>
>

export class User {
    static async create({
                            email,
                            role_id = 2,
                            hourly_rate = 0,
                            currency = 'RON',
                            timezone = 'Europe/Bucharest',
                            password_hash = null,
                        }: CreateArgs): Promise<UserRow | null> {
        const [res] = await pool.execute<ResultSetHeader>(
            `INSERT INTO users (email,password_hash,role_id,token_version,hourly_rate,currency,timezone)
             VALUES (?,?,?,?,?,?,?)`,
            [email, password_hash, role_id, 0, hourly_rate, currency, timezone],
        )
        return this.findById(res.insertId)
    }

    static async findById(id: number): Promise<UserRow | null> {
        const [rows] = await pool.execute<UserRow[]>(`SELECT * FROM users WHERE id=?`, [id])
        return rows[0] ?? null
    }

    static async findByEmail(email: string): Promise<UserRow | null> {
        const [rows] = await pool.execute<UserRow[]>(`SELECT * FROM users WHERE email=?`, [email])
        return rows[0] ?? null
    }

    static async findAll(): Promise<UserRow[]> {
        const [rows] = await pool.execute<UserRow[]>(`SELECT * FROM users ORDER BY id`)
        return rows
    }

    static async update(id: number, data: UpdateArgs): Promise<UserRow | null> {
        const allowed = ['email', 'role_id', 'hourly_rate', 'currency', 'timezone', 'password_hash', 'email_verified'] as const
        const fields: string[] = []
        const values: unknown[] = []
        for (const [k, v] of Object.entries(data) as [keyof UpdateArgs, unknown][]) {
            if (allowed.includes(k)) {
                fields.push(`${k}=?`)
                values.push(v)
            }
        }
        if (!fields.length) return this.findById(id)
        values.push(id)
        await pool.execute(`UPDATE users SET ${fields.join(', ')} WHERE id=?`, values)
        return this.findById(id)
    }

    static async incrementTokenVersion(id: number): Promise<UserRow | null> {
        await pool.execute(`UPDATE users SET token_version = token_version + 1 WHERE id=?`, [id])
        return this.findById(id)
    }

    static async remove(id: number): Promise<void> {
        await pool.execute(`DELETE FROM users WHERE id=?`, [id])
    }
}
