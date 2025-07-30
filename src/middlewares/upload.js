import multer from 'multer';
import path   from 'node:path';
import fs     from 'node:fs/promises';

const dir = path.resolve(process.cwd(), 'uploads', 'objects');
try {
    await fs.mkdir(dir, { recursive: true });
} catch (e) {
    console.error('Unable to create uploads dir', e);
}


export const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, dir),
    filename   : (_req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();   // .jpg
        const name = `obj-${Date.now()}-${Math.round(Math.random()*1e6)}${ext}`;
        cb(null, name);
    }
});

export function fileFilter(_req, file, cb) {
    const ok = ['image/jpeg','image/png','image/webp'].includes(file.mimetype);
    cb(null, ok);
}

