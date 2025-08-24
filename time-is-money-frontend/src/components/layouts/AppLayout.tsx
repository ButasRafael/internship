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
import EnhancedPageTransition from '@/components/ui/EnhancedPageTransition';
import AccountCircle from '@mui/icons-material/AccountCircle';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import { useColorMode } from '@/app/providers';
import NotificationBell from '@/components/NotificationBell';

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
                px: { xs: 1, sm: 1.5, md: 2 },
                py: { xs: 1, sm: 1.5 },
                fontSize: { xs: '0.8rem', sm: '0.875rem' },
                minWidth: 'fit-content',
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
                <Container maxWidth={false}>
                    <Toolbar 
                        disableGutters 
                        sx={{ 
                            gap: { xs: 1, sm: 1.5, md: 2 }, 
                            justifyContent: 'space-between',
                            minHeight: { xs: 56, sm: 64 }
                        }}
                    >
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 'fit-content' }}>
                            <Box
                                component="img"
                                src="/tim-logo.png"
                                alt="Time-is-Money logo"
                                sx={{ height: { xs: 28, sm: 36 }, width: 'auto', mr: { xs: 0.5, sm: 1 } }}
                            />
                            <Typography 
                                variant="h6" 
                                sx={{ 
                                    fontWeight: 700, 
                                    color: 'primary.main',
                                    whiteSpace: 'nowrap',
                                    fontSize: { xs: '1rem', sm: '1.25rem' }
                                }}
                            >
                                Time-is-Money
                            </Typography>
                        </Stack>

                        <Stack 
                            direction="row" 
                            spacing={{ xs: 0.5, sm: 0.75, md: 1 }} 
                            sx={{ 
                                flexGrow: 1, 
                                justifyContent: 'center',
                                overflow: 'hidden',
                                mx: { xs: 1, sm: 2 }
                            }}
                        >
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
                            <NavButton to="/scenarios/enhanced">Scenarios</NavButton>
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

                        <Stack 
                            direction="row" 
                            spacing={{ xs: 0.5, sm: 1 }} 
                            alignItems="center"
                            sx={{ minWidth: 'fit-content' }}
                        >
                            <Tooltip title={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
                                <IconButton 
                                    onClick={toggle} 
                                    aria-label="toggle theme" 
                                    sx={{ 
                                        p: { xs: 0.5, sm: 1 },
                                        '& .MuiSvgIcon-root': {
                                            fontSize: { xs: '1.1rem', sm: '1.25rem' }
                                        }
                                    }}
                                >
                                    {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
                                </IconButton>
                            </Tooltip>

                            <NotificationBell />

                            <Typography 
                                sx={{ 
                                    color: 'text.secondary', 
                                    display: { xs: 'none', md: 'block' },
                                    fontSize: { sm: '0.875rem' },
                                    maxWidth: '120px',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                }}
                            >
                                {user?.email}
                            </Typography>
                            <IconButton 
                                onClick={(e) => setAnchorEl(e.currentTarget)} 
                                sx={{ p: { xs: 0.25, sm: 0.5 } }}
                            >
                                {userInitial ? (
                                    <Avatar
                                        sx={{
                                            bgcolor: 'primary.main',
                                            width: { xs: 28, sm: 32 },
                                            height: { xs: 28, sm: 32 },
                                            fontSize: { xs: 12, sm: 14 },
                                            color: 'primary.contrastText',
                                        }}
                                    >
                                        {userInitial}
                                    </Avatar>
                                ) : (
                                    <AccountCircle color="primary" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }} />
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
                    <EnhancedPageTransition key={location.pathname} variant="shared">
                        <Outlet />
                    </EnhancedPageTransition>
                </AnimatePresence>
                <Box sx={{ py: 4 }} />
            </Container>
        </>
    );
}
