import { Request, Response, NextFunction } from 'express';
import { User } from '../models/user.model.js';
import { EmailVerificationToken } from '../models/emailVerificationToken.model.js';
import { sendMail } from '../utils/mailer.js';
import { env } from '../config/env.js';

export const sendVerification = async (req: Request, res: Response) => {
    const { email } = req.body as { email?: string };
    if (!email) return res.status(400).json({ error: 'email required' });

    const user = await User.findByEmail(email);
    if (user) {
        const token = await EmailVerificationToken.issue(user.id);
        const url   = `${env.frontendUrl}/verify-email?token=${token}`;
        await sendMail({
            to: email,
            subject: 'Verify your Time-is-Money account',
            text: `Click the link to verify: ${url}`,
            html: `<p>Hello,</p><p>Please <a href="${url}">verify your e-mail</a>. Link valid 24 h.</p>`
        });
    }
    res.json({ ok: true });
};

export const verifyEmail = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { token } = req.params;
        const user_id   = await EmailVerificationToken.consume(token);
        if (!user_id) return res.status(400).json({ error: 'Invalid or expired token' });

        await User.update(user_id, { email_verified: 1 });
        res.status(204).send();
    } catch (e) { next(e); }
};