import multer, { FileFilterCallback } from 'multer'
import path from 'node:path'
import fs from 'node:fs/promises'

const dir = path.resolve(process.cwd(), 'uploads', 'objects')
await fs.mkdir(dir, { recursive: true }).catch(e =>
    console.error('Unable to create uploads dir', e)
)

export const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, dir),
    filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase()
        const name = `obj-${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`
        cb(null, name)
    }
})

export const fileFilter = (
    _req: Express.Request,
    file: Express.Multer.File,
    cb: FileFilterCallback
) => {
    const ok = ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)
    cb(null, ok)
}
