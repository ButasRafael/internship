import { ExchangeRate } from '../models/exchangeRate.model.js';

export const CURRENCIES = ['EUR', 'USD', 'GBP', 'CHF'] as const;
const BASE = 'RON';

export async function fetchAndStoreRates(date = new Date()) {
    const dateStr = date.toISOString().slice(0, 10);

    for (const cur of CURRENCIES) {
        const res  = await fetch(
            `https://www.cursbnr.ro/api/json.php?date=${dateStr}&currency=${cur}`
        );
        const data = await res.json() as {
            date: string; currency: string; value: string; error?: string;
        };

        if (data.error) {
            console.warn(`[rates] ${cur} ${dateStr}: ${data.error}`);
            continue;
        }

        await ExchangeRate.upsert({
            day:  data.date,
            base: cur.toUpperCase(),
            quote: BASE,
            rate: parseFloat(data.value)
        });
    }
}

export const getLatestRate = (base: string, quote = BASE) =>
    ExchangeRate.latest(base.toUpperCase(), quote.toUpperCase());
