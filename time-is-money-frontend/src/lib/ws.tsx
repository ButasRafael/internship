// src/lib/ws.tsx
import { createContext, useContext, useEffect, useMemo, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/store/auth.store';
import { useNotifications } from '@/components/NotificationsContext';
import { API } from '@/lib/api';
import { mutate as swrMutate } from 'swr';

type WsCtx = { socket: Socket | null };
const Ctx = createContext<WsCtx>({ socket: null });
export const useWs = () => useContext(Ctx);

// Local copy of the row type so this file doesn’t depend on a hook.
type NotificationRow = {
    id?: number;
    alert_id: number;
    channel: 'email' | 'telegram' | 'webhook' | 'websocket';
    sent_at: string;
    read_at: string | null;                 // ← NEW: unread/read state
    dedupe_key?: string | null;
    payload_json: any;
};

export function WsProvider({ children }: { children: React.ReactNode }) {
    const accessToken = useAuth((s) => s.accessToken);
    const notifications = useNotifications();
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        // disconnect previous
        if (socketRef.current) {
            try {
                socketRef.current.disconnect();
            } catch {}
            socketRef.current = null;
        }
        if (!accessToken) return;

        const s = io(API.replace('/api', ''), {
            path: '/ws',
            withCredentials: true,
            auth: { token: accessToken },
        });

        s.on('connect_error', (err) => {
            console.warn('[ws] connect_error', err.message);
        });

        s.on('connected', () => {
            // console.log('[ws] connected');
        });

        s.on('notification:new', (payload: {
            id?: number;
            alert_id: number;
            title: string;
            message: string;
            severity?: 'info' | 'success' | 'warning' | 'error';
            sent_at?: string;
            meta?: Record<string, unknown>;
            dedupe_key?: string;
        }) => {
            // toast
            notifications.show(
                <>
                    <strong>{payload.title}</strong>
                    <br />
                    <span>{payload.message}</span>
                </>,
                { severity: payload.severity ?? 'info', autoHideDuration: 5000 }
            );

            // append to SWR-backed list (keeps Notification Center in sync)
            const userId = useAuth.getState().user?.id;
            if (userId) {
                const listKey = `/api/users/${userId}/notifications`;
                const badgeKey = `/api/users/${userId}/notifications/unread-count`;

                const newRow: NotificationRow = {
                    id: payload.id,
                    alert_id: payload.alert_id,
                    channel: 'websocket',
                    sent_at: payload.sent_at ?? new Date().toISOString(),
                    read_at: null, // new notifications arrive as unread
                    dedupe_key: payload.dedupe_key ?? null,
                    payload_json: payload,
                };

                // optimistic prepend without revalidation
                swrMutate(listKey, (prev: NotificationRow[] = []) => [newRow, ...prev], false);

                // optimistic bump of unread badge count
                swrMutate(
                    badgeKey,
                    (prev: { count: number } | undefined) => ({ count: (prev?.count ?? 0) + 1 }),
                    false
                );
            }
        });

        socketRef.current = s;
        return () => {
            try {
                s.disconnect();
            } catch {}
        };
    }, [accessToken, notifications]);

    const value = useMemo(() => ({ socket: socketRef.current }), []);
    return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
