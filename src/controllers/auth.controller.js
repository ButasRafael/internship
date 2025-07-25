import bcrypt from 'bcryptjs';
import { User } from '../models/user.model.js';
import {
    signAccessToken,
    signRefreshToken,
    verifyRefreshToken
} from '../utils/jwt.js';
import { env } from '../config/env.js';

function setRefreshCookie(res, token) {
    res.cookie('refresh_token', token, {
        httpOnly: true,
        secure: env.cookies.secure,
        sameSite: 'strict',
        domain: env.cookies.domain || undefined,
        path: '/auth',
        maxAge: 1000 * 60 * 60 * 24 * 7
    });
}

export const register = async (req, res, next) => {
    try {
        const { email, password, hourly_rate = 0, currency = 'RON', timezone = 'Europe/Bucharest' } = req.body;
        if (!email || !password) return res.status(400).json({ error: 'email & password required' });

        const existing = await User.findByEmail(email);
        if (existing) return res.status(409).json({ error: 'Email already exists' });

        const password_hash = await bcrypt.hash(password, 12);

        const user = await User.create({
            email,
            role: 'user',
            hourly_rate,
            currency,
            timezone,
            password_hash
        });

        const accessToken = signAccessToken(user);
        const refreshToken = signRefreshToken(user);

        setRefreshCookie(res, refreshToken);

        res.status(201).json({
            access_token: accessToken,
            token_type: 'bearer',
            expires_in: env.jwt.accessTtl,
            user: { id: user.id, email: user.email, role: user.role }
        });
    } catch (err) {
        next(err);
    }
};

export const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ error: 'email & password required' });

        const user = await User.findByEmail(email);
        if (!user || !user.password_hash) return res.status(401).json({ error: 'Invalid credentials' });

        const ok = await bcrypt.compare(password, user.password_hash);
        if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

        const accessToken = signAccessToken(user);
        const refreshToken = signRefreshToken(user);

        setRefreshCookie(res, refreshToken);

        res.json({
            access_token: accessToken,
            token_type: 'bearer',
            expires_in: env.jwt.accessTtl,
            user: { id: user.id, email: user.email, role: user.role }
        });
    } catch (err) {
        next(err);
    }
};

export const me = async (req, res, next) => {
    try {
        if (!req.user) return res.status(401).json({ error: 'Unauthenticated' });

        const user = await User.findById(req.user.sub);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const { id, email, role, hourly_rate, currency, timezone, created_at } = user;
        res.json({ id, email, role, hourly_rate, currency, timezone, created_at });
    } catch (err) {
        next(err);
    }
};

export const refresh = async (req, res, next) => {
    try {
        const token = req.cookies.refresh_token;
        if (!token) return res.status(401).json({ error: 'Missing refresh token' });

        const payload = verifyRefreshToken(token);
        const user = await User.findById(payload.sub);
        if (!user) return res.status(401).json({ error: 'Invalid refresh token' });

        if (payload.tv !== user.token_version) {
            return res.status(401).json({ error: 'Token revoked' });
        }
        const accessToken = signAccessToken(user);
        const refreshToken = signRefreshToken(user);
        setRefreshCookie(res, refreshToken);

        res.json({
            access_token: accessToken,
            token_type: 'bearer',
            expires_in: env.jwt.accessTtl
        });
    } catch (err) {
        return res.status(401).json({ error: 'Invalid / expired refresh token' });
    }
};

export const logout = async (req, res, next) => {
    try {
        let userId;
        const token = req.cookies.refresh_token;

        if (token) {
            try {
                const payload = verifyRefreshToken(token);
                userId = payload.sub;
            } catch (_) {}
        }

        if (!userId && req.user) {
            userId = Number(req.user.sub);
        }

        if (userId) {
            await User.incrementTokenVersion(userId);
        }

        res.clearCookie('refresh_token', {
            httpOnly: true,
            secure: env.cookies.secure,
            sameSite: 'strict',
            domain: env.cookies.domain || undefined,
            path: '/auth'
        });

        res.status(204).send();
    } catch (err) {
        next(err);
    }
};

