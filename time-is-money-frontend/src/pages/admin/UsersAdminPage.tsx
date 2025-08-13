import GenericCrudPage from '@/components/GenericCrudPage'
import { apiFetch } from '@/lib/api'
import { useAuth } from '@/store/auth.store'
import { Chip } from '@mui/material'

const CURRENCIES = ['RON','EUR','USD','GBP','CHF'] as const
const TIMEZONES = ['Europe/Bucharest','UTC','Europe/Berlin','Europe/London','America/New_York','Asia/Tokyo'] as const

const ROLES = [
    { id: 1, name: 'Admin' },
    { id: 2, name: 'User'  },
] as const

const roleOptions = ROLES.map(r => ({ label: r.name, value: r.id }))
const roleNameById = Object.fromEntries(ROLES.map(r => [r.id, r.name] as const)) as Record<number,string>

export default function UsersAdminPage() {
    const can = useAuth(s => s.hasPerm)
    const canManage = can('user_manage')

    return (
        <GenericCrudPage<{
            id: number
            email: string
            role_id: number
            hourly_rate: number | null
            currency: string
            timezone: string
            email_verified: boolean | 0 | 1
            created_at: string
        }>
            title="Users"
            actions={{ create: canManage, edit: canManage, delete: canManage }}

            fetchList={() => apiFetch('/api/users')}
            createItem={(data) => apiFetch('/api/users', {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
            })}
            updateItem={(id, data) => apiFetch(`/api/users/${id}`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
            })}
            deleteItem={(id) => apiFetch(`/api/users/${id}`, { method: 'DELETE' })}

            formatRows={(rows) => rows.map((r:any) => ({ ...r, email_verified: !!r.email_verified }))}

            createDefaults={{
                hourly_rate: null,
                currency: 'RON',
                timezone: 'Europe/Bucharest',
                role_id: 2,
            }}

            transform={(values) => {
                const v: any = { ...values }
                if (v.email) v.email = String(v.email).trim()
                if (v.hourly_rate === '') v.hourly_rate = null
                if (!v.currency) v.currency = 'RON'
                if (!v.timezone) v.timezone = 'Europe/Bucharest'
                if (v.role_id !== undefined && v.role_id !== null) v.role_id = Number(v.role_id)
                if ('email_verified' in v) delete v.email_verified
                return v
            }}

            fields={[
                { name: 'email',          label: 'Email',             type: 'text' },
                { name: 'role_id',        label: 'Role',              type: 'select', options: roleOptions },
                { name: 'hourly_rate',    label: 'Hourly rate',       type: 'number', required: false },
                { name: 'currency',       label: 'Currency',          type: 'select', options: CURRENCIES.map(c => ({ label: c, value: c })) },
                { name: 'timezone',       label: 'Timezone',          type: 'select', options: TIMEZONES.map(tz => ({ label: tz, value: tz })) },
            ]}

            columns={[
                { field: 'id',             headerName: 'ID', width: 80 },
                { field: 'email',          headerName: 'Email', flex: 1 },
                {
                    field: 'role_id',        headerName: 'Role', width: 160,
                    valueFormatter: (value) => roleNameById[value as number] ?? String(value),
                },
                { field: 'hourly_rate',    headerName: 'Hourly', width: 120 },
                { field: 'currency',       headerName: 'Currency', width: 110 },
                { field: 'timezone',       headerName: 'Timezone', width: 180 },
                {
                    field: 'email_verified', headerName: 'Verified', width: 120,
                    renderCell: (p:any) => p?.value
                        ? <Chip size="small" label="Yes" color="success" variant="outlined"/>
                        : <Chip size="small" label="No" variant="outlined"/>
                },
                { field: 'created_at',     headerName: 'Created', width: 180 },
            ]}
        />
    )
}