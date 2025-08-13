import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import GenericCrudPage from '@/components/GenericCrudPage';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/store/auth.store';
import { Button } from '@mui/material';

type Category = { id:number; name:string; kind:'expense'|'object'|'activity'|'mixed' };
type AllocationRow = { id:number; category_id:number; amount_cents:number };
type Budget = { id:number; currency:string };

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
            } catch { /* ignore */ }
        })();
    }, [user.id, bid]);

    const catOptions = useMemo(()=>cats.map(c=>({label:c.name, value:c.id})),[cats]);
    const catNameById = useMemo(()=>Object.fromEntries(catOptions.map(o=>[o.value,o.label] as const)),[catOptions]);

    return (
        <>
            <div style={{display:'flex', gap:8, marginBottom:8}}>
                <Button variant="outlined" onClick={()=>nav('/budgets')}>← Back to Budgets</Button>
            </div>
            <GenericCrudPage<AllocationRow>
                title={`Allocations ${budget ? `(${budget.currency})` : ''}`}
                fetchList={() => apiFetch(`/api/users/${user.id}/budgets/${bid}/allocations`) as Promise<AllocationRow[]>}
                createItem={(data) => apiFetch(`/api/users/${user.id}/budgets/${bid}/allocations`, { method:'POST', body: JSON.stringify(data), headers:{'Content-Type':'application/json'} })}
                updateItem={(id, data) => apiFetch(`/api/users/${user.id}/budgets/${bid}/allocations/${id}`, { method:'PUT', body: JSON.stringify(data), headers:{'Content-Type':'application/json'} })}
                deleteItem={(id) => apiFetch(`/api/users/${user.id}/budgets/${bid}/allocations/${id}`, { method:'DELETE' })}

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
                ]}
            />
        </>
    );
}
