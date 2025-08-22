import http from 'node:http';
import { scheduleExchangeRateJob } from './jobs/updateExchangeRates.js';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { createWsServer } from './ws/ws.js';
import { scheduleAlertEngine } from './jobs/alertEngine.job.js';

const app = createApp();
const httpServer = http.createServer(app);
createWsServer(httpServer);

scheduleExchangeRateJob();
scheduleAlertEngine();

httpServer.listen(env.port, () =>
    console.log(`API listening at http://localhost:${env.port}`)
);
