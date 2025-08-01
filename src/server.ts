import { scheduleExchangeRateJob } from './jobs/updateExchangeRates.js';
import { createApp } from './app.js';
import { env } from './config/env.js';

scheduleExchangeRateJob();
createApp().listen(env.port, () =>
    console.log(`API listening at http://localhost:${env.port}`)
);
