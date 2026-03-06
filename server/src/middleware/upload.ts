import { NextFunction, Request, Response, Router } from 'express';
import multer from 'multer';
import { authMiddleware, requireAdmin } from './auth.js';
import { persistUpload } from '../lib/upload.js';
import { analyticsEventTypes, recordAnalyticsEvent } from '../lib/analytics.js';

const allowedTypes = /jpeg|jpg|png|gif|webp|svg/;

export const imageUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        const extname = allowedTypes.test(file.originalname.toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (extname && mimetype) {
            cb(null, true);
            return;
        }

        cb(new Error('Only JPG, PNG, GIF, WebP, and SVG images are allowed'));
    },
});

export function imageUploadSingle(req: Request, res: Response, next: NextFunction) {
    imageUpload.single('image')(req, res, (error: unknown) => {
        if (!error) {
            next();
            return;
        }

        if (error instanceof multer.MulterError) {
            if (error.code === 'LIMIT_FILE_SIZE') {
                res.status(400).json({ error: 'Image must be 5MB or smaller' });
                return;
            }

            res.status(400).json({ error: error.message });
            return;
        }

        res.status(400).json({ error: error instanceof Error ? error.message : 'Invalid upload request' });
    });
}

const uploadRouter = Router();

uploadRouter.post('/upload', authMiddleware, requireAdmin, imageUploadSingle, async (req: Request, res: Response) => {
    if (!req.file) {
        res.status(400).json({ error: 'No image selected' });
        return;
    }

    try {
        const result = await persistUpload(req.file);
        await recordAnalyticsEvent({
            type: analyticsEventTypes.upload,
            source: 'admin',
            metadata: { filename: result.filename, storage: result.storage },
        });
        res.json(result);
    } catch (error) {
        console.error('Upload failed:', error);
        res.status(500).json({ error: 'Failed to store image' });
    }
});

export { uploadRouter };
