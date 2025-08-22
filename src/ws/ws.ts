import http from 'node:http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

type SocketUser = { id: number };

let io: Server | null = null;

export function createWsServer(httpServer: http.Server) {
    io = new Server(httpServer, {
        path: '/ws',
        cors: { origin: env.frontendUrl, credentials: true },
    });

    io.use((socket, next) => {
        try {
            const token =
                socket.handshake.auth?.token ||
                (socket.handshake.query?.access_token as string) ||
                '';
            if (!token) return next(new Error('missing token'));

            const decoded = jwt.verify(token, env.jwt.accessSecret) as any;
            if (!decoded?.sub) return next(new Error('invalid token'));
            (socket.data as any).user = { id: Number(decoded.sub) } satisfies SocketUser;
            next();
        } catch {
            next(new Error('unauthorized'));
        }
    });

    io.on('connection', socket => {
        const user = (socket.data as any).user as SocketUser;
        socket.join(`user:${user.id}`);
        socket.emit('connected', { ok: true });
    });

    return io;
}

export function notifyUser(userId: number, event: string, payload: unknown) {
    if (!io) return;
    io.to(`user:${userId}`).emit(event, payload);
}
