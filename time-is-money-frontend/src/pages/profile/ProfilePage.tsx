import { useEffect, useMemo, useState } from 'react';
import { Grid, Paper, Stack, Typography, TextField, Select, MenuItem, Button, Divider, FormControl, InputLabel, RadioGroup, FormControlLabel, Radio } from '@mui/material';
import { useAuth } from '@/store/auth.store';
import { apiFetch } from '@/lib/api';
import { useNotifications } from '@/components/NotificationsContext';
import { useColorMode } from '@/app/providers';

const CURRENCIES = ['RON', 'EUR', 'USD', 'GBP', 'CHF'] as const;
const TIMEZONES = ['Europe/Bucharest','UTC','Europe/Berlin','Europe/London','America/New_York','Asia/Tokyo'] as const;

export default function ProfilePage() {
    const user = useAuth((s) => s.user)!;
    const setUser = useAuth((s) => s.setUser);
    const notify = useNotifications();
    const { mode, setMode } = useColorMode();

    const [email] = useState(user.email);
    const [hourlyRate, setHourlyRate] = useState<string>(String(user.hourly_rate ?? ''));
    const [currency, setCurrency] = useState<string>(user.currency ?? 'RON');
    const [timezone, setTimezone] = useState<string>(user.timezone ?? 'Europe/Bucharest');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setHourlyRate(String(user.hourly_rate ?? ''));
        setCurrency(user.currency ?? 'RON');
        setTimezone(user.timezone ?? 'Europe/Bucharest');
    }, [user.id, user.hourly_rate, user.currency, user.timezone]);

    const dirty = useMemo(() => {
        return (
            (hourlyRate !== '' ? Number(hourlyRate) : null) !== (user.hourly_rate ?? null) ||
            currency !== (user.currency ?? '') ||
            timezone !== (user.timezone ?? '')
        );
    }, [hourlyRate, currency, timezone, user.hourly_rate, user.currency, user.timezone]);

    async function saveProfile() {
        const rate = hourlyRate === '' ? null : Number(hourlyRate);
        if (rate !== null && (Number.isNaN(rate) || rate < 0)) {
            notify.show('Hourly rate must be a positive number.', { severity: 'warning' });
            return;
        }
        setSaving(true);
        try {
            const updated = await apiFetch(`/api/users/${user.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: user.email, hourly_rate: rate, currency, timezone }),
            });
            setUser(updated as any);
            notify.show('Profile updated.', { severity: 'success' });
        } catch (e: any) {
            notify.show(`Save failed: ${e?.message ?? 'unknown error'}`, { severity: 'error' });
        } finally {
            setSaving(false);
        }
    }

    return (
        <Stack spacing={3}>
            <Typography variant="h5" fontWeight={700}>Profile</Typography>
            <Grid container spacing={2} columns={12}>
                <Grid size={{ xs: 12, md: 7 }}>
                    <Paper sx={{ p: 3 }}>
                        <Stack spacing={2}>
                            <Typography variant="subtitle1" fontWeight={600}>Account</Typography>

                            <TextField
                                label="Email"
                                value={email}
                                InputProps={{ readOnly: true }}
                            />

                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                <TextField
                                    label="Hourly rate"
                                    type="number"
                                    value={hourlyRate}
                                    onChange={(e) => setHourlyRate(e.target.value)}
                                    fullWidth
                                    inputProps={{ step: '0.01', min: '0' }}
                                />
                                <FormControl fullWidth>
                                    <InputLabel id="currency-label">Currency</InputLabel>
                                    <Select
                                        labelId="currency-label"
                                        label="Currency"
                                        value={currency}
                                        onChange={(e) => setCurrency(e.target.value)}
                                    >
                                        {CURRENCIES.map((c) => (
                                            <MenuItem key={c} value={c}>{c}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Stack>

                            <FormControl fullWidth>
                                <InputLabel id="tz-label">Timezone</InputLabel>
                                <Select
                                    labelId="tz-label"
                                    label="Timezone"
                                    value={timezone}
                                    onChange={(e) => setTimezone(e.target.value)}
                                >
                                    {TIMEZONES.map((tz) => (
                                        <MenuItem key={tz} value={tz}>{tz}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <Stack direction="row" spacing={1}>
                                <Button variant="contained" onClick={saveProfile} disabled={saving || !dirty}>
                                    {saving ? 'Saving…' : 'Save changes'}
                                </Button>
                            </Stack>
                        </Stack>
                    </Paper>
                </Grid>

                <Grid size={{ xs: 12, md: 5 }}>
                    <Paper sx={{ p: 3 }}>
                        <Stack spacing={2}>
                            <Typography variant="subtitle1" fontWeight={600}>Preferences</Typography>
                            <Divider />
                            <FormControl>
                                <Typography variant="body2" sx={{ mb: 1 }}>Theme</Typography>
                                <RadioGroup
                                    row
                                    value={mode}
                                    onChange={(_, v) => (v === 'light' || v === 'dark') ? setMode(v) : null}
                                >
                                    <FormControlLabel value="light" control={<Radio />} label="Light" />
                                    <FormControlLabel value="dark" control={<Radio />} label="Dark" />
                                </RadioGroup>
                            </FormControl>
                        </Stack>
                    </Paper>
                </Grid>
            </Grid>
        </Stack>
    );
}
