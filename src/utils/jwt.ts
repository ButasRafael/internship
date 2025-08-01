import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import { getUserPermissionActions } from '../models/permission.model.js'

type AccessPayload  = { sub: number; tv: number; perms: string[] }
type RefreshPayload = { sub: number; tv: number }

const so = (ttl: string | number): jwt.SignOptions => ({ expiresIn: ttl as any })

export async function signAccessToken(user: { id: number; token_version: number }): Promise<string> {
    const perms = await getUserPermissionActions(user.id)
    const payload: AccessPayload = { sub: user.id, tv: user.token_version, perms }
    return jwt.sign(payload, env.jwt.accessSecret, so(env.jwt.accessTtl))
}

export function signRefreshToken(user: { id: number; token_version: number }): string {
    const payload: RefreshPayload = { sub: user.id, tv: user.token_version }
    return jwt.sign(payload, env.jwt.refreshSecret, so(env.jwt.refreshTtl))
}

export function verifyRefreshToken(token: string): RefreshPayload {
    return jwt.verify(token, env.jwt.refreshSecret) as unknown as RefreshPayload
}
