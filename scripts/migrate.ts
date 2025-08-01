import fs from 'node:fs'
import path from 'node:path'
import { pool } from '../src/config/db.js'

const ensureMigrationsTable = async (c: Awaited<ReturnType<typeof pool.getConnection>>): Promise<void> => {
    await c.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations(
      id INT AUTO_INCREMENT PRIMARY KEY,
      filename VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)
}

const getApplied = async (c: Awaited<ReturnType<typeof pool.getConnection>>): Promise<Set<string>> => {
    const [rows] = await c.query<any[]>(`SELECT filename FROM schema_migrations`)
    return new Set(rows.map(r => r.filename as string))
}

const record = async (c: Awaited<ReturnType<typeof pool.getConnection>>, fn: string): Promise<void> => {
    await c.query(`INSERT INTO schema_migrations(filename) VALUES(?)`, [fn])
}

async function runMigrations(): Promise<void> {
    const conn = await pool.getConnection()
    try {
        await conn.beginTransaction()
        await ensureMigrationsTable(conn)

        const applied = await getApplied(conn)
        const dir = path.resolve('migrations')
        const files = fs
            .readdirSync(dir)
            .filter(f => f.endsWith('.sql'))
            .sort()

        for (const file of files) {
            if (applied.has(file)) continue
            const sql = fs.readFileSync(path.join(dir, file), 'utf8')
            console.log(`→ applying ${file}`)
            await conn.query(sql)
            await record(conn, file)
        }

        await conn.commit()
    } catch (err) {
        await conn.rollback()
        throw err
    } finally {
        conn.release()
    }
}

runMigrations()
    .then(() => pool.end())
    .then(() => {
        console.log('migrations complete')
        process.exit(0)
    })
    .catch(err => {
        console.error('migration failed:', err)
        process.exit(1)
    })
