// src/pages/BudgetCrudPage.tsx
import GenericCrudPage from '@/components/GenericCrudPage';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/store/auth.store';
import dayjs from 'dayjs';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { useNavigate } from 'react-router-dom';
import { GridActionsCellItem } from '@mui/x-data-grid';
import { Stack, Typography } from '@mui/material';
import { fx } from '@/lib/fx';
import { allocationHoursTotalForBudget, fmtH } from '@/lib/insights';
import { useMemo } from 'react';

const CURRENCIES = ['RON','EUR','USD','GBP','CHF'] as const;

type BudgetRow = {
    id: number;
    period_start: string;
    period_end: string;
    currency: string;
};

type AllocationRow = { id: number; category_id: number; amount_cents: number };

type BudgetRowUI = BudgetRow & {
    __ins?: {
        hoursTotal: number | null;
        hoursPerMonth: number | null;
    };
};

export default function BudgetCrudPage() {
    const user = useAuth((s) => s.user)!;
    const nav = useNavigate();

    const ctx = useMemo(() => ({
        userCurrency: user.currency,
        hourlyRate: user.hourly_rate ?? null,
        fx: (from: string, to: string, date: Date) => fx(from, to, date),
    }), [user.currency, user.hourly_rate]);

    return (
        <>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary">
                    {user.hourly_rate
                        ? `Rate: ${user.hourly_rate}/h · ${user.currency}`
                        : 'Set hourly rate to value allocations in hours'}
                </Typography>
            </Stack>

            <GenericCrudPage<BudgetRowUI>
                key={`${user.hourly_rate ?? 'NA'}-${user.currency}`}
                title="Budgets"
                fetchList={async () => {
                    const budgets = await apiFetch<BudgetRow[]>(`/api/users/${user.id}/budgets`);

                    return await Promise.all(
                        budgets.map(async (b) => {
                            const allocs = await apiFetch<AllocationRow[]>(
                                `/api/users/${user.id}/budgets/${b.id}/allocations`
                            );

                            const hoursTotal = await allocationHoursTotalForBudget(
                                allocs.map((a) => ({ amount_cents: a.amount_cents })),
                                { currency: b.currency, period_start: b.period_start },
                                ctx
                            );

                            const months =
                                dayjs(b.period_end).startOf('month').diff(dayjs(b.period_start).startOf('month'), 'month') + 1;
                            const hoursPerMonth = hoursTotal == null ? null : hoursTotal / Math.max(1, months);

                            return { ...b, __ins: { hoursTotal, hoursPerMonth } } as BudgetRowUI;
                        })
                    );
                }}
                createItem={(data) =>
                    apiFetch(`/api/users/${user.id}/budgets`, {
                        method: 'POST',
                        body: JSON.stringify(data),
                        headers: { 'Content-Type': 'application/json' },
                    })
                }
                updateItem={(id, data) =>
                    apiFetch(`/api/users/${user.id}/budgets/${id}`, {
                        method: 'PUT',
                        body: JSON.stringify(data),
                        headers: { 'Content-Type': 'application/json' },
                    })
                }
                deleteItem={(id) =>
                    apiFetch(`/api/users/${user.id}/budgets/${id}`, { method: 'DELETE' })
                }
                createDefaults={() => ({
                    currency: user.currency,
                    period_start: dayjs().startOf('month').format('YYYY-MM-DD'),
                    period_end:   dayjs().endOf('month').format('YYYY-MM-DD'),
                })}
                transform={(values) => ({
                    ...values,
                    currency: (values.currency as string) || user.currency,
                    period_start: values.period_start
                        ? String(values.period_start).slice(0, 10)
                        : undefined,
                    period_end: values.period_end
                        ? String(values.period_end).slice(0, 10)
                        : undefined,
                })}
                fields={[
                    { name: 'period_start', label: 'Period Start', type: 'date' },
                    { name: 'period_end',   label: 'Period End',   type: 'date' },
                    {
                        name: 'currency',
                        label: 'Currency',
                        type: 'select',
                        options: CURRENCIES.map((c) => ({ label: c, value: c })),
                    },
                ]}
                columns={[
                    { field: 'id', headerName: 'ID', width: 80 },
                    { field: 'period_start', headerName: 'Start', flex: 1 },
                    { field: 'period_end',   headerName: 'End',   flex: 1 },
                    { field: 'currency',     headerName: 'Currency', width: 120 },

                    {
                        field: '__ins.hoursTotal',
                        headerName: 'Hours (h)',
                        width: 140,
                        valueGetter: (p:any) => p?.row?.__ins?.hoursTotal ?? null,
                        renderCell: (p:any) => fmtH(p?.row?.__ins?.hoursTotal),
                        sortable: false,
                    },
                    {
                        field: '__ins.hoursPerMonth',
                        headerName: 'Avg/mo (h)',
                        width: 140,
                        valueGetter: (p:any) => p?.row?.__ins?.hoursPerMonth ?? null,
                        renderCell: (p:any) => fmtH(p?.row?.__ins?.hoursPerMonth),
                        sortable: false,
                    },
                ]}
                rowActions={(row) => [
                    <GridActionsCellItem
                        key="alloc"
                        icon={<OpenInNewIcon />}
                        label="Manage allocations"
                        onClick={() => nav(`/budgets/${(row as any).id}/allocations`)}
                        showInMenu
                    />
                ]}
            />
        </>
    );
}
