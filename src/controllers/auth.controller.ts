import { Request, Response, NextFunction } from 'express'
import bcrypt from 'bcryptjs'
import { User } from '../models/user.model.js'
import {
    signAccessToken,
    signRefreshToken,
    verifyRefreshToken
} from '../utils/jwt.js'
import { env } from '../config/env.js'
import { EmailVerificationToken } from '../models/emailVerificationToken.model.js';
import { sendMail } from '../utils/mailer.js';
type AuthRequest = Request & {
    user?: { sub: number; tv: number }
}

function setRefreshCookie(res: Response, token: string): void {
    res.cookie('refresh_token', token, {
        httpOnly: true,
        secure: env.cookies.secure,
        sameSite: 'strict',
        domain: env.cookies.domain || undefined,
        path: '/auth',
        maxAge: 1_000 * 60 * 60 * 24 * 7
    })
}

export const register = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const {
            email,
            password,
            hourly_rate = 0,
            currency = 'RON',
            timezone = 'Europe/Bucharest'
        } = req.body as Record<string, unknown>

        if (!email || !password) {
            res.status(400).json({ error: 'email & password required' })
            return
        }

        if (await User.findByEmail(String(email))) {
            res.status(409).json({ error: 'Email already exists' })
            return
        }

        const password_hash = await bcrypt.hash(String(password), 12)

        const user = await User.create({
            email: String(email),
            role_id: 2,
            hourly_rate: Number(hourly_rate),
            currency: String(currency),
            timezone: String(timezone),
            password_hash
        })

        const mini = { id: user!.id, token_version: user!.token_version }
        const accessToken = await signAccessToken(mini)
        const refreshToken = signRefreshToken(mini)
        setRefreshCookie(res, refreshToken)
         try {
                const tok = await EmailVerificationToken.issue(user!.id);
                const url = `${env.frontendUrl}/verify-email?token=${tok}`;
                await sendMail({
                    to: user!.email,
                    subject: 'Verify your Time-is-Money account',
                    html: `<p>Welcome!</p>
             <p>Please <a href="${url}">verify your e-mail</a>. 
               Link valid 24&nbsp;h.</p>`
                });
              } catch (mailErr) {
                console.error('[auth] could not send verify email', mailErr);
        }
        res.status(201).json({
            access_token: accessToken,
            token_type: 'bearer',
            expires_in: env.jwt.accessTtl,
            user: { id: user!.id, email: user!.email, role_id: user!.role_id }
        })
    } catch (err) {
        next(err)
    }
}

export const login = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { email, password } = req.body as Record<string, unknown>
        if (!email || !password) {
            res.status(400).json({ error: 'email & password required' })
            return
        }

        const user = await User.findByEmail(String(email))

        if (!user || !user.password_hash) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        if (!user.email_verified) {
            return res.status(403).json({ error: 'Email not verified' });
        }

        if (!(await bcrypt.compare(String(password), user.password_hash))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const mini = { id: user.id, token_version: user.token_version }
        const accessToken = await signAccessToken(mini)
        const refreshToken = signRefreshToken(mini)
        setRefreshCookie(res, refreshToken)

        res.json({
            access_token: accessToken,
            token_type: 'bearer',
            expires_in: env.jwt.accessTtl,
            user: { id: user.id, email: user.email, role_id: user.role_id }
        })
    } catch (err) {
        next(err)
    }
}

export const me = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthenticated' })
            return
        }

        const user = await User.findById(req.user.sub)
        if (!user) {
            res.status(404).json({ error: 'User not found' })
            return
        }

        const { id, email, role_id, hourly_rate, currency, timezone, created_at, email_verified } =
            user
        res.json({ id, email, role_id, hourly_rate, currency, timezone, created_at, email_verified })
    } catch (err) {
        next(err)
    }
}

export const refresh = async (req: Request, res: Response) => {
    try {
        const token = req.cookies.refresh_token
        if (!token) {
            res.status(401).json({ error: 'Missing refresh token' })
            return
        }

        const payload = verifyRefreshToken(token)
        const user = await User.findById(payload.sub)
        if (!user) {
            res.status(401).json({ error: 'Invalid refresh token' })
            return
        }

        if (payload.tv !== user.token_version) {
            res.status(401).json({ error: 'Token revoked' })
            return
        }

        const mini = { id: user.id, token_version: user.token_version }
        const accessToken = await signAccessToken(mini)
        const refreshToken = signRefreshToken(mini)
        setRefreshCookie(res, refreshToken)

        res.json({
            access_token: accessToken,
            token_type: 'bearer',
            expires_in: env.jwt.accessTtl
        })
    } catch {
        res.status(401).json({ error: 'Invalid / expired refresh token' })
    }
}

export const logout = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        let userId: number | undefined
        const token = req.cookies.refresh_token

        if (token) {
            try {
                const payload = verifyRefreshToken(token)
                userId = payload.sub
            } catch {}
        }

        if (!userId && req.user) userId = req.user.sub
        if (userId) await User.incrementTokenVersion(userId)

        res.clearCookie('refresh_token', {
            httpOnly: true,
            secure: env.cookies.secure,
            sameSite: 'strict',
            domain: env.cookies.domain || undefined,
            path: '/auth'
        })

        res.status(204).send()
    } catch (err) {
        next(err)
    }
}
