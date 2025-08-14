import { apiFetch } from '@/lib/api'

export type Currency = string
const RON = 'RON'
const TTL_MS = 60 * 60 * 1000

type RateRow = { day: string; base: string; quote: string; rate: number }
type CacheVal = { rate: number; ts: number }
const cache = new Map<string, CacheVal>()
const k = (day: string, f: string, t: string) => `${day}|${f}->${t}`

function ymd(d: Date | string) {
    return typeof d === 'string' ? d.slice(0, 10) : d.toISOString().slice(0, 10)
}

function get(day: string, f: string, t: string) {
    const hit = cache.get(k(day, f, t))
    if (hit && Date.now() - hit.ts < TTL_MS) return hit.rate
    return null
}
function set(day: string, f: string, t: string, rate: number) {
    cache.set(k(day, f, t), { rate, ts: Date.now() })
}

async function fetchExact(day: string, base: string, quote: string): Promise<number | null> {
    const rows = await apiFetch<RateRow[]>(
        `/api/exchange-rates?day=${encodeURIComponent(day)}&base=${encodeURIComponent(base)}&quote=${encodeURIComponent(quote)}`
    )
    if (rows?.length) return rows[0].rate

    const all = await apiFetch<RateRow[]>(
        `/api/exchange-rates?base=${encodeURIComponent(base)}&quote=${encodeURIComponent(quote)}`
    )
    if (all?.length) return all[all.length - 1].rate
    return null
}

export async function fx(from: Currency, to: Currency, date: Date | string): Promise<number> {
    const day = ymd(date)
    const f = String(from).toUpperCase()
    const t = String(to).toUpperCase()
    if (f === t) return 1

    const cached = get(day, f, t)
    if (cached != null) return cached

    const direct = await fetchExact(day, f, t)
    if (direct != null) {
        set(day, f, t, direct)
        return direct
    }

    if (f === RON) {
        const bToRon = await fetchExact(day, t, RON)
        if (bToRon != null && bToRon !== 0) {
            const r = 1 / bToRon
            set(day, f, t, r)
            return r
        }
    } else if (t === RON) {
        const aToRon = await fetchExact(day, f, RON)
        if (aToRon != null) {
            set(day, f, t, aToRon)
            return aToRon
        }
    } else {
        const [aToRon, bToRon] = await Promise.all([fetchExact(day, f, RON), fetchExact(day, t, RON)])
        if (aToRon != null && bToRon != null && bToRon !== 0) {
            const r = aToRon / bToRon
            set(day, f, t, r)
            return r
        }
    }

    throw new Error(`FX missing for ${from}->${to} @ ${day}`)
}
