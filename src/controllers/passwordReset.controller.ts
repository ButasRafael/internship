import { Request, Response, NextFunction } from 'express';
import { User } from '../models/user.model.js';
import bcrypt from 'bcryptjs';
import { PasswordResetToken } from '../models/passwordResetToken.model.js';
import { sendMail } from '../utils/mailer.js';
import { env } from '../config/env.js';

export const requestReset = async (req: Request, res: Response) => {
    const { email } = req.body as { email?: string };
    if (!email) return res.status(400).json({ error: 'email required' });

    const user = await User.findByEmail(email);
    if (user) {
        const token = await PasswordResetToken.issue(user.id);
        const url = `${env.frontendUrl}/reset-password?token=${token}`;
        await sendMail({
            to: email,
            subject: 'Reset your Time-is-Money password',
            text: `Click the link to reset: ${url}`,
            html: `<p>Hello,</p><p>Reset your password <a href="${url}">here</a>. 
             Link expires in 2 h.</p>`
        });
    }
    res.json({ ok: true });
};

export const performReset = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { token } = req.params;
        const { password } = req.body as { password?: string };
        if (!password) return res.status(400).json({ error: 'password required' });

        const user_id = await PasswordResetToken.consume(token);
        if (!user_id) return res.status(400).json({ error: 'Invalid or expired token' });

        const hash = await bcrypt.hash(password, 12);
        await User.update(user_id, { password_hash: hash });
        await User.incrementTokenVersion(user_id);

        res.status(204).send();
    } catch (err) {
        next(err);
    }
};
