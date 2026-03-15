const presetAvatarPaths = [
    '/avatars/dev-1.svg',
    '/avatars/dev-2.svg',
    '/avatars/dev-3.svg',
    '/avatars/dev-4.svg',
    '/avatars/dev-5.svg',
];

export function getPresetAvatars() {
    return presetAvatarPaths;
}

export function getDefaultAvatar(indexSeed?: number | string | null) {
    const numericSeed = typeof indexSeed === 'number'
        ? indexSeed
        : Number.parseInt(String(indexSeed || '0'), 10) || 0;
    const index = Math.abs(numericSeed) % presetAvatarPaths.length;
    return presetAvatarPaths[index];
}

export function resolveAvatarUrl(avatarUrl?: string | null, indexSeed?: number | string | null) {
    return avatarUrl?.trim() || getDefaultAvatar(indexSeed);
}
