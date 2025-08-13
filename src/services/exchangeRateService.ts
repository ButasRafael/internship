import { ExchangeRate }  from '../models/exchangeRate.model.js';

export const CURRENCIES = ['EUR', 'USD', 'GBP', 'CHF'] as const;
const BASE = 'RON';

export async function fetchAndStoreRates(forDate: Date = new Date()) {
    const dateStr = forDate.toISOString().slice(0, 10);
    const url     =
        `https://www.cursbnr.ro/api/json.php?date=${dateStr}&currency=${CURRENCIES.join(',')}`;

    const res = await fetch(url);
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);

    const data = await res.json() as
        | { date: string; values: Record<string, number> }
        | { error: string };

    if ('error' in data) throw new Error(data.error);

    const day    = data.date;
    const values = data.values;

    for (const cur of CURRENCIES) {
        const raw = values?.[cur];
        if (raw == null) {
            console.warn(`[rates] ${cur} ${day}: missing`);
            continue;
        }

        const rate = Number.parseFloat(String(raw));
        if (!Number.isFinite(rate) || rate <= 0) {
            console.warn(`[rates] ${cur} ${day}: invalid`, raw);
            continue;
        }

        await ExchangeRate.upsert({ day, base: cur, quote: BASE, rate });
    }
}
