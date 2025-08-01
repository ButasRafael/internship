// scripts/exportUsers.ts
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { pool } from './src/config/db.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname  = path.dirname(__filename)

async function exportUsersToJson (): Promise<void> {
    try {
        // 👇 annotate the generic so rows is an `any[]` (or your own Row type)
        const [rows] = await pool.query<any[]>('SELECT * FROM users')

        const outDir  = path.join(__dirname, '..', 'data')
        const outFile = path.join(outDir, 'users_dump.json')
        await fs.mkdir(outDir, { recursive: true })
        await fs.writeFile(outFile, JSON.stringify(rows, null, 2), 'utf8')

        console.log(`${rows.length} users exported to ${outFile}`)
    } catch (err) {
        console.error('Failed to export users:', err)
    } finally {
        await pool.end()
    }
}

void exportUsersToJson()
