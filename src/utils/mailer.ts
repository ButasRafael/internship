import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

export const transporter = nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.secure,
    auth: env.smtp.user ? { user: env.smtp.user, pass: env.smtp.pass } : undefined,
});

export async function sendMail(opts: { to: string; subject: string; html: string; text?: string }) {
    if (env.nodeEnv === 'test') return;
    await transporter.sendMail({ from: env.smtp.from, ...opts });
}
