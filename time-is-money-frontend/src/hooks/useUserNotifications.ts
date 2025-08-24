
import useSWR, { mutate as swrMutate} from 'swr';
import { API } from '@/lib/api';
import { useAuth } from '@/store/auth.store';

export type NotificationRow = {
    id: number;
    alert_id: number;
    channel: 'email' | 'telegram' | 'webhook' | 'websocket';
    sent_at: string;
    read_at: string | null;                 // unread/read state
    dedupe_key?: string | null;
    payload_json: any;
};

type ListOpts = {
    sinceId?: number;
    sinceTs?: string;                       // ISO string
    limit?: number;                         // default capped in API
    order?: 'ASC' | 'DESC';                 // default DESC
    unreadOnly?: boolean;                   // filter only unread
};

function toQuery(opts?: ListOpts) {
    if (!opts) return '';
    const p = new URLSearchParams();
    if (opts.sinceId != null) p.set('since_id', String(opts.sinceId));
    if (opts.sinceTs)         p.set('since_ts', opts.sinceTs);
    if (opts.limit != null)   p.set('limit', String(opts.limit));
    if (opts.order)           p.set('order', opts.order);
    if (opts.unreadOnly)      p.set('unread', '1');
    const s = p.toString();
    return s ? `?${s}` : '';
}

/** Convenience: builds the list key used by SWR */
export function notificationsListKey(userId: number, opts?: ListOpts) {
    return `/api/users/${userId}/notifications${toQuery(opts)}`;
}

/** Hook to read + mutate a user's notifications list */
export function useUserNotifications(userId: number | null, opts?: ListOpts) {
    const base = userId ? `/api/users/${userId}/notifications` : null;
    const key  = base ? `${base}${toQuery(opts)}` : null;

    const { data, error, isLoading, mutate } = useSWR<NotificationRow[]>(key);

    // mark a single notification as read (optimistic)
    const markRead = async (id: number) => {
        if (!base) return;
        // optimistic update list
        mutate(
            (prev) =>
                (prev ?? []).map((n) =>
                    n.id === id && n.read_at == null
                        ? { ...n, read_at: new Date().toISOString() }
                        : n
                ),
            false
        );
        try {
            const { accessToken } = useAuth.getState();
            const headers = new Headers();
            if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);
            await fetch(`${API}${base}/${id}/mark-read`, {
                method: 'POST',
                credentials: 'include',
                headers,
            });
        } finally {
            // revalidate unread counter; keep list optimistic to feel instant
            swrMutate(`${base}/unread-count`);
        }
    };

    // mark all as read (optimistic)
    const markAllRead = async () => {
        if (!base) return;
        const nowIso = new Date().toISOString();
        // optimistic update list
        mutate(
            (prev) => (prev ?? []).map((n) => (n.read_at == null ? { ...n, read_at: nowIso } : n)),
            false
        );
        try {
            const { accessToken } = useAuth.getState();
            const headers = new Headers();
            if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);
            await fetch(`${API}${base}/mark-all-read`, {
                method: 'POST',
                credentials: 'include',
                headers,
            });
        } finally {
            swrMutate(`${base}/unread-count`);
        }
    };

    return {
        notifications: data ?? [],
        error,
        isLoading,
        mutate,
        key,
        markRead,
        markAllRead,
        reload: () => mutate(), // convenience
    };
}
export async function markRead(userId: number, id: number) {
    const base = `/api/users/${userId}/notifications`;
    const { accessToken } = useAuth.getState();
    const headers = new Headers();
    if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);
    await fetch(`${API}${base}/${id}/mark-read`, { method: 'POST', credentials: 'include', headers });
    // nudge badge; caller may also do local optimistic updates
    swrMutate(`${base}/unread-count`);
}

export async function markAllRead(userId: number) {
    const base = `/api/users/${userId}/notifications`;
    const { accessToken } = useAuth.getState();
    const headers = new Headers();
    if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);
    await fetch(`${API}${base}/mark-all-read`, { method: 'POST', credentials: 'include', headers });
    swrMutate(`${base}/unread-count`);
}

export function useUnreadCount(userId: number | null) {
    const key = userId ? `/api/users/${userId}/notifications/unread-count` : null;
    const { data, error, isLoading, mutate } = useSWR<{ count: number }>(key);
    return {
        count: data?.count ?? 0,
        error,
        isLoading,
        mutate,
        key,
        reload: () => mutate(),
    };
}
