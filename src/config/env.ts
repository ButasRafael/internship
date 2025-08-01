import * as dotenv from 'dotenv';
import path from 'node:path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export interface EnvVars {
    nodeEnv: 'development' | 'production' | 'test' | undefined;
    port: number;
    db: {
        host: string;
        port: number;
        name: string;
        user: string;
        pass: string;
    };
    jwt: {
        accessSecret: string;
        refreshSecret: string;
        accessTtl: string;
        refreshTtl: string;
    };
    cookies: {
        secure: boolean;
        domain?: string;
    };

    smtp: {
        host:   string;
        port:   number;
        secure: boolean;
        user?:  string;
        pass?:  string;
        from:   string;
    };

    frontendUrl: string;


}

export const env: EnvVars = {
    nodeEnv: (process.env.NODE_ENV as EnvVars['nodeEnv']) ?? 'development',
    port: Number(process.env.PORT) || 3000,

    db: {
        host: process.env.DB_HOST ?? 'localhost',
        port: Number(process.env.DB_PORT) || 3306,
        name: process.env.DB_DATABASE ?? 'app',
        user: process.env.DB_USER ?? 'root',
        pass: process.env.DB_PASSWORD ?? 'root',
    },

    jwt: {
        accessSecret: process.env.JWT_ACCESS_SECRET || 'dev-access-secret-change-me',
        refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-me',
        accessTtl: process.env.ACCESS_TOKEN_TTL || '15m',
        refreshTtl: process.env.REFRESH_TOKEN_TTL || '7d',
    },

    cookies: {
        secure: process.env.COOKIE_SECURE === 'true',
        domain: process.env.COOKIE_DOMAIN || undefined,
    },

    smtp: {
        host:   process.env.SMTP_HOST  ?? 'localhost',
        port:   Number(process.env.SMTP_PORT) || 25,
        secure: process.env.SMTP_SECURE === 'true',
        user:   process.env.SMTP_USER   || undefined,
        pass:   process.env.SMTP_PASS   || undefined,
        from:   process.env.SMTP_FROM   ?? 'Time-is-Money <no-reply@example.com>',
    },
    frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:5173',

};
