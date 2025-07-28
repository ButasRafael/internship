import mysql from 'mysql2/promise';
import { env } from './env.js';

export const pool = mysql.createPool({
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.pass,
    database: env.db.name,
    connectionLimit: 10,
    waitForConnections: true,
    queueLimit: 0,
    multipleStatements : true,
});
