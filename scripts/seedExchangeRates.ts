import { ExchangeRate } from '../src/models/exchangeRate.model.js';
import { CURRENCIES }   from '../src/services/exchangeRateService.js';

const BASE = 'RON';

(async () => {
    for (const cur of CURRENCIES) {
        try {
            const res  = await fetch(`https://www.cursbnr.ro/api/json.php?currency=${cur}`);
            const data = await res.json() as {
                date: string; currency: string; value: string; error?: string;
            };

            if (data.error) {
                console.warn(`[seed] ${cur}: ${data.error}`);
                continue;
            }

            await ExchangeRate.upsert({
                day:   data.date,
                base:  cur.toUpperCase(),
                quote: BASE,
                rate:  parseFloat(data.value),
            });

            console.log(`[seed] inserted ${cur} ${data.value} on ${data.date}`);
        } catch (err) {
            console.error(`[seed] ${cur} failed:`, err);
        }
    }

    process.exit(0);
})();
