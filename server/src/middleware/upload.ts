import { Router, Request, Response } from 'express';
import multer from 'multer';
import { authMiddleware, requireAdmin } from './auth.js';
import { persistUpload } from '../lib/upload.js';

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp|svg/;
        const extname = allowedTypes.test(file.originalname.toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (extname && mimetype) {
            cb(null, true);
            return;
        }

        cb(new Error('Only image uploads are allowed'));
    },
});

const uploadRouter = Router();

uploadRouter.post(
    '/upload',
    authMiddleware,
    requireAdmin,
    upload.single('image'),
    async (req: Request, res: Response) => {
        if (!req.file) {
            res.status(400).json({ error: 'No file selected' });
            return;
        }

        try {
            const result = await persistUpload(req.file);
            res.json(result);
        } catch (error) {
            console.error('Upload failed:', error);
            res.status(500).json({ error: 'Image upload failed' });
        }
    },
);

export { uploadRouter };
