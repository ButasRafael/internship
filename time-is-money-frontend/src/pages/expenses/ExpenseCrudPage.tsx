import { useMemo } from 'react';
import GenericCrudPage from '@/components/GenericCrudPage';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/store/auth.store';

import { Stack, Typography } from '@mui/material';
import { fx } from '@/lib/fx';
import { currentMonthKey, expenseHoursThisMonth, fmtH } from '@/lib/insights';

const CURRENCIES = ['RON', 'EUR', 'USD', 'GBP', 'CHF'] as const;

type ExpenseRow = {
    id: number;
    name: string;
    amount_cents: number;
    currency: string;
    frequency: 'once' | 'weekly' | 'monthly' | 'yearly';
    start_date: string;
    end_date: string | null;
};

type ExpenseRowUI = ExpenseRow & {
    __ins?: {
        hoursThisMonth: number | null;
    };
};

export default function ExpenseCrudPage() {
    const user = useAuth((s) => s.user)!;

    const ctx = useMemo(
        () => ({
            userCurrency: user.currency,
            hourlyRate: user.hourly_rate ?? null,
            fx: (from: string, to: string, date: Date) => fx(from, to, date),
            amortizeOneTimeMonths: 6,
        }),
        [user.currency, user.hourly_rate]
    );

    return (
        <>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary">
                    {ctx.hourlyRate
                        ? `Rate: ${ctx.hourlyRate}/h · ${ctx.userCurrency}`
                        : 'Set hourly rate to value expenses in hours'}
                </Typography>
            </Stack>

            <GenericCrudPage<ExpenseRowUI>
                key={`${user.hourly_rate ?? 'NA'}-${user.currency}-${currentMonthKey()}`}
                title="Expenses"
                fetchList={async () => {
                    const rows = await apiFetch<ExpenseRow[]>(`/api/users/${user.id}/expenses`);
                    const month = currentMonthKey();
                    return await Promise.all(
                        rows.map(async (r) => {
                            const hoursThisMonth = await expenseHoursThisMonth(r, month, ctx);
                            return {
                                ...r,
                                amount_cents: r.amount_cents == null ? 0 : r.amount_cents / 100,
                                __ins: { hoursThisMonth },
                            } as ExpenseRowUI;
                        })
                    );
                }}
                createItem={(data) =>
                    apiFetch(`/api/users/${user.id}/expenses`, {
                        method: 'POST',
                        body: JSON.stringify(data),
                        headers: { 'Content-Type': 'application/json' },
                    })
                }
                updateItem={(id, data) =>
                    apiFetch(`/api/users/${user.id}/expenses/${id}`, {
                        method: 'PUT',
                        body: JSON.stringify(data),
                        headers: { 'Content-Type': 'application/json' },
                    })
                }
                deleteItem={(id) =>
                    apiFetch(`/api/users/${user.id}/expenses/${id}`, { method: 'DELETE' })
                }
                createDefaults={{ currency: user.currency }}
                transform={(values) => {
                    const v: any = { ...values };
                    if (v.amount_cents === '' || v.amount_cents == null) {
                        v.amount_cents = undefined;
                    } else {
                        const n = Number(v.amount_cents);
                        v.amount_cents = Number.isFinite(n) ? Math.round(n * 100) : undefined;
                    }

                    if (v.start_date) v.start_date = String(v.start_date).slice(0, 10);
                    if (v.end_date === '' || v.end_date == null) v.end_date = null;
                    else v.end_date = String(v.end_date).slice(0, 10);

                    if (!v.currency) v.currency = user.currency;

                    return v;
                }}
                fields={[
                    { name: 'name', label: 'Name', type: 'text' },
                    { name: 'amount_cents', label: 'Amount', type: 'number' },
                    {
                        name: 'currency',
                        label: 'Currency',
                        type: 'select',
                        options: CURRENCIES.map((c) => ({ label: c, value: c })),
                    },
                    {
                        name: 'frequency',
                        label: 'Frequency',
                        type: 'select',
                        options: [
                            { label: 'once', value: 'once' },
                            { label: 'weekly', value: 'weekly' },
                            { label: 'monthly', value: 'monthly' },
                            { label: 'yearly', value: 'yearly' },
                        ],
                    },
                    { name: 'start_date', label: 'Start Date', type: 'date' },
                    { name: 'end_date', label: 'End Date', type: 'date', required: false },
                ]}
                columns={[
                    { field: 'id', headerName: 'ID', width: 90 },
                    { field: 'name', headerName: 'Name', flex: 1 },
                    {
                        field: 'amount_cents',
                        headerName: 'Amount',
                        width: 160,
                        type: 'number',
                        renderCell: (p: any) => {
                            const v = p?.value;
                            if (v == null || v === '') return '';
                            const cur = p?.row?.currency ?? '';
                            return `${Number(v).toFixed(2)} ${cur}`;
                        },
                    },
                    { field: 'currency', headerName: 'Currency', width: 120 },
                    { field: 'frequency', headerName: 'Frequency', width: 140 },
                    { field: 'start_date', headerName: 'Start', width: 140 },
                    { field: 'end_date', headerName: 'End', width: 140 },

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
