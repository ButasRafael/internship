
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { pool } from './src/config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

async function exportUsersToJson() {
    try {
        const [rows] = await pool.query('SELECT * FROM users');

        const outDir  = path.join(__dirname, '..', 'data');
        const outFile = path.join(outDir, 'users_dump.json');
        await fs.mkdir(outDir, { recursive: true });

        const jsonString = JSON.stringify(rows, null, 2);
        await fs.writeFile(outFile, jsonString, 'utf8');
        console.log(`${rows.length} users exported to ${outFile}`);
    } catch (err) {
        console.error('Failed to export users:', err);
    } finally {
        await pool.end();
    }
}

exportUsersToJson();
