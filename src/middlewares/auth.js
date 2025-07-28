import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/user.model.js';

function extractToken(req) {
    const h = req.headers.authorization || '';
    return h.startsWith('Bearer ') ? h.slice(7) : null;
}

export async function verifyAccessToken(req, _res, next) {
    const token = extractToken(req);
    if (!token) return next();

    try {
        const payload = jwt.verify(token, env.jwt.accessSecret);
        const user = await User.findById(payload.sub);
        if (!user || user.token_version !== payload.tv) {
            return next();
        }
        
        req.user = {
            sub:     payload.sub,
            tv:      payload.tv,
            role_id: user.role_id,
            perms:   payload.perms
        };
    } catch (_) {
    }

    next();
}

export function requireAuth(req, res, next) {
    if (!req.user) {
        return res.status(401).json({ error: 'Unauthenticated' });
    }
    next();
}
