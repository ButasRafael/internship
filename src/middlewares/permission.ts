import { Request, Response, NextFunction } from 'express'

export const requirePermission =
    (...actions: string[]) =>
        (req: Request, res: Response, next: NextFunction) => {
            if (!req.user) {
                res.status(401).json({ error: 'Unauthenticated' })
                return
            }
            const ok = (req.user.perms ?? []).some(p => actions.includes(p))
            if (!ok) {
                res.status(403).json({ error: 'Forbidden' })
                return
            }
            next()
        }

export const requireSelfOrPermission =
    (paramName: string, ...actions: string[]) =>
        (req: Request, res: Response, next: NextFunction) => {
            if (!req.user) {
                res.status(401).json({ error: 'Unauthenticated' })
                return
            }

            const pathUserId = Number(req.params[paramName])
            const authUserId = Number(req.user.sub)
            const isSelf = authUserId === pathUserId
            const hasPerm = (req.user.perms ?? []).some(p => actions.includes(p))

            if (isSelf || hasPerm) {
                next()
                return
            }
            res.status(403).json({ error: 'Forbidden' })
        }
