import GenericCrudPage from '@/components/GenericCrudPage';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/store/auth.store';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import { useNavigate } from 'react-router-dom';
import {GridActionsCellItem} from "@mui/x-data-grid";

const CURRENCIES = ['RON','EUR','USD','GBP','CHF'] as const;

export default function GoalCrudPage() {
    const user = useAuth((s) => s.user)!;
    const nav = useNavigate();
    return (
        <GenericCrudPage
            title="Goals"
            fetchList={() =>
                apiFetch(`/api/users/${user.id}/goals`) as Promise<{
                    id: number;
                    name: string;
                    target_amount_cents: number | null;
                    target_hours: number | null;
                    deadline_date: string | null;
                    priority: number;
                    status: 'active' | 'paused' | 'done' | 'cancelled';
                    currency: string;
                }[]>
            }
            createItem={(data) =>
                apiFetch(`/api/users/${user.id}/goals`, {
                    method: 'POST',
                    body: JSON.stringify(data),
                    headers: { 'Content-Type': 'application/json' },
                })
            }
            updateItem={(id, data) =>
                apiFetch(`/api/users/${user.id}/goals/${id}`, {
                    method: 'PUT',
                    body: JSON.stringify(data),
                    headers: { 'Content-Type': 'application/json' },
                })
            }
            deleteItem={(id) =>
                apiFetch(`/api/users/${user.id}/goals/${id}`, { method: 'DELETE' })
            }

            formatRows={(rows) =>
                rows.map(r => ({
                    ...r,
                    target_amount_cents:
                        r.target_amount_cents == null ? null : r.target_amount_cents / 100,
                }))
            }

            createDefaults={{
                currency: user.currency,
                priority: 3,
                status: 'active',
            }}

            transform={(values) => {
                const v = { ...values };

                const rawAmt: unknown = (v as any).target_amount_cents;
                if (rawAmt === '' || rawAmt == null) {
                    v.target_amount_cents = null;
                } else {
                    const n = Number(rawAmt);
                    v.target_amount_cents = Number.isFinite(n) ? Math.round(n * 100) : null;
                }

                const rawHours: unknown = (v as any).target_hours;
                if (rawHours === '' || rawHours == null) {
                    v.target_hours = null;
                } else {
                    const n = Number(rawHours);
                    v.target_hours = Number.isFinite(n) ? n : null;
                }

                if (v.deadline_date) v.deadline_date = String(v.deadline_date).slice(0, 10);
                if (!v.currency) v.currency = user.currency;

                return v;
            }}

            fields={[
                { name: 'name',                 label: 'Name',           type: 'text' },
                { name: 'target_amount_cents',  label: 'Target Amount',  type: 'number' },
                { name: 'target_hours',         label: 'Target Hours',   type: 'number'},
                { name: 'deadline_date',        label: 'Deadline',       type: 'date' },
                {
                    name: 'priority',
                    label: 'Priority',
                    type: 'select',
                    options: [
                        { label: '1', value: 1 },
                        { label: '2', value: 2 },
                        { label: '3', value: 3 },
                        { label: '4', value: 4 },
                        { label: '5', value: 5 },
                    ],
                },
                {
                    name: 'status',
                    label: 'Status',
                    type: 'select',
                    options: [
                        { label: 'Active',    value: 'active' },
                        { label: 'Paused',    value: 'paused' },
                        { label: 'Done',      value: 'done' },
                        { label: 'Cancelled', value: 'cancelled' },
                    ],
                },
                {
                    name: 'currency',
                    label: 'Currency',
                    type: 'select',
                    options: CURRENCIES.map((c) => ({ label: c, value: c })),
                },
            ]}

            columns={[
                { field: 'id', headerName: 'ID', width: 80 },
                { field: 'name', headerName: 'Name', flex: 1 },
                {
                    field: 'target_amount_cents',
                    headerName: 'Target Amount',
                    flex: 1,
                    renderCell: (p: any) => {
                        const v = p.value;
                        if (v == null) return '';
                        const cur = p.row?.currency ?? '';
                        return `${Number(v).toFixed(2)} ${cur}`;
                    },
                },
                { field: 'target_hours',  headerName: 'Target Hours', width: 140 },
                { field: 'deadline_date', headerName: 'Deadline', flex: 1 },
                { field: 'priority',      headerName: 'Priority', width: 110 },
                { field: 'status',        headerName: 'Status',   width: 130 },
                { field: 'currency',      headerName: 'Currency', width: 120 },
            ]}

            rowActions={(row) => [
                <GridActionsCellItem
                    key="contrib"
                    icon={<ReceiptLongIcon />}
                    label="Contributions"
                    onClick={() => nav(`/goals/${(row as any).id}/contributions`)}
                    showInMenu
                />
            ]}

        />
    );
}
