import {
    AppBar,
    Toolbar,
    Typography,
    Button,
    Container,
    Stack,
    Box,
    IconButton,
    Menu,
    MenuItem,
    Avatar,
    Tooltip,
} from '@mui/material';
import {
    Outlet,
    Link as RouterLink,
    useNavigate,
    useMatch,
    useResolvedPath,
    useLocation,
} from 'react-router-dom';
import { useState, type ReactNode } from 'react';
import { useAuth } from '@/store/auth.store';
import { API } from '@/lib/api';
import { AnimatePresence } from 'framer-motion';
import PageTransition from '@/components/ui/PageTransition';
import AccountCircle from '@mui/icons-material/AccountCircle';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import { useColorMode } from '@/app/providers';

function NavButton({ to, end, children }: { to: string; end?: boolean; children: ReactNode }) {
    const resolved = useResolvedPath(to);
    const match = useMatch({ path: resolved.pathname, end: !!end });

    return (
        <Button
            component={RouterLink}
            to={to}
            sx={{
                textTransform: 'none',
                fontWeight: 600,
                px: 2,
                py: 1.5,
                borderBottom: match ? '2px solid' : '2px solid transparent',
                borderColor: match ? 'primary.main' : 'transparent',
                color: match ? 'primary.main' : 'text.secondary',
                transition: 'color 0.2s, border-color 0.2s',
                '&:hover': {
                    borderColor: 'primary.light',
                    color: 'primary.main',
                    backgroundColor: 'action.hover',
                },
            }}
        >
            {children}
        </Button>
    );
}

export default function AppLayout() {
    const user = useAuth((s) => s.user);
    const hasPerm = useAuth((s) => s.hasPerm);
    const setUser = useAuth((s) => s.setUser);
    const setAccessToken = useAuth((s) => s.setAccessToken);
    const nav = useNavigate();
    const location = useLocation();
    const { mode, toggle } = useColorMode();

    async function logout() {
        await fetch(`${API}/auth/logout`, { method: 'POST', credentials: 'include' }).catch(() => {});
        setAccessToken(null);
        setUser(null);
        nav('/login');
    }

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    const userInitial = user?.email?.[0]?.toUpperCase();

    return (
        <>
            <AppBar
                position="sticky"
                elevation={0}
                sx={{
                    backdropFilter: 'blur(8px)',
                    backgroundColor: (theme) =>
                        theme.palette.mode === 'light'
                            ? 'rgba(255, 255, 255, 0.9)'
                            : 'rgba(0, 0, 0, 0.7)',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                }}
            >
                <Container>
                    <Toolbar disableGutters sx={{ gap: 2, justifyContent: 'space-between' }}>
                        <Stack direction="row" spacing={1} alignItems="center">
                            <Box
                                component="img"
                                src="/tim-logo.png"
                                alt="Time-is-Money logo"
                                sx={{ height: { xs: 32, sm: 40 }, width: 'auto', mr: 1 }}
                            />
                            <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
                                Time-is-Money
                            </Typography>
                        </Stack>

                        <Stack direction="row" spacing={1} sx={{ flexGrow: 1 }}>
                            <NavButton to="/" end>
                                Dashboard
                            </NavButton>
                            <NavButton to="/expenses">Expenses</NavButton>
                            <NavButton to="/categories">Categories</NavButton>
                            <NavButton to="/budgets">Budgets</NavButton>
                            <NavButton to="/goals">Goals</NavButton>
                            <NavButton to="/incomes">Incomes</NavButton>
                            <NavButton to="/activities">Activities</NavButton>
                            <NavButton to="/objects">Objects</NavButton>
                            {(hasPerm('user_view') || hasPerm('exchange_rate_view')) && (
                                <>
                                    {hasPerm('user_view') && (
                                        <NavButton to="/admin/users">Users</NavButton>
                                    )}
                                    {hasPerm('exchange_rate_view') && (
                                        <NavButton to="/admin/exchange-rates">Rates</NavButton>
                                    )}
                                </>
                            )}
                        </Stack>

                        <Stack direction="row" spacing={1} alignItems="center">
                            <Tooltip title={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
                                <IconButton onClick={toggle} aria-label="toggle theme" sx={{ mr: 0.5 }}>
                                    {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
                                </IconButton>
                            </Tooltip>

                            <Typography sx={{ color: 'text.secondary', display: { xs: 'none', sm: 'block' } }}>
                                {user?.email}
                            </Typography>
                            <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} sx={{ p: 0 }}>
                                {userInitial ? (
                                    <Avatar
                                        sx={{
                                            bgcolor: 'primary.main',
                                            width: 32,
                                            height: 32,
                                            fontSize: 14,
                                            color: 'primary.contrastText',
                                        }}
                                    >
                                        {userInitial}
                                    </Avatar>
                                ) : (
                                    <AccountCircle color="primary" fontSize="large" />
                                )}
                            </IconButton>
                            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
                                <MenuItem
                                    onClick={() => {
                                        setAnchorEl(null);
                                        nav('/profile');
                                    }}
                                >
                                    Profile
                                </MenuItem>
                                <MenuItem onClick={logout}>Logout</MenuItem>
                            </Menu>
                        </Stack>
                    </Toolbar>
                </Container>
            </AppBar>

            <Container sx={{ py: 3 }}>
                <AnimatePresence mode="wait">
                    <PageTransition key={location.pathname} variant="shared">
                        <Outlet />
                    </PageTransition>
                </AnimatePresence>
                <Box sx={{ py: 4 }} />
            </Container>
        </>
    );
}
