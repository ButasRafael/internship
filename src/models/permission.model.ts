import { pool } from '../config/db.js'
import type { RowDataPacket } from 'mysql2'

type PermRow = RowDataPacket & { action: string }

export async function getUserPermissionActions(userId: number): Promise<string[]> {
    const [rows] = await pool.query<PermRow[]>(
        `SELECT p.action
         FROM users u
                  JOIN role_permissions rp ON rp.role_id = u.role_id
                  JOIN permissions     p  ON p.id = rp.permission_id
         WHERE u.id = ?`,
        [userId],
    )
    return rows.map(r => r.action)
}
