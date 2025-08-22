// src/pages/BudgetAllocationsPage.tsx
import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import GenericCrudPage from '@/components/GenericCrudPage';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/store/auth.store';
import { Button, Stack, Typography } from '@mui/material';
import { fx } from '@/lib/fx';
import { fmtH, allocationHoursForBudget } from '@/lib/insights';

type Category = { id:number; name:string; kind:'expense'|'object'|'activity'|'mixed' };
type AllocationRow = { id:number; category_id:number; amount_cents:number };
type Budget = { id:number; currency:string; period_start:string; period_end:string };

type AllocationRowUI = AllocationRow & {
    __ins?: { hours: number | null };
};

export default function BudgetAllocationsPage() {
    const { budgetId = '' } = useParams();
    const bid = Number(budgetId);
    const user = useAuth(s=>s.user)!;
    const nav = useNavigate();

    const [cats, setCats] = useState<Category[]>([]);
    const [budget, setBudget] = useState<Budget | null>(null);

    useEffect(() => {
        (async () => {
            try {
                const [c, b] = await Promise.all([
                    apiFetch<Category[]>(`/api/users/${user.id}/categories`),
                    apiFetch<Budget>(`/api/users/${user.id}/budgets/${bid}`),
                ]);
                setCats(c.filter(x => x.kind === 'expense' || x.kind === 'mixed'));
                setBudget(b);
            } catch {}
        })();
    }, [user.id, bid]);

    const catOptions = useMemo(()=>cats.map(c=>({label:c.name, value:c.id})),[cats]);
    const catNameById = useMemo(()=>Object.fromEntries(catOptions.map(o=>[o.value,o.label] as const)),[catOptions]);

    const ctx = useMemo(() => ({
        userCurrency: user.currency,
        hourlyRate: user.hourly_rate ?? null,
        fx: (from:string, to:string, date:Date) => fx(from, to, date),
    }), [user.currency, user.hourly_rate]);

    return (
        <>
            <div style={{display:'flex', gap:8, marginBottom:8}}>
                <Button variant="outlined" onClick={()=>nav('/budgets')}>← Back to Budgets</Button>
            </div>

            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary">
                    {user.hourly_rate
                        ? `Rate: ${user.hourly_rate}/h · ${user.currency}`
                        : 'Set hourly rate to value allocations in hours'}
                </Typography>
            </Stack>

            <GenericCrudPage<AllocationRowUI>
                key={`${user.hourly_rate ?? 'NA'}-${user.currency}-${bid}`}
                title={`Allocations ${budget ? `(${budget.currency})` : ''}`}

                fetchList={async () => {
                    const b = budget ?? await apiFetch<Budget>(`/api/users/${user.id}/budgets/${bid}`);
                    if (!budget) setBudget(b);

                    const rows = await apiFetch<AllocationRow[]>(`/api/users/${user.id}/budgets/${bid}/allocations`);

                    return await Promise.all(rows.map(async (r) => {
                        const hours = await allocationHoursForBudget(
                            { amount_cents: r.amount_cents },
                            { currency: b.currency, period_start: b.period_start },
                            ctx
                        );
                        return { ...r, __ins: { hours } } as AllocationRowUI;
                    }));
                }}

                createItem={(data) =>
                    apiFetch(`/api/users/${user.id}/budgets/${bid}/allocations`, {
                        method:'POST',
                        body: JSON.stringify(data),
                        headers:{'Content-Type':'application/json'}
                    })
                }
                updateItem={(id, data) =>
                    apiFetch(`/api/users/${user.id}/budgets/${bid}/allocations/${id}`, {
                        method:'PUT',
                        body: JSON.stringify(data),
                        headers:{'Content-Type':'application/json'}
                    })
                }
                deleteItem={(id) =>
                    apiFetch(`/api/users/${user.id}/budgets/${bid}/allocations/${id}`, { method:'DELETE' })
                }

                formatRows={(rows)=>rows.map(r=>({ ...r, amount_cents: r.amount_cents/100 }))}

                transform={(values) => {
                    const v:any = {...values};
                    v.category_id = v.category_id == null || v.category_id === '' ? null : Number(v.category_id);
                    if (v.amount_cents === '' || v.amount_cents == null) v.amount_cents = 0;
                    else v.amount_cents = Math.round(Number(v.amount_cents)*100);
                    return v;
                }}

                fields={[
                    { name:'category_id', label:'Category', type:'select', options:catOptions },
                    { name:'amount_cents', label:'Amount', type:'number' },
                ]}

                columns={[
                    { field:'id', headerName:'ID', width:90 },
                    { field:'category_id', headerName:'Category', width:220,
                        valueFormatter:(value)=> {
                            const id = value as number|undefined|null;
                            return id==null ? '' : (catNameById as Record<number,string>)[id] ?? String(id);
                        }
                    },
                    { field:'amount_cents', headerName:'Amount', width:160, type:'number',
                        renderCell:(p:any)=>`${Number(p.value).toFixed(2)} ${budget?.currency ?? ''}`
                    },
                    {
                        field: '__ins.hours',
                        headerName: 'Hours (h)',
                        width: 140,
                        valueGetter: (p:any) => p?.row?.__ins?.hours ?? null,
                        renderCell: (p:any) => fmtH(p?.row?.__ins?.hours),
                        sortable: false,
                    },
                ]}
            />
        </>
    );
}
