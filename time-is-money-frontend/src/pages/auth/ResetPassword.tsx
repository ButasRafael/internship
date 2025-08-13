import { useSearchParams, Link as RRLink, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useState } from 'react'
import { API } from '@/lib/api'
import TimeIsMoneyAuthShell from '@/components/ui/TimeIsMoneyAuthShell'

const schema = z.object({ password: z.string().min(8, 'Min 8 characters') })
type FormData = z.infer<typeof schema>

function LockSvg() {
    return (
        <svg className="icon-email" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20">
            <path d="M17 9V7a5 5 0 0 0-10 0v2H5v12h14V9h-2Zm-8 0V7a3 3 0 0 1 6 0v2H9Zm3 5a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
        </svg>
    )
}

export default function ResetPassword() {
    const [params] = useSearchParams()
    const token = params.get('token')
    const nav = useNavigate()
    const [err, setErr] = useState<string | null>(null)

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<FormData>({ resolver: zodResolver(schema) })

    async function onSubmit(values: FormData) {
        setErr(null)
        const res = await fetch(`${API}/auth/password-reset/${token}`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(values),
        })
        if (res.status === 204) nav('/login')
        else setErr('Invalid or expired token')
    }

    return (
        <TimeIsMoneyAuthShell title="Choose a new password" subtitle="Secure your account with a fresh password">
            {!token && (
                <div
                    style={{
                        width: 330,
                        margin: '10px auto 0',
                        fontSize: 12,
                        color: '#8a6d3b',
                        background: '#fcf8e3',
                        border: '1px solid #faebcc',
                        borderRadius: 6,
                        padding: '8px 10px',
                        textAlign: 'left',
                    }}
                >
                    Missing token.
                </div>
            )}
            {err && (
                <div
                    style={{
                        width: 330,
                        margin: '10px auto 0',
                        fontSize: 12,
                        color: '#a94442',
                        background: '#f2dede',
                        border: '1px solid #ebccd1',
                        borderRadius: 6,
                        padding: '8px 10px',
                        textAlign: 'left',
                    }}
                >
                    {err}
                </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="form-detalis" style={{ marginTop: 0 }}>
                <div className="input-main">
                    <LockSvg />
                    <div className="be-main"></div>
                    <div className="input-box">
                        <input className="input" type="password" placeholder=" " {...register('password')} required />
                        <label>New password</label>
                    </div>
                    <span style={{ width: 16 }} />
                </div>

                {errors.password?.message && (
                    <div style={{ width: 330, margin: '6px auto 0', fontSize: 11, color: '#a94442', textAlign: 'left' }}>
                        {errors.password.message}
                    </div>
                )}

                <button className="continue" type="submit" disabled={isSubmitting || !token}>
                    {isSubmitting ? 'Saving…' : 'Set password'}
                </button>
            </form>

            <p className="paragraph-description">
                <RRLink to="/login" style={{ color: '#0266ff', textDecoration: 'none' }}>
                    Back to login
                </RRLink>
            </p>
        </TimeIsMoneyAuthShell>
    )
}
