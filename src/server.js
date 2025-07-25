import { createApp } from './app.js';
import { env } from './config/env.js';
import { bootstrapDb } from './config/bootstrapDb.js';

await bootstrapDb();

const app = createApp();
app.listen(env.port, () =>
    console.log(`API listening at http://localhost:${env.port}`)
);
