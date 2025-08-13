import { ExchangeRate } from '../src/models/exchangeRate.model.js';

const BASE        = 'RON';
const CURRENCIES  = ['EUR', 'USD', 'GBP', 'CHF'] as const;

(async () => {
    const url = `https://www.cursbnr.ro/api/json.php?currency=${CURRENCIES.join(',')}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);

    const data = await res.json() as
        | { date: string; values: Record<string, number> }
        | { date: string; currency: string; value: number }
        | { error: string };

    if ('error' in data) throw new Error(data.error);

    const day    = data.date;
    const values = 'values' in data ? data.values : { [data.currency]: data.value };

    for (const cur of CURRENCIES) {
        const raw = values?.[cur];
        if (raw == null) {
            console.warn(`[seed] ${cur}: missing for ${day}`);
            continue;
        }

        const rate = Number.parseFloat(String(raw));
        if (!Number.isFinite(rate) || rate <= 0) {
            console.warn(`[seed] ${cur}: invalid rate`, raw);
            continue;
        }

        await ExchangeRate.upsert({ day, base: cur, quote: BASE, rate });
        console.log(`[seed] inserted ${cur} ${rate} on ${day}`);
    }

    process.exit(0);
})();
