import { useAuth } from '@/store/auth.store'

export class ApiError extends Error {
    status?: number
    body?: unknown
    constructor(message: string, status?: number, body?: unknown) {
        super(message)
        this.name = 'ApiError'
        this.status = status
        this.body = body
    }
}

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

function clearAuth() {
    const { setAccessToken, setUser } = useAuth.getState()
    setAccessToken(null)
    setUser(null)
}

async function refreshAccessToken() {
    const res = await fetch(`${API}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
    })
    if (!res.ok) throw new ApiError('refresh_failed', res.status)
    const data = (await res.json()) as { access_token: string }
    useAuth.getState().setAccessToken(data.access_token)
}

export async function apiFetch<T = unknown>(
    path: string,
    init: RequestInit = {},
): Promise<T> {
    const { accessToken } = useAuth.getState()
    const headers = new Headers(init.headers)
    if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`)

    const url = path.startsWith('http') ? path : `${API}${path}`
    const doFetch = (h: Headers) =>
        fetch(url, { ...init, headers: h, credentials: 'include' })

    let res = await doFetch(headers)

    if (res.status === 401) {
        try {
            await refreshAccessToken()
            const fresh = useAuth.getState().accessToken
            const h2 = new Headers(init.headers)
            if (fresh) h2.set('Authorization', `Bearer ${fresh}`)
            res = await doFetch(h2)
        } catch {
            clearAuth()
            throw new ApiError('unauthorized', 401)
        }
    }

    if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new ApiError((body as any)?.error || 'request_failed', res.status, body)
    }

    return (await res.json()) as T
}

export { API }
