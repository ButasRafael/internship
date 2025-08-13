import GenericCrudPage from '@/components/GenericCrudPage';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/store/auth.store';
import dayjs from 'dayjs';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { useNavigate } from 'react-router-dom';
import { GridActionsCellItem } from '@mui/x-data-grid';

const CURRENCIES = ['RON','EUR','USD','GBP','CHF'] as const;

export default function BudgetCrudPage() {
    const user = useAuth((s) => s.user)!;
    const nav = useNavigate();
    return (
        <GenericCrudPage
            title="Budgets"
            fetchList={() =>
                apiFetch(`/api/users/${user.id}/budgets`) as Promise<{
                    id: number;
                    period_start: string;
                    period_end: string;
                    currency: string;
                }[]>
            }
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
    );
}
