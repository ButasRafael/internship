import { useMemo } from 'react';
import GenericCrudPage from '@/components/GenericCrudPage';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/store/auth.store';
import { Stack, Typography } from '@mui/material';
import { fx } from '@/lib/fx';

import { currentMonthKey, fmtH, selectCategoryTimeInsight, type CategoryTimeInsight } from '@/lib/insights';
import {
    runEngine,
    type EngineContext,
    type ActivityRow,
    type ExpenseRow,
    type ObjectRow,
} from '@/lib/time-engine';

type CategoryRow = {
    id: number;
    name: string;
    kind: 'expense' | 'object' | 'activity' | 'mixed';
};

type CategoryRowUI = CategoryRow & {
    __ins?: CategoryTimeInsight;
};

export default function CategoryCrudPage() {
    const user = useAuth((s) => s.user)!;

    const month = currentMonthKey();
    const keyBuster = useMemo(
        () => `${user.hourly_rate ?? 'NA'}-${user.currency}-${month}`,
        [user.hourly_rate, user.currency, month]
    );

    // Stable engine context for this page
    const ctx: EngineContext = useMemo(
        () => ({
            userCurrency: user.currency,
            hourlyRate: user.hourly_rate ?? null,
            fx: (from: string, to: string, date: Date) => fx(from, to, date),
            amortizeOneTimeMonths: 6,
            amortizeCapexMonths: 6,
        }),
        [user.currency, user.hourly_rate]
    );

    return (
        <>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary">
                    {user.hourly_rate
                        ? `Rate: ${user.hourly_rate}/h · ${user.currency}`
                        : 'Set hourly rate to value category costs in hours'}
                </Typography>
            </Stack>

            <GenericCrudPage<CategoryRowUI>
                key={keyBuster}
                title="Categories"
                fetchList={async () => {
                    const [cats, objects, activities, expenses] = await Promise.all([
                        apiFetch<CategoryRow[]>(`/api/users/${user.id}/categories`),
                        apiFetch<ObjectRow[]>(`/api/users/${user.id}/objects`),
                        apiFetch<ActivityRow[]>(`/api/users/${user.id}/activities`),
                        apiFetch<ExpenseRow[]>(`/api/users/${user.id}/expenses`),
                    ]);

                    // Run the engine for this single-month window (no server aggregate endpoint needed)
                    const agg = await runEngine({
                        months: [month],
                        ctx,
                        incomeRows: [], // incomes not needed for category time insights
                        expenseRows: expenses ?? [],
                        objectRows: objects ?? [],
                        activityRows: activities ?? [],
                    });

                    return cats.map((c) => ({
                        ...c,
                        __ins: selectCategoryTimeInsight(agg, month, c.id),
                    })) as CategoryRowUI[];
                }}
                createItem={(data) =>
                    apiFetch(`/api/users/${user.id}/categories`, {
                        method: 'POST',
                        body: JSON.stringify(data),
                        headers: { 'Content-Type': 'application/json' },
                    })
                }
                updateItem={(id, data) =>
                    apiFetch(`/api/users/${user.id}/categories/${id}`, {
                        method: 'PUT',
                        body: JSON.stringify(data),
                        headers: { 'Content-Type': 'application/json' },
                    })
                }
                deleteItem={(id) =>
                    apiFetch(`/api/users/${user.id}/categories/${id}`, { method: 'DELETE' })
                }
                createDefaults={{ kind: 'expense' }}
                transform={(values) => ({
                    ...values,
                    name: typeof values.name === 'string' ? values.name.trim() : values.name,
                })}
                fields={[
                    { name: 'name', label: 'Name', type: 'text' },
                    {
                        name: 'kind',
                        label: 'Kind',
                        type: 'select',
                        options: [
                            { label: 'Expense', value: 'expense' },
                            { label: 'Object', value: 'object' },
                            { label: 'Activity', value: 'activity' },
                            { label: 'Mixed', value: 'mixed' },
                        ],
                    },
                ]}
                columns={[
                    { field: 'id', headerName: 'ID', width: 90 },
                    { field: 'name', headerName: 'Name', flex: 1 },
                    { field: 'kind', headerName: 'Kind', width: 140 },
                    {
                        field: '__ins.savedH',
                        headerName: 'Saved/mo (h)',
                        width: 140,
                        valueGetter: (p: any) => p?.row?.__ins?.savedH ?? 0,
                        renderCell: (p: any) => fmtH(p?.row?.__ins?.savedH),
                        sortable: false,
                    },
                    {
                        field: '__ins.costH',
                        headerName: 'Cost/mo (h)',
                        width: 140,
                        valueGetter: (p: any) => p?.row?.__ins?.costH ?? null,
                        renderCell: (p: any) => fmtH(p?.row?.__ins?.costH),
                        sortable: false,
                    },
                    {
                        field: '__ins.netH',
                        headerName: 'Net/mo (h)',
                        width: 140,
                        valueGetter: (p: any) => p?.row?.__ins?.netH ?? null,
                        renderCell: (p: any) => {
                            const v = p?.row?.__ins?.netH as number | null | undefined;
                            return (
                                <span
                                    style={{
                                        color:
                                            v != null && v <= 0
                                                ? 'var(--mui-palette-success-main)'
                                                : 'var(--mui-palette-error-main)',
                                    }}
                                >
                  {fmtH(v)}
                </span>
                            );
                        },
                        sortable: false,
                    },
                ]}
            />
        </>
    );
}
