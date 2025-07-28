import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { getUserPermissionActions } from '../models/permission.model.js';

export async function signAccessToken(user) {
    const perms = await getUserPermissionActions(user.id);
    return jwt.sign(
        {
            sub:   user.id,
            tv:    user.token_version,
            perms
        },
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
