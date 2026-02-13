import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { supabaseAdmin } from '../lib/supabase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 本地存储（fallback，当 Supabase 未配置时使用）
const localStorage = multer.diskStorage({
    destination: path.join(__dirname, '..', '..', 'uploads'),
    filename: (_req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        cb(null, `${uniqueSuffix}${ext}`);
    },
});

// 内存存储（上传到 Supabase Storage）
const memoryStorage = multer.memoryStorage();

const useSupabase = !!process.env.SUPABASE_URL && !process.env.SUPABASE_URL.includes('YOUR_PROJECT_REF');

const upload = multer({
    storage: useSupabase ? memoryStorage : localStorage,
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
        if (useSupabase && req.file.buffer) {
            // Supabase Storage 上传
            const ext = path.extname(req.file.originalname);
            const fileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
            const filePath = `blog-images/${fileName}`;

            console.log(`[Upload] Attempting to upload ${fileName} (${req.file.mimetype}) to Supabase Storage...`);

            const { data, error } = await supabaseAdmin.storage
                .from('uploads')
                .upload(filePath, req.file.buffer, {
                    contentType: req.file.mimetype,
                    upsert: false,
                });

            if (error) {
                console.error('[Upload] Supabase Storage Error:', error);
                throw error;
            }

            console.log('[Upload] Success:', data);

            if (error) throw error;

            const { data: urlData } = supabaseAdmin.storage
                .from('uploads')
                .getPublicUrl(filePath);

            res.json({ url: urlData.publicUrl, filename: fileName });
        } else {
            // 本地存储 fallback
            const url = `/uploads/${req.file.filename}`;
            res.json({ url, filename: req.file.filename });
        }
    } catch (error) {
        console.error('上传失败:', error);
        res.status(500).json({ error: '图片上传失败' });
    }
});

export { uploadRouter };
