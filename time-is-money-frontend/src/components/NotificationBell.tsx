// src/components/NotificationBell.tsx
import { useState } from 'react';
import {
    IconButton,
    Badge,
    Menu,
    MenuItem,
    ListItemText,
    ListItemIcon,
    Divider,
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import { useAuth } from '@/store/auth.store';
import {
    useUserNotifications,
    useUnreadCount,
    markRead,
    markAllRead,
    type NotificationRow,
} from '@/hooks/useUserNotifications';
import { Link as RouterLink, useNavigate } from 'react-router-dom';

export default function NotificationBell() {
    const user = useAuth((s) => s.user);
    const userId = user?.id ?? null;

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    // full list for the dropdown preview
    const { notifications, mutate: mutateList } = useUserNotifications(userId);
    const latest: NotificationRow[] = notifications.slice(0, 8);

    // unread badge
    const { count, mutate: mutateCount } = useUnreadCount(userId);

    const nav = useNavigate();

    const onOpen = (e: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(e.currentTarget);
    };
    const onClose = () => setAnchorEl(null);

    async function onMarkAllRead() {
        if (!userId) return;
        try {
            await markAllRead(userId);
            // optimistic: zero the badge and mark local list as read
            mutateCount({ count: 0 }, false);
            mutateList(
                (prev: NotificationRow[] | undefined) =>
                    (prev ?? []).map((n) =>
                        n.read_at ? n : { ...n, read_at: new Date().toISOString() }
                    ),
                false
            );
        } finally {
            onClose();
        }
    }

    async function onItemClick(n: NotificationRow) {
        if (!userId) return;
        // mark single item as read (if unread), then go to center
        if (!n.read_at) {
            try {
                await markRead(userId, n.id);
                mutateList(
                    (prev: NotificationRow[] | undefined) =>
                        (prev ?? []).map((row) =>
                            row.id === n.id ? { ...row, read_at: new Date().toISOString() } : row
                        ),
                    false
                );
                mutateCount(
                    (prev: { count: number } | undefined) => ({ count: Math.max(0, (prev?.count ?? 1) - 1) }),
                    false
                );
            } catch {
            }
        }
        onClose();
        nav('/notifications');
    }

    return (
        <>
            <IconButton onClick={onOpen} aria-label="notifications">
                <Badge badgeContent={count} color="primary">
                    <NotificationsIcon />
                </Badge>
            </IconButton>

            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={onClose}>
                {latest.length === 0 ? (
                    <MenuItem disabled>No notifications yet</MenuItem>
                ) : (
                    latest.map((n) => {
                        const p =
                            typeof n.payload_json === 'string'
                                ? JSON.parse(n.payload_json)
                                : n.payload_json;
                        const isUnread = !n.read_at;
                        return (
                            <MenuItem key={n.id} onClick={() => onItemClick(n)}>
                                {isUnread && (
                                    <ListItemIcon sx={{ minWidth: 28 }}>
                                        <FiberManualRecordIcon fontSize="small" />
                                    </ListItemIcon>
                                )}
                                <ListItemText
                                    primary={p?.title ?? n.channel}
                                    secondary={new Date(n.sent_at).toLocaleString()}
                                    primaryTypographyProps={{
                                        fontWeight: isUnread ? 700 : 500,
                                    }}
                                />
                            </MenuItem>
                        );
                    })
                )}

                <Divider />

                <MenuItem component={RouterLink} to="/notifications" onClick={onClose}>
                    Open Notification Center
                </MenuItem>

                <MenuItem onClick={onMarkAllRead} disabled={!count}>
                    <ListItemIcon>
                        <DoneAllIcon fontSize="small" />
                    </ListItemIcon>
                    Mark all as read
                </MenuItem>
            </Menu>
        </>
    );
}
