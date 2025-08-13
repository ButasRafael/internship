import { useEffect, useState } from 'react'
import { useSearchParams, Link as RRLink } from 'react-router-dom'
import { API } from '@/lib/api'
import TimeIsMoneyAuthShell from '@/components/ui/TimeIsMoneyAuthShell'

type Status = 'loading' | 'ok' | 'fail' | 'no-token'

export default function VerifyEmail() {
    const [params] = useSearchParams()
    const token = params.get('token')
    const [status, setStatus] = useState<Status>('loading')

    useEffect(() => {
        if (!token) {
            setStatus('no-token')
            return
        }
        ;(async () => {
            setStatus('loading')
            const res = await fetch(`${API}/auth/email-verification/${token}`, {
                method: 'POST',
                credentials: 'include',
            })
            setStatus(res.status === 204 ? 'ok' : 'fail')
        })()
    }, [token])

    return (
        <TimeIsMoneyAuthShell title="Verify your email">
            {status === 'loading' && (
                <div
                    style={{
                        width: 330,
                        margin: '10px auto 0',
                        fontSize: 12,
                        color: '#31708f',
                        background: '#d9edf7',
                        border: '1px solid #bce8f1',
                        borderRadius: 6,
                        padding: '8px 10px',
                        textAlign: 'left',
                    }}
                >
                    Verifying your email…
                </div>
            )}
            {status === 'no-token' && (
                <div
                    style={{
                        width: 330,
                        margin: '10px auto 0',
                        fontSize: 12,
                        color: '#31708f',
                        background: '#d9edf7',
                        border: '1px solid #bce8f1',
                        borderRadius: 6,
                        padding: '8px 10px',
                        textAlign: 'left',
                    }}
                >
                    Missing token.
                </div>
            )}
            {status === 'ok' && (
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
                    Your email is verified. You can sign in now.
                </div>
            )}
            {status === 'fail' && (
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
                    Invalid or expired token.
                </div>
            )}

            <div style={{ width: 330, margin: '16px auto 0', textAlign: 'right' }}>
                <RRLink
                    to="/login"
                    className="continue"
                    style={{ display: 'inline-block', textDecoration: 'none', textAlign: 'center', lineHeight: '45px' }}
                >
                    Go to Login
                </RRLink>
            </div>
        </TimeIsMoneyAuthShell>
    )
}
