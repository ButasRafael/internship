import { pool } from '../config/db.js';
import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import {randomToken, sha256} from "../utils/random.js";

export interface PwdResetRow extends RowDataPacket {
    id: number;
    user_id: number;
    token_hash: string;
    expires_at: string;
    used_at: string | null;
    created_at: string;
}

export class PasswordResetToken {
    static async issue(user_id: number, ttlHours = 2) {
        const token = randomToken();
        const token_hash = sha256(token);
        const expires = new Date(Date.now() + ttlHours * 60 * 60 * 1_000);

        await pool.execute<ResultSetHeader>(
            `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
       VALUES (?,?,?)`,
            [user_id, token_hash, expires.toISOString().slice(0, 19).replace('T', ' ')]
        );
        return token;
    }

    static async consume(token: string): Promise<number | null> {
        const token_hash = sha256(token);
        const [rows] = await pool.execute<PwdResetRow[]>(
            `SELECT * FROM password_reset_tokens
         WHERE token_hash=? AND used_at IS NULL AND expires_at > NOW()
         LIMIT 1`,
            [token_hash]
        );
        const row = rows[0];
        if (!row) return null;

        await pool.execute(
            `UPDATE password_reset_tokens SET used_at=NOW() WHERE id=?`,
            [row.id]
        );
        return row.user_id;
    }
}
