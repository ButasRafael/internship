import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export function signAccessToken(user) {
    return jwt.sign(
        { sub: user.id, role: user.role, tv: user.token_version },
        env.jwt.accessSecret,
        { expiresIn: env.jwt.accessTtl }
    );
}

export function signRefreshToken(user) {
    return jwt.sign(
        { sub: user.id, tv: user.token_version },
        env.jwt.refreshSecret,
        { expiresIn: env.jwt.refreshTtl }
    );
}

export function verifyRefreshToken(token) {
    return jwt.verify(token, env.jwt.refreshSecret);
}
