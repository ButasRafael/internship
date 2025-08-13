import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/store/auth.store'
import { useEffect, useState } from 'react'
import { API } from '@/lib/api'
import {Backdrop, CircularProgress} from "@mui/material";

export default function RequireAuth() {
    const user = useAuth(s => s.user)
    const setAccessToken = useAuth(s => s.setAccessToken)
    const setUser = useAuth(s => s.setUser)
    const [trying, setTrying] = useState(!user)

    useEffect(() => {
        if (!trying) return
        (async () => {
            try {
                const r = await fetch(`${API}/auth/refresh`, { method: 'POST', credentials: 'include' })
                if (r.ok) {
                    const { access_token } = await r.json()
                    setAccessToken(access_token)
                    const me = await fetch(`${API}/auth/me`, {
                        credentials: 'include',
                        headers: { Authorization: `Bearer ${access_token}` }
                    })
                    if (me.ok) setUser(await me.json())
                }
            } finally {
                setTrying(false)
            }
        })()
    }, [trying, setAccessToken, setUser])

    if (trying) {
        return (
            <Backdrop open sx={{ color: '#fff', zIndex: (t)=>t.zIndex.drawer + 1 }}>
                <CircularProgress color="inherit" />
            </Backdrop>
        )
    }
    return user ? <Outlet /> : <Navigate to="/login" replace />
}
