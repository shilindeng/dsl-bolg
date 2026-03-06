const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
const maxBytes = 5 * 1024 * 1024;

export function validateImageFile(file: File) {
    if (!allowedImageTypes.includes(file.type)) {
        throw new Error('仅支持 JPG、PNG、GIF、WebP 或 SVG 图片');
    }

    if (file.size > maxBytes) {
        throw new Error('图片大小不能超过 5MB');
    }
}
