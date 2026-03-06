import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 本地文件存储
const storage = multer.diskStorage({
    destination: path.join(__dirname, '..', '..', 'uploads'),
    filename: (_req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        cb(null, `${uniqueSuffix}${ext}`);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (_req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp|svg/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname && mimetype) {
            cb(null, true);
        } else {
            cb(new Error('仅允许上传图片文件'));
        }
    },
});

const uploadRouter = Router();

// POST /api/upload — 上传图片
uploadRouter.post('/upload', upload.single('image'), async (req: Request, res: Response) => {
    if (!req.file) {
        res.status(400).json({ error: '未选择文件' });
        return;
    }

    try {
        const url = `/uploads/${req.file.filename}`;
        res.json({ url, filename: req.file.filename });
    } catch (error) {
        console.error('上传失败:', error);
        res.status(500).json({ error: '图片上传失败' });
    }
});

export { uploadRouter };
