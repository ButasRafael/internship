import { Typography } from '@mui/material';
import { NotificationCenter } from '@/components/NotificationCenter.tsx';

export default function NotificationsPage() {
    return (
        <>
            <Typography variant="h5" sx={{ mb: 2 }}>Notifications</Typography>
            <NotificationCenter />
        </>
    );
}