import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

describe('startup env validation', () => {
    it('fails fast when JWT_SECRET is missing', () => {
        const result = spawnSync('npx', ['tsx', 'src/index.ts'], {
            cwd: process.cwd(),
            env: {
                ...process.env,
                JWT_SECRET: '',
                DISABLE_NEWSLETTER_WORKER: 'true',
            },
            encoding: 'utf8',
            shell: process.platform === 'win32',
        });

        expect(result.status).not.toBe(0);
        expect(`${result.stderr}${result.stdout}`).toContain('JWT_SECRET_MISSING');
    });
});
