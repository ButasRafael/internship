import GenericCrudPage from '@/components/GenericCrudPage';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/store/auth.store';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import { fx } from '@/lib/fx';
import { currentMonthKey, fmtH, incomeSnapshotForMonth } from '@/lib/insights';
import { Stack, Typography, TextField } from '@mui/material';

const CURRENCIES = ['RON','EUR','USD','GBP','CHF'] as const;

type IncomeRow = {
    id: number;
    received_at: string;
    amount_cents: number;
    currency: string;
    source: 'salary' | 'freelance' | 'bonus' | 'dividend' | 'interest' | 'gift' | 'other';
    recurring: 'none' | 'weekly' | 'monthly' | 'yearly';
    notes: string | null;
};

type IncomeRowUI = IncomeRow & {
    __ins?: {
        moneyUserThisMonth: number;      // amount for this month in user's currency
        hoursThisMonth: number | null;   // valued hours for this month (null if no hourly rate)
    };
};

export default function IncomeCrudPage() {
    const user = useAuth((s) => s.user)!;
    const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthKey());
    const [effectiveRate, setEffectiveRate] = useState<number | null | undefined>(undefined);

    const ctx = useMemo(
        () => ({
            userCurrency: user.currency,
            hourlyRate: user.hourly_rate ?? null,
            fx: (from: string, to: string, date: Date) => fx(from, to, date),
        }),
        [user.currency, user.hourly_rate]
    );

    useEffect(() => {
        (async () => {
            try {
                const rates = await apiFetch<{ month: string; hourly_rate: number | null }[]>(`/api/users/${user.id}/hourly-rates?from=${selectedMonth}&to=${selectedMonth}`);
                setEffectiveRate(rates?.[0]?.hourly_rate ?? (user.hourly_rate ?? null));
            } catch {
                setEffectiveRate(user.hourly_rate ?? null);
            }
        })();
    }, [user.id, user.hourly_rate, selectedMonth]);

    return (
        <>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
            <TextField
                type="month"
                label="Month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                size="small"
                sx={{ width: 200 }}
            />
            <Typography variant="caption" color="text.secondary">
                {effectiveRate
                    ? `Effective rate for ${selectedMonth}: ${effectiveRate}/h · ${ctx.userCurrency}`
                    : 'Set hourly rate to value incomes in hours'}
            </Typography>
        </Stack>
        <GenericCrudPage<IncomeRowUI>
            key={`${user.hourly_rate ?? 'NA'}-${user.currency}-${selectedMonth}`}
            title="Incomes"
            fetchList={async () => {
                const rows = await apiFetch<IncomeRow[]>(`/api/users/${user.id}/incomes`);
                const rates = await apiFetch<{ month: string; hourly_rate: number | null }[]>(`/api/users/${user.id}/hourly-rates?from=${selectedMonth}&to=${selectedMonth}`);
                const eff = rates?.[0]?.hourly_rate ?? (user.hourly_rate ?? null);
                const ctx2 = { ...ctx, hourlyRateFor: () => eff } as typeof ctx & { hourlyRateFor: (mk: string) => number | null };
                return await Promise.all(
                    rows.map(async (r) => {
                        const snap = await incomeSnapshotForMonth(
                            {
                                amount_cents: r.amount_cents,
                                currency: r.currency,
                                recurring: r.recurring,
                                received_at: r.received_at,
                            },
                            selectedMonth,
                            ctx2
                        );
                        return {
                            ...r,
                            __ins: snap,
                        } as IncomeRowUI;
                    })
                );
            }}
            createItem={(data) =>
                apiFetch(`/api/users/${user.id}/incomes`, {
                    method: 'POST',
                    body: JSON.stringify(data),
                    headers: { 'Content-Type': 'application/json' },
                })
            }
            updateItem={(id, data) =>
                apiFetch(`/api/users/${user.id}/incomes/${id}`, {
                    method: 'PUT',
                    body: JSON.stringify(data),
                    headers: { 'Content-Type': 'application/json' },
                })
            }
            deleteItem={(id) => apiFetch(`/api/users/${user.id}/incomes/${id}`, { method: 'DELETE' })}
            createDefaults={{
                currency: user.currency,
                received_at: dayjs().format('YYYY-MM-DD'),
                recurring: 'none',
            }}
            formatRows={(rows) =>
                rows.map((r) => ({
                    ...r,
                    amount_cents: r.amount_cents / 100,
                }))
            }
            transform={(values) => {
                const v: any = { ...values };

                if (v.amount_cents === '' || v.amount_cents == null) {
                    v.amount_cents = undefined;
                } else {
                    const n = Number(v.amount_cents);
                    v.amount_cents = Number.isFinite(n) ? Math.round(n * 100) : undefined;
                }

                if (v.received_at) {
                    v.received_at = String(v.received_at).slice(0, 10);
                }

                if (!v.currency) v.currency = user.currency;
                if (!v.recurring) v.recurring = 'none';
                if (v.notes === '') v.notes = null;

                return v;
            }}
            fields={[
                { name: 'received_at', label: 'Received At', type: 'date' },
                { name: 'amount_cents', label: 'Amount', type: 'number' },
                {
                    name: 'currency',
                    label: 'Currency',
                    type: 'select',
                    options: CURRENCIES.map((c) => ({ label: c, value: c })),
                },
                {
                    name: 'source',
                    label: 'Source',
                    type: 'select',
                    options: [
                        { label: 'Salary', value: 'salary' },
                        { label: 'Freelance', value: 'freelance' },
                        { label: 'Bonus', value: 'bonus' },
                        { label: 'Dividend', value: 'dividend' },
                        { label: 'Interest', value: 'interest' },
                        { label: 'Gift', value: 'gift' },
                        { label: 'Other', value: 'other' },
                    ],
                },
                {
                    name: 'recurring',
                    label: 'Recurring',
                    type: 'select',
                    options: [
                        { label: 'None', value: 'none' },
                        { label: 'Weekly', value: 'weekly' },
                        { label: 'Monthly', value: 'monthly' },
                        { label: 'Yearly', value: 'yearly' },
                    ],
                },
                { name: 'notes', label: 'Notes', type: 'text', required: false },
            ]}
            columns={[
                { field: 'id', headerName: 'ID', width: 80 },
                { field: 'received_at', headerName: 'Received At', flex: 1 },
                {
                    field: 'amount_cents',
                    headerName: 'Amount',
                    flex: 1,
                    type: 'number',
                    renderCell: (p: any) => {
                        const v = p?.value;
                        if (v == null || v === '') return '';
                        const cur = p?.row?.currency ?? '';
                        return `${Number(v).toFixed(2)} ${cur}`;
                    },
                },
                { field: 'currency', headerName: 'Currency', width: 120 },
                { field: 'source', headerName: 'Source', width: 140 },
                { field: 'recurring', headerName: 'Recurring', width: 130 },
                { field: 'notes', headerName: 'Notes', flex: 1 },

                // ── Insights ──────────────────────────────────────────────────────────
                {
                    field: '__ins.moneyUserThisMonth',
                    headerName: `This month (${user.currency})`,
                    width: 180,
                    valueGetter: (p: any) => p?.row?.__ins?.moneyUserThisMonth ?? 0,
                    renderCell: (p: any) => {
                        const v = p?.row?.__ins?.moneyUserThisMonth as number | undefined;
                        if (v == null) return '—';
                        return `${v.toFixed(2)} ${user.currency}`;
                    },
                    sortable: false,
                },
                {
                    field: '__ins.hoursThisMonth',
                    headerName: 'Hours/mo (h)',
                    width: 140,
                    valueGetter: (p: any) => p?.row?.__ins?.hoursThisMonth ?? null,
                    renderCell: (p: any) => fmtH(p?.row?.__ins?.hoursThisMonth),
                    sortable: false,
                },
            ]}
        />
        </>
    );
}
