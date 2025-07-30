import express from 'express';
import cookieParser from 'cookie-parser';

import { setupSwaggerUI } from './config/swagger.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { verifyAccessToken } from './middlewares/auth.js';
import { mountRoutes } from './routes/index.js';
import {openapiValidator} from "./middlewares/validator.js";
import path from "node:path";

export function createApp() {
    const app = express();

    app.use(express.json());
    app.use(cookieParser());

    app.use('/uploads', express.static(path.resolve('uploads')));


    app.use(verifyAccessToken);

    app.use(openapiValidator);

    app.get('/api/health', (_req, res) => res.json({ ok: true, ts: Date.now() }));

    mountRoutes(app);
    
    setupSwaggerUI(app);

    app.use(errorHandler);

    return app;
}
