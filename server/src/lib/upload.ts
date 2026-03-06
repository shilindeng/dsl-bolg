import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { isR2Enabled, siteConfig } from './site.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '..', '..', 'uploads');

const r2Client = isR2Enabled
    ? new S3Client({
        region: 'auto',
        endpoint: `https://${siteConfig.r2.accountId}.r2.cloudflarestorage.com`,
        credentials: {
            accessKeyId: siteConfig.r2.accessKeyId,
            secretAccessKey: siteConfig.r2.secretAccessKey,
        },
    })
    : null;

const getFileName = (originalName: string) => {
    const extension = path.extname(originalName) || '.bin';
    return `${Date.now()}-${randomUUID()}${extension}`;
};

export async function persistUpload(file: Express.Multer.File) {
    const fileName = getFileName(file.originalname);

    if (isR2Enabled && r2Client) {
        await r2Client.send(
            new PutObjectCommand({
                Bucket: siteConfig.r2.bucketName,
                Key: fileName,
                Body: file.buffer,
                ContentType: file.mimetype,
            }),
        );

        return {
            filename: fileName,
            url: `${siteConfig.r2.publicUrl}/${fileName}`,
            storage: 'r2' as const,
        };
    }

    await mkdir(uploadsDir, { recursive: true });
    await writeFile(path.join(uploadsDir, fileName), file.buffer);

    return {
        filename: fileName,
        url: `/uploads/${fileName}`,
        storage: 'local' as const,
    };
}
