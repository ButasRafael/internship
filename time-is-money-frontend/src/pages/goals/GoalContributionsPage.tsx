// src/pages/GoalContributionsPage.tsx
import { useParams, useNavigate } from 'react-router-dom';
import GenericCrudPage from '@/components/GenericCrudPage';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/store/auth.store';
import dayjs from 'dayjs';
import { Button } from '@mui/material';
import * as React from 'react';
import { useMemo } from 'react';
import { fx } from '@/lib/fx';
import { fmtH, goalContributionInsight } from '@/lib/insights';

type Goal = { id: number; currency: string };
type ContributionRow = {
    id: number;
    contributed_at: string | null;
    amount_cents: number | null; // stored as cents from API
    hours: number | null;
    source_type: string;
};

type ContributionRowUI = ContributionRow & {
    __ins?: {
        moneyUser: number;
        hoursFromMoney: number | null;
        hoursNative: number;
        hoursTotal: number | null;
    };
};

export default function GoalContributionsPage() {
    const { goalId = '' } = useParams();
    const gid = Number(goalId);
    const user = useAuth((s) => s.user)!;
    const nav = useNavigate();

    const [goal, setGoal] = React.useState<Goal | null>(null);
    React.useEffect(() => {
        (async () => {
            try {
                const g = (await apiFetch(`/api/users/${user.id}/goals/${gid}`)) as Goal;
                setGoal(g);
            } catch {}
        })();
    }, [user.id, gid]);

    const ctx = useMemo(
        () => ({
            userCurrency: user.currency,
            hourlyRate: user.hourly_rate ?? null,
            fx: (from: string, to: string, date: Date) => fx(from, to, date),
        }),
        [user.currency, user.hourly_rate]
    );

    return (
        <>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <Button variant="outlined" onClick={() => nav('/goals')}>
                    ← Back to Goals
                </Button>
            </div>

            <GenericCrudPage<ContributionRowUI>
                key={`${user.hourly_rate ?? 'NA'}-${user.currency}-${gid}`}
                title={`Contributions ${goal ? `(${goal.currency})` : ''}`}

                fetchList={async () => {
                    // ensure goal for currency
                    const g = goal ?? ((await apiFetch(`/api/users/${user.id}/goals/${gid}`)) as Goal);
                    if (!goal) setGoal(g);

                    const rows = (await apiFetch(
                        `/api/users/${user.id}/goals/${gid}/contributions`
                    )) as ContributionRow[];

                    // do not scale here; insights use raw cents
                    return await Promise.all(
                        rows.map(async (r) => {
                            const ins = await goalContributionInsight(
                                {
                                    contributed_at: r.contributed_at,
                                    amount_cents: r.amount_cents, // raw cents
                                    hours: r.hours,
                                },
                                g.currency,
                                ctx
                            );

                            return {
                                ...r,
                                __ins: ins,
                            } as ContributionRowUI;
                        })
                    );
                }}

                createItem={(data) =>
                    apiFetch(`/api/users/${user.id}/goals/${gid}/contributions`, {
                        method: 'POST',
                        body: JSON.stringify(data),
                        headers: { 'Content-Type': 'application/json' },
                    })
                }
                updateItem={(id, data) =>
                    apiFetch(`/api/users/${user.id}/goals/${gid}/contributions/${id}`, {
                        method: 'PUT',
                        body: JSON.stringify(data),
                        headers: { 'Content-Type': 'application/json' },
                    })
                }
                deleteItem={(id) =>
                    apiFetch(`/api/users/${user.id}/goals/${gid}/contributions/${id}`, {
                        method: 'DELETE',
                    })
                }

                // user-friendly presentation
                formatRows={(rows) =>
                    rows.map((r) => ({
                        ...r,
                        amount_cents: r.amount_cents == null ? null : r.amount_cents / 100,
                        contributed_at: r.contributed_at ? String(r.contributed_at).slice(0, 10) : null,
                    }))
                }

                transform={(values) => {
                    const v: any = { ...values };
                    if (!v.contributed_at) delete v.contributed_at;
                    else v.contributed_at = String(v.contributed_at).slice(0, 10);

                    if (v.amount_cents === '' || v.amount_cents == null) v.amount_cents = null;
                    else {
                        const n = Number(v.amount_cents);
                        v.amount_cents = Number.isFinite(n) ? Math.round(n * 100) : null; // back to cents
                    }

                    if (v.hours === '' || v.hours == null) v.hours = null;
                    else {
                        const h = Number(v.hours);
                        v.hours = Number.isFinite(h) ? h : null;
                    }

                    return v;
                }}

                createDefaults={{
                    contributed_at: dayjs().format('YYYY-MM-DD'),
                    amount_cents: null,
                    hours: null,
                    source_type: 'manual',
                }}

                fields={[
                    { name: 'contributed_at', label: 'When', type: 'date', required: false },
                    { name: 'amount_cents', label: 'Amount', type: 'number', required: false },
                    { name: 'hours', label: 'Hours', type: 'number', required: false },
                    {
                        name: 'source_type',
                        label: 'Source',
                        type: 'select',
                        options: [
                            { label: 'Income', value: 'income' },
                            { label: 'Expense cut', value: 'expense_cut' },
                            { label: 'Activity saving', value: 'activity_saving' },
                            { label: 'Manual', value: 'manual' },
                        ],
                    },
                ]}

                columns={[
                    { field: 'id', headerName: 'ID', width: 80 },
                    { field: 'contributed_at', headerName: 'When', width: 140 },
                    {
                        field: 'amount_cents',
                        headerName: 'Amount',
                        width: 160,
                        type: 'number',
                        renderCell: (p: any) =>
                            p.value == null ? '' : `${Number(p.value).toFixed(2)} ${goal?.currency ?? ''}`,
                    },
                    { field: 'hours', headerName: 'Hours (native)', width: 140 },
                    { field: 'source_type', headerName: 'Source', width: 140 },

                    // Insights (hours only)
                    {
                        field: '__ins.hoursFromMoney',
                        headerName: 'From amount (h)',
                        width: 150,
                        valueGetter: (p: any) => p?.row?.__ins?.hoursFromMoney ?? null,
                        renderCell: (p: any) => fmtH(p?.row?.__ins?.hoursFromMoney),
                        sortable: false,
                    },
                    {
                        field: '__ins.hoursTotal',
                        headerName: 'Total (h)',
                        width: 130,
                        valueGetter: (p: any) => p?.row?.__ins?.hoursTotal ?? null,
                        renderCell: (p: any) => fmtH(p?.row?.__ins?.hoursTotal),
                        sortable: false,
                    },
                ]}
            />
        </>
    );
}
