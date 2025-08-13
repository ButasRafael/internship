import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useState } from 'react'
import { Link as RRLink, useNavigate } from 'react-router-dom'
import { API } from '@/lib/api'
import TimeIsMoneyAuthShell from '@/components/ui/TimeIsMoneyAuthShell'

const schema = z.object({
    email: z.string().email(),
    password: z.string().min(8, 'Min 8 characters'),
})
type FormData = z.infer<typeof schema>

function GoogleSvg() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
            <path d="M15.545 6.558a9.42 9.42 0 0 1 .139 1.626c0 2.434-.87 4.492-2.384 5.885h.002C11.978 15.292 10.158 16 8 16A8 8 0 1 1 8 0a7.689 7.689 0 0 1 5.352 2.082l-2.284 2.284A4.347 4.347 0 0 0 8 3.166c-2.087 0-3.86 1.408-4.492 3.304a4.792 4.792 0 0 0 0 3.063h.003c.635 1.893 2.405 3.301 4.492 3.301 1.078 0 2.004-.276 2.722-.764h-.003a3.702 3.702 0 0 0 1.599-2.431H8v-3.08h7.545z" />
        </svg>
    )
}
function AppleSvg() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
            <path d="M11.182.008C11.148-.03 9.923.023 8.857 1.18c-1.066 1.156-.902 2.482-.878 2.516.024.034 1.52.087 2.475-1.258.955-1.345.762-2.391.728-2.43Zm3.314 11.733c-.048-.096-2.325-1.234-2.113-3.422.212-2.189 1.675-2.789 1.698-2.854.023-.065-.597-.79-1.254-1.157a3.692 3.692 0 0 0-1.563-.434c-.108-.003-.483-.095-1.254.116-.508.139-1.653.589-1.968.607-.316.018-1.256-.522-2.267-.665-.647-.125-1.333.131-1.824.328-.49.196-1.422.754-2.074 2.237-.652 1.482-.311 3.83-.067 4.56.244.729.625 1.924 1.273 2.796.576.984 1.34 1.667 1.659 1.899.319.232 1.219.386 1.843.067.502-.308 1.408-.485 1.766-.472.357.013 1.061.154 1.782.539.571.197 1.111.115 1.652-.105.541-.221 1.324-1.059 2.238-2.758.347-.79.505-1.217.473-1.282Z" />
        </svg>
    )
}
function FacebookSvg() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
            <path d="M16 8.049c0-4.446-3.582-8.05-8-8.05C3.58 0-.002 3.603-.002 8.05c0 4.017 2.926 7.347 6.75 7.951v-5.625h-2.03V8.05H6.75V6.275c0-2.017 1.195-3.131 3.022-3.131.876 0 1.791.157 1.791.157v1.98h-1.009c-.993 0-1.303.621-1.303 1.258v1.51h2.218l-.354 2.326H9.25V16c3.824-.604 6.75-3.934 6.75-7.951z" />
        </svg>
    )
}
function MailSvg() {
    return (
        <svg className="icon-email" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20">
            <path d="M19,1H5A5.006,5.006,0,0,0,0,6V18a5.006,5.006,0,0,0,5,5H19a5.006,5.006,0,0,0,5-5V6A5.006,5.006,0,0,0,19,1ZM5,3H19a3,3,0,0,1,2.78,1.887l-7.658,7.659a3.007,3.007,0,0,1-4.244,0L2.22,4.887A3,3,0,0,1,5,3ZM19,21H5a3,3,0,0,1-3-3V7.5L8.464,13.96a5.007,5.007,0,0,0,7.072,0L22,7.5V18A3,3,0,0,1,19,21Z" />
        </svg>
    )
}
function LockSvg() {
    return (
        <svg className="icon-email" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20">
            <path d="M17 9V7a5 5 0 0 0-10 0v2H5v12h14V9h-2Zm-8 0V7a3 3 0 0 1 6 0v2H9Zm3 5a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
        </svg>
    )
}

export default function Register() {
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<FormData>({ resolver: zodResolver(schema) })
    const [ok, setOk] = useState(false)
    const [err, setErr] = useState<string | null>(null)
    const nav = useNavigate()

    async function onSubmit(values: FormData) {
        setErr(null)
        setOk(false)
        const res = await fetch(`${API}/auth/register`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(values),
        })
        if (res.status === 201) {
            setOk(true)
            setTimeout(() => nav('/login'), 1200)
        } else if (res.status === 409) {
            setErr('Email already exists')
        } else {
            const body = await res.json().catch(() => ({}))
            setErr((body as any)?.error || 'Registration failed')
        }
    }

    return (
        <TimeIsMoneyAuthShell title="Create account" subtitle="Start growing with Time-is-Money" activeTab="register">
            {ok && (
                <div
                    style={{
                        width: 330,
                        margin: '10px auto 0',
                        fontSize: 12,
                        color: '#3c763d',
                        background: '#dff0d8',
                        border: '1px solid #d6e9c6',
                        borderRadius: 6,
                        padding: '8px 10px',
                        textAlign: 'left',
                    }}
                >
                    Account created. We sent you a verification link—please check your email.
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
                    <MailSvg />
                    <div className="be-main"></div>
                    <div className="input-box">
                        <input className="input" type="email" placeholder=" " {...register('email')} required />
                        <label>Email Address</label>
                    </div>
                    <span style={{ width: 16 }} />
                </div>
                {errors.email?.message && (
                    <div style={{ width: 330, margin: '6px auto 0', fontSize: 11, color: '#a94442', textAlign: 'left' }}>
                        {errors.email.message}
                    </div>
                )}

                <div className="input-main">
                    <LockSvg />
                    <div className="be-main"></div>
                    <div className="input-box">
                        <input className="input" type="password" placeholder=" " {...register('password')} required />
                        <label>Password</label>
                    </div>
                    <span style={{ width: 16 }} />
                </div>
                {errors.password?.message && (
                    <div style={{ width: 330, margin: '6px auto 0', fontSize: 11, color: '#a94442', textAlign: 'left' }}>
                        {errors.password.message}
                    </div>
                )}

                <button className="continue" type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Creating…' : 'Continue'}
                </button>
            </form>

            <div className="title-social">Or Continue With</div>
            <div className="with-social">
                <div className="social google">
                    <GoogleSvg />
                </div>
                <div className="social apple">
                    <AppleSvg />
                </div>
                <div className="social facebook">
                    <FacebookSvg />
                </div>
            </div>

            <p className="paragraph-description">
                Already have an account?{' '}
                <RRLink to="/login" style={{ color: '#0266ff', textDecoration: 'none' }}>
                    Sign in
                </RRLink>
            </p>
        </TimeIsMoneyAuthShell>
    )
}
