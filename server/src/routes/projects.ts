import { Router, Request, Response } from 'express';
import slugify from 'slugify';
import prisma from '../lib/prisma.js';
import { authMiddleware, requireAdmin } from '../middleware/auth.js';
import { formatPublicProject, isPublicProjectReady } from '../lib/publicPresentation.js';

const router = Router();

async function resolveProjectSlug(input: string, excludeId?: number) {
    const base = slugify(input, { lower: true, strict: true }) || `project-${Date.now()}`;
    let candidate = base;
    let counter = 1;

    while (true) {
        const existing = await prisma.project.findUnique({ where: { slug: candidate } });
        if (!existing || existing.id === excludeId) {
            return candidate;
        }

        candidate = `${base}-${counter}`;
        counter += 1;
    }
}

router.get('/', async (_req: Request, res: Response) => {
    try {
        const projects = await prisma.project.findMany({
            where: { published: true },
            orderBy: [{ featured: 'desc' }, { order: 'asc' }, { createdAt: 'desc' }],
        });

        res.json(projects.map((project) => formatPublicProject(project)).filter((project) => isPublicProjectReady(project)));
    } catch (error) {
        console.error('Error fetching projects:', error);
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
});

router.get('/admin', authMiddleware, requireAdmin, async (_req: Request, res: Response) => {
    try {
        const projects = await prisma.project.findMany({
            orderBy: [{ published: 'desc' }, { featured: 'desc' }, { order: 'asc' }, { createdAt: 'desc' }],
        });

        res.json(projects.map((project) => formatPublicProject(project)));
    } catch (error) {
        console.error('Error fetching admin projects:', error);
        res.status(500).json({ error: 'Failed to fetch admin projects' });
    }
});

router.get('/:slug', async (req: Request, res: Response) => {
    try {
        const project = await prisma.project.findFirst({
            where: { slug: String(req.params.slug), published: true },
        });

        if (!project || !isPublicProjectReady(project)) {
            res.status(404).json({ error: 'Project not found' });
            return;
        }

        res.json(formatPublicProject(project));
    } catch (error) {
        console.error('Error fetching project:', error);
        res.status(500).json({ error: 'Failed to fetch project' });
    }
});

router.post('/', authMiddleware, requireAdmin, async (req: Request, res: Response) => {
    try {
        const { name, slug, headline, summary, description, techStack, published, status, period, role, liveUrl, repoUrl, coverImage, featured, order } = req.body as {
            name: string;
            slug?: string;
            headline?: string;
            summary?: string;
            description: string;
            techStack?: string;
            published?: boolean;
            status?: string | null;
            period?: string | null;
            role?: string | null;
            liveUrl?: string | null;
            repoUrl?: string | null;
            coverImage?: string | null;
            featured?: boolean;
            order?: number | string;
        };
        const parsedOrder = Number(order);
        const project = await prisma.project.create({
            data: {
                name,
                slug: await resolveProjectSlug(slug || name),
                headline: headline?.trim() || '',
                summary: summary?.trim() || '',
                description,
                techStack: techStack || '',
                published: Boolean(published),
                status: status || null,
                period: period || null,
                role: role || null,
                liveUrl: liveUrl || null,
                repoUrl: repoUrl || null,
                coverImage: coverImage || null,
                featured: Boolean(featured),
                order: Number.isNaN(parsedOrder) ? 0 : parsedOrder,
            },
        });

        res.status(201).json(project);
    } catch (error) {
        console.error('Error creating project:', error);
        res.status(500).json({ error: 'Failed to create project' });
    }
});

router.put('/:id', authMiddleware, requireAdmin, async (req: Request, res: Response) => {
    try {
        const id = parseInt(String(req.params.id), 10);
        const existing = await prisma.project.findUnique({ where: { id } });

        if (!existing) {
            res.status(404).json({ error: 'Project not found' });
            return;
        }

        const { name, slug, headline, summary, description, techStack, published, status, period, role, liveUrl, repoUrl, coverImage, featured, order } = req.body as {
            name?: string;
            slug?: string;
            headline?: string;
            summary?: string;
            description?: string;
            techStack?: string;
            published?: boolean;
            status?: string | null;
            period?: string | null;
            role?: string | null;
            liveUrl?: string | null;
            repoUrl?: string | null;
            coverImage?: string | null;
            featured?: boolean;
            order?: number | string;
        };
        const updates: Record<string, unknown> = {};

        if (name !== undefined) updates.name = name;
        if (headline !== undefined) updates.headline = headline?.trim() || '';
        if (summary !== undefined) updates.summary = summary?.trim() || '';
        if (description !== undefined) updates.description = description;
        if (techStack !== undefined) updates.techStack = techStack;
        if (published !== undefined) updates.published = Boolean(published);
        if (status !== undefined) updates.status = status || null;
        if (period !== undefined) updates.period = period || null;
        if (role !== undefined) updates.role = role || null;
        if (liveUrl !== undefined) updates.liveUrl = liveUrl || null;
        if (repoUrl !== undefined) updates.repoUrl = repoUrl || null;
        if (coverImage !== undefined) updates.coverImage = coverImage || null;
        if (featured !== undefined) updates.featured = Boolean(featured);
        if (order !== undefined) {
            const parsedOrder = Number(order);
            updates.order = Number.isNaN(parsedOrder) ? 0 : parsedOrder;
        }
        if (name !== undefined || slug !== undefined) {
            updates.slug = await resolveProjectSlug(slug || name || existing.name, id);
        }

        const project = await prisma.project.update({
            where: { id },
            data: updates,
        });

        res.json(project);
    } catch (error) {
        console.error('Error updating project:', error);
        res.status(500).json({ error: 'Failed to update project' });
    }
});

router.delete('/:id', authMiddleware, requireAdmin, async (req: Request, res: Response) => {
    try {
        const id = parseInt(String(req.params.id), 10);
        await prisma.project.delete({ where: { id } });
        res.json({ message: 'Project deleted' });
    } catch (error) {
        console.error('Error deleting project:', error);
        res.status(500).json({ error: 'Failed to delete project' });
    }
});

export default router;
