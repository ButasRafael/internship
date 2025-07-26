export function requirePermission(...actions) {
    return (req, res, next) => {
        if (!req.user) return res.status(401).json({ error: 'Unauthenticated' });
        const ok = req.user.perms?.some(p => actions.includes(p));
        if (!ok) return res.status(403).json({ error: 'Forbidden' });
        next();
    };
}

export function requireSelfOrPermission(paramName, ...actions) {
    return (req, res, next) => {
        if (!req.user) return res.status(401).json({ error: 'Unauthenticated' });

        const pathUserId = Number(req.params[paramName]);
        const authUserId = Number(req.user.sub);

        const isSelf = authUserId === pathUserId;
        const ok = req.user.perms?.some(p => actions.includes(p));

        if (isSelf || ok) return next();
        return res.status(403).json({ error: 'Forbidden' });
    };
}
