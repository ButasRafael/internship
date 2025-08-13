import { create } from 'zustand'
import { jwtDecode } from 'jwt-decode'

type Jwt = { sub:number; tv:number; perms?:string[]; exp?:number }
export type Me = {
    id:number; email:string; role_id:number;
    hourly_rate:number; currency:string; timezone:string; email_verified:boolean;
}

type State = {
    accessToken: string | null
    perms: string[]
    user: Me | null
    setAccessToken: (t: string | null) => void
    setUser: (u: Me | null) => void
    hasPerm: (p: string) => boolean
}

export const useAuth = create<State>((set, get) => ({
    accessToken: null,
    perms: [],
    user: null,
    setAccessToken: (t) => set({
        accessToken: t,
        perms: t ? (jwtDecode<Jwt>(t).perms ?? []) : []
    }),
    setUser: (u) => set({ user: u }),
    hasPerm: (p) => get().perms.includes(p),
}))
