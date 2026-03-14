const DEFAULT_JWT_SECRET = 'dsl-blog-secret-key-change-in-production';

export function readJwtSecret(options?: { allowUnsafe?: boolean }) {
    const value = process.env.JWT_SECRET || '';
    const allowUnsafe = Boolean(options?.allowUnsafe);

    if (!value.trim()) {
        if (allowUnsafe) {
            return DEFAULT_JWT_SECRET;
        }
        throw new Error('JWT_SECRET_MISSING');
    }

    if (value === DEFAULT_JWT_SECRET && !allowUnsafe) {
        throw new Error('JWT_SECRET_INSECURE');
    }

    return value;
}

export function assertRuntimeEnv() {
    readJwtSecret();
}
