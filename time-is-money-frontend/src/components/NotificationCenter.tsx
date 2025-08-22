import { useMemo, useCallback } from 'react';
import { useAuth } from '@/store/auth.store';
import {
    useUserNotifications,
    useUnreadCount,
    markRead,
    markAllRead,
    type NotificationRow,
} from '@/hooks/useUserNotifications';

export function NotificationCenter() {
    const user = useAuth((s) => s.user);
    const userId = user?.id ?? null;

    const {
        notifications,
        isLoading,
        error,
        mutate: mutateList,
    } = useUserNotifications(userId);
    const { count, mutate: mutateCount } = useUnreadCount(userId);

    const fmt = useMemo(
        () =>
            new Intl.DateTimeFormat(undefined, {
                year: 'numeric',
                month: 'short',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
            }),
        []
    );

    const items = useMemo(() => {
        return (notifications ?? []).map((n) => {
            let payload: any = n.payload_json;
            if (typeof payload === 'string') {
                try {
                    payload = JSON.parse(payload);
                } catch {
                    payload = {};
                }
            }
            const key = n.id ?? `${n.alert_id}-${payload?.dedupe_key ?? n.sent_at}`;
            return { key, n, payload };
        });
    }, [notifications]);

    const onMarkAllRead = useCallback(async () => {
        if (!userId || !count) return;
        await markAllRead(userId);
        // optimistic local updates
        mutateCount({ count: 0 }, false);
        mutateList(
            (prev) =>
                (prev ?? []).map((row) =>
                    row.read_at ? row : { ...row, read_at: new Date().toISOString() }
                ),
            false
        );
    }, [userId, count, mutateCount, mutateList]);

    const onMarkOneRead = useCallback(
        async (row: NotificationRow) => {
            if (!userId || row.read_at) return;
            await markRead(userId, row.id);
            // optimistic: update the one row + badge
            mutateList(
                (prev) =>
                    (prev ?? []).map((n) =>
                        n.id === row.id ? { ...n, read_at: new Date().toISOString() } : n
                    ),
                false
            );
            mutateCount(
                (prev) => ({ count: Math.max(0, (prev?.count ?? 1) - 1) }),
                false
            );
        },
        [userId, mutateList, mutateCount]
    );

    if (!user) return null;
    if (isLoading) return <div>Loading…</div>;
    if (error) return <div style={{ color: '#b91c1c' }}>Failed to load notifications.</div>;
    if (!notifications.length) {
        return (
            <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <h3 style={{ margin: 0 }}>Notifications</h3>
                    <button
                        disabled
                        style={{
                            padding: '6px 10px',
                            borderRadius: 8,
                            border: '1px solid #e5e7eb',
                            background: '#f9fafb',
                            cursor: 'not-allowed',
                            opacity: 0.6,
                        }}
                    >
                        Mark all read
                    </button>
                </div>
                No notifications yet.
            </div>
        );
    }

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <h3 style={{ margin: 0 }}>Notifications</h3>
                <button
                    onClick={onMarkAllRead}
                    disabled={!count}
                    style={{
                        padding: '6px 10px',
                        borderRadius: 8,
                        border: '1px solid #e5e7eb',
                        background: count ? '#fff' : '#f9fafb',
                        cursor: count ? 'pointer' : 'not-allowed',
                    }}
                >
                    Mark all read{count ? ` (${count})` : ''}
                </button>
            </div>

            {items.map(({ key, n, payload }) => {
                const isUnread = !n.read_at;
                return (
                    <div
                        key={key}
                        style={{
                            padding: 12,
                            marginBottom: 8,
                            border: '1px solid #e5e7eb',
                            borderRadius: 12,
                            display: 'flex',
                            gap: 12,
                            alignItems: 'flex-start',
                            background: isUnread ? 'rgba(30,94,255,0.06)' : 'transparent',
                        }}
                    >
                        <div
                            title={isUnread ? 'Unread' : 'Read'}
                            style={{
                                width: 10,
                                height: 10,
                                borderRadius: '50%',
                                marginTop: 6,
                                background: isUnread ? '#1E5EFF' : '#e5e7eb',
                                flex: '0 0 auto',
                            }}
                        />
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: isUnread ? 700 : 600 }}>
                                {payload.title ?? n.channel}
                            </div>
                            <div>{payload.message ?? ''}</div>
                            <div style={{ fontSize: 12, opacity: 0.7 }}>
                                {fmt.format(new Date(n.sent_at))}
                                {payload.severity ? ` · ${payload.severity}` : ''}
                            </div>
                        </div>
                        {isUnread && (
                            <button
                                onClick={() => onMarkOneRead(n)}
                                style={{
                                    padding: '6px 10px',
                                    borderRadius: 8,
                                    border: '1px solid #e5e7eb',
                                    background: '#fff',
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                Mark read
                            </button>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

