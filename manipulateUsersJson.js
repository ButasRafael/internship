
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const dataDir   = path.join(__dirname, '..', 'data');
const dumpFile  = path.join(dataDir, 'users_dump.json');

async function readUsers() {
    const json = await fs.readFile(dumpFile, 'utf8');
    return JSON.parse(json);
}

async function writeUsers(users, suffix = '') {
    const file = suffix ? dumpFile.replace('.json', `_${suffix}.json`) : dumpFile;
    await fs.writeFile(file, JSON.stringify(users, null, 2), 'utf8');
    console.log(`Saved ${users.length} users → ${path.basename(file)}`);
}

async function main() {
    const users = await readUsers();
    console.log(`Loaded ${users.length} users from dump`);

    const nextId = Math.max(...users.map(u => u.id)) + 1;
    const newUser = { id: nextId, email: `demo${nextId}@example.com`, hourly_rate: 42, currency: 'RON' };
    users.push(newUser);
    await writeUsers(users, 'added');

    const target = users.find(u => u.id === 1);
    if (target) target.hourly_rate = 999;
    await writeUsers(users, 'updated');

    const filtered = users.filter(u => u.id !== 2);
    await writeUsers(filtered, 'deleted');
}

main().catch(console.error);
