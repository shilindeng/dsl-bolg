export function buildHeadingId(text: string) {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^\p{L}\p{N}\s-]/gu, '')
        .replace(/\s+/g, '-');
}

export function splitTechStack(value: string) {
    return value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
}
