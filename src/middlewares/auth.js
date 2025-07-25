import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

function extractToken(req) {
    const header = req.headers.authorization || '';
    if (header.startsWith('Bearer ')) return header.slice(7);
    return null;
}

export function verifyAccessToken(req, _res, next) {
    const token = extractToken(req);
    if (!token) return next();

    try {
        const payload = jwt.verify(token, env.jwt.accessSecret);
        req.user = payload;
    } catch (e) {
    }
    next();
}

export function requireAuth(req, res, next) {
    if (!req.user) return res.status(401).json({ error: 'Unauthenticated' });
    next();
}

export function requireRole(...allowed) {
    return (req, res, next) => {
        if (!req.user) return res.status(401).json({ error: 'Unauthenticated' });
        if (!allowed.includes(req.user.role)) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        next();
    };
}

export function requireSelfOrAdmin(paramName = 'userId') {
    return (req, res, next) => {
        if (!req.user) return res.status(401).json({ error: 'Unauthenticated' });

        const pathUserId = Number(req.params[paramName]);
        const authUserId = Number(req.user.sub);

        if (req.user.role === 'admin' || authUserId === pathUserId) {
            return next();
        }
        return res.status(403).json({ error: 'Forbidden' });
    };
}

