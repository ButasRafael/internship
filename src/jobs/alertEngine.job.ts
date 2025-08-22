import cron from 'node-cron';
import { evaluateAllActiveAlerts, evaluateAlertsForUser } from '../services/alertEngine.service.js';

const pending = new Set<number>();
let timer: NodeJS.Timeout | null = null;

function flushSoon() {
    if (timer) return;
    timer = setTimeout(async () => {
        const users = [...pending.values()];
        pending.clear();
        timer = null;
        for (const u of users) {
            try { await evaluateAlertsForUser(u); } catch (e) { console.error('[alerts] flush user failed', u, e); }
        }
    }, 500); // debounce bursts
}

export function queueAlertRecalc(userId: number) {
    pending.add(userId);
    flushSoon();
}

export function scheduleAlertEngine() {
    cron.schedule('*/10 * * * *', async () => {
        try { await evaluateAllActiveAlerts(); }
        catch (err) { console.error('[alerts] cron failed', err); }
    });
    console.log('[alerts] job scheduled */10 minutes');
}
