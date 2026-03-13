import { PrismaClient } from '@prisma/client';
import {
    editorialHomepageSections,
    editorialProjectPatches,
    editorialSeriesAssignments,
    editorialSeriesBlueprints,
} from '../src/lib/editorialDefaults.js';

const prisma = new PrismaClient();

async function applySeriesBlueprints() {
    const seriesMap = new Map<number, string>();

    for (const blueprint of editorialSeriesBlueprints) {
        const record = await prisma.series.upsert({
            where: { slug: blueprint.slug },
            update: {
                title: blueprint.title,
                summary: blueprint.summary,
                description: blueprint.description,
                coverImage: blueprint.coverImage || null,
                status: blueprint.status,
                order: blueprint.order,
            },
            create: {
                title: blueprint.title,
                slug: blueprint.slug,
                summary: blueprint.summary,
                description: blueprint.description,
                coverImage: blueprint.coverImage || null,
                status: blueprint.status,
                order: blueprint.order,
            },
        });

        seriesMap.set(record.id, record.slug);
    }

    return seriesMap;
}

async function applySeriesAssignments() {
    const series = await prisma.series.findMany({
        where: { slug: { in: editorialSeriesAssignments.map((item) => item.seriesSlug) } },
        select: { id: true, slug: true },
    });
    const seriesBySlug = new Map(series.map((item) => [item.slug, item.id]));

    let updated = 0;

    for (const assignment of editorialSeriesAssignments) {
        const seriesId = seriesBySlug.get(assignment.seriesSlug);
        if (!seriesId) {
            continue;
        }

        const post = await prisma.post.findUnique({
            where: { slug: assignment.postSlug },
            select: { id: true, seriesId: true, seriesOrder: true },
        });

        if (!post) {
            continue;
        }

        if (post.seriesId === seriesId && post.seriesOrder === assignment.seriesOrder) {
            continue;
        }

        await prisma.post.update({
            where: { id: post.id },
            data: {
                seriesId,
                seriesOrder: assignment.seriesOrder,
            },
        });

        updated += 1;
    }

    return updated;
}

async function applyHomepageSections() {
    for (const section of editorialHomepageSections) {
        await prisma.homepageSection.upsert({
            where: { type: section.type },
            update: section,
            create: section,
        });
    }

    return editorialHomepageSections.length;
}

async function applyProjectPatches() {
    let updated = 0;

    for (const patch of editorialProjectPatches) {
        const existing = await prisma.project.findUnique({
            where: { slug: patch.slug },
            select: { id: true },
        });

        if (!existing) {
            continue;
        }

        await prisma.project.update({
            where: { id: existing.id },
            data: {
                name: patch.name,
                headline: patch.headline ?? null,
                summary: patch.summary,
                description: patch.description,
                techStack: patch.techStack,
                status: patch.status ?? null,
                period: patch.period ?? null,
                role: patch.role ?? null,
                liveUrl: patch.liveUrl ?? null,
                repoUrl: patch.repoUrl ?? null,
                featured: Boolean(patch.featured),
                order: patch.order ?? 0,
            },
        });

        updated += 1;
    }

    return updated;
}

async function main() {
    console.log('Applying editorial maintenance...');

    await applySeriesBlueprints();
    const assignedPosts = await applySeriesAssignments();
    const syncedSections = await applyHomepageSections();
    const patchedProjects = await applyProjectPatches();

    console.log(`Series assignments updated: ${assignedPosts}`);
    console.log(`Homepage sections synced: ${syncedSections}`);
    console.log(`Projects patched: ${patchedProjects}`);
    console.log('Editorial maintenance complete.');
}

main()
    .catch((error) => {
        console.error(error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
