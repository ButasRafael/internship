import { useState } from 'react'
import { API } from '@/lib/api'
import TimeIsMoneyAuthShell from '@/components/ui/TimeIsMoneyAuthShell'
import { Link as RRLink } from 'react-router-dom'

function MailSvg() {
    return (
        <svg className="icon-email" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20">
            <path d="M19,1H5A5.006,5.006,0,0,0,0,6V18a5.006,5.006,0,0,0,5,5H19a5.006,5.006,0,0,0,5-5V6A5.006,5.006,0,0,0,19,1ZM5,3H19a3,3,0,0,1,2.78,1.887l-7.658,7.659a3.007,3.007,0,0,1-4.244,0L2.22,4.887A3,3,0,0,1,5,3ZM19,21H5a3,3,0,0,1-3-3V7.5L8.464,13.96a5.007,5.007,0,0,0,7.072,0L22,7.5V18A3,3,0,0,1,19,21Z" />
        </svg>
    )
}

export default function ForgotPassword() {
    const [email, setEmail] = useState('')
    const [ok, setOk] = useState(false)
    const [loading, setLoading] = useState(false)

    async function submit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        try {
            await fetch(`${API}/auth/password-reset`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            })
            setOk(true)
        } finally {
            setLoading(false)
        }
    }

    return (
        <TimeIsMoneyAuthShell title="Reset your password" subtitle="We’ll email you a reset link">
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
                    If that email exists, a reset link has been sent.
                </div>
            )}

            <form onSubmit={submit} className="form-detalis" style={{ marginTop: 0 }}>
                <div className="input-main">
                    <MailSvg />
                    <div className="be-main"></div>
                    <div className="input-box">
                        <input
                            className="input"
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                            placeholder=" "
                        />
                        <label>Email Address</label>
                    </div>
                    <span style={{ width: 16 }} />
                </div>

                <button className="continue" type="submit" disabled={!email || loading}>
                    {loading ? 'Sending…' : 'Send reset link'}
                </button>
            </form>

            <p className="paragraph-description">
                Remembered it?{' '}
                <RRLink to="/login" style={{ color: '#0266ff', textDecoration: 'none' }}>
                    Back to login
                </RRLink>
            </p>
        </TimeIsMoneyAuthShell>
    )
}
