import { Router } from 'express';
import { sendWebNotification } from '../services/notificationService.js';
import { requireAuth } from '../middlewares/auth.js';

export const devRouter = Router();
devRouter.post('/dev/test-notify', requireAuth, async (req, res) => {
    const userId = Number((req as any).user.id);
    const { alertId, title='Test', message='Hello!', severity='info', dedupe_key } = req.body || {};
    await sendWebNotification(userId, Number(alertId), { title, message, severity, dedupe_key });
    res.json({ ok: true });
});