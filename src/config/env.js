import * as dotenv from 'dotenv';
import path from 'node:path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export const env = {
    nodeEnv: process.env.NODE_ENV ?? 'development',
    port: Number(process.env.PORT) || 3000,

    db: {
        host: process.env.DB_HOST ?? 'localhost',
        port: Number(process.env.DB_PORT) || 3306,
        name: process.env.DB_DATABASE ?? 'app',
        user: process.env.DB_USER ?? 'root',
        pass: process.env.DB_PASSWORD ?? 'root'
    },

    seedDemo: process.env.SEED_DEMO === 'true',
    resetDb: process.env.RESET_DB === 'true',

    jwt: {
        accessSecret: process.env.JWT_ACCESS_SECRET || 'dev-access-secret-change-me',
        refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-me',
        accessTtl: process.env.ACCESS_TOKEN_TTL || '15m',
        refreshTtl: process.env.REFRESH_TOKEN_TTL || '7d'
    },

    cookies: {
        secure: process.env.COOKIE_SECURE === 'true',
        domain: process.env.COOKIE_DOMAIN || undefined
    }
};

