import { Request, Response, NextFunction } from 'express'
import jwt, { JwtPayload } from 'jsonwebtoken'
import { env } from '../config/env.js'
import { User } from '../models/user.model.js'

type TokenPayload = JwtPayload & {
    sub: number
    tv: number
    perms?: string[]
}

declare module 'express-serve-static-core' {
    interface Request {
        user?: { sub: number; tv: number; role_id: number; perms?: string[] }
    }
}

const extractToken = (req: Request): string | null => {
    const h = req.headers.authorization || ''
    return h.startsWith('Bearer ') ? h.slice(7) : null
}

export const verifyAccessToken = async (
    req: Request,
    _res: Response,
    next: NextFunction
) => {
    const token = extractToken(req)
    if (!token) {
        next()
        return
    }

    try {
        const decoded = jwt.verify(token, env.jwt.accessSecret)
        if (typeof decoded !== 'string') {
            const payload = decoded as TokenPayload
            const user = await User.findById(payload.sub)
            if (user && user.token_version === payload.tv) {
                req.user = {
                    sub: payload.sub,
                    tv: payload.tv,
                    role_id: user.role_id,
                    perms: payload.perms ?? []
                }
            }
        }
    } catch {}

    next()
}

export const requireAuth = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (!req.user) {
        res.status(401).json({ error: 'Unauthenticated' })
        return
    }
    next()
}
