import cron from 'node-cron';
import { fetchAndStoreRates } from '../services/exchangeRateService.js';

export function scheduleExchangeRateJob() {
    cron.schedule(
        '30 14 * * 1-5',
        async () => {
            try {
                await fetchAndStoreRates();
            } catch (err) {
                console.error('[rates] cron failed', err);
            }
        },
        { timezone: 'Europe/Bucharest' }
    );

    console.log('[rates] job scheduled for 14:30 EET, Mon-Fri');
}
