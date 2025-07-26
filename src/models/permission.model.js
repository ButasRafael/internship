import { pool } from '../config/db.js';

export async function getUserPermissionActions(userId) {
    const [rows] = await pool.query(`
    SELECT p.action
    FROM users u
    JOIN role_permissions rp ON rp.role_id = u.role_id
    JOIN permissions p ON p.id = rp.permission_id
    WHERE u.id = ?
  `, [userId]);
    return rows.map(r => r.action);
}
