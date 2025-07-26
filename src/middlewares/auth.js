import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/user.model.js';
import { getUserPermissionActions } from '../models/permission.model.js';

function extractToken(req) {
    const header = req.headers.authorization || '';
    if (header.startsWith('Bearer ')) return header.slice(7);
    return null;
}

export async function verifyAccessToken(req, _res, next) {
    const token = extractToken(req);
    if (!token) return next();

    try {
        const payload = jwt.verify(token, env.jwt.accessSecret);
        const user = await User.findById(payload.sub);
        if (!user || user.token_version !== payload.tv) return next();

        const perms = await getUserPermissionActions(user.id);

        req.user = {
            sub: user.id,
            tv: user.token_version,
            role_id: user.role_id,
            perms
        };
    } catch (e) {}
    next();
}

export function requireAuth(req, res, next) {
    if (!req.user) return res.status(401).json({ error: 'Unauthenticated' });
    next();
}
