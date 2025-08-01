import crypto from 'node:crypto';

export function randomToken(bytes = 48) {
    return crypto.randomBytes(bytes).toString('base64url');
}

export function sha256(str: string) {
    return crypto.createHash('sha256').update(str).digest('hex');
}
