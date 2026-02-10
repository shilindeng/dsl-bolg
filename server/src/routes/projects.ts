import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma.js';

const router = Router();

// GET /api/projects — list all projects
router.get('/', async (_req: Request, res: Response) => {
    try {
        const projects = await prisma.project.findMany({
            orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
        });
        res.json(projects);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
});

// POST /api/projects — create a new project
router.post('/', async (req: Request, res: Response) => {
    try {
        const { name, description, techStack, liveUrl, repoUrl, coverImage, featured } = req.body;

        const project = await prisma.project.create({
            data: {
                name,
                description,
                techStack: techStack || '',
                liveUrl: liveUrl || null,
                repoUrl: repoUrl || null,
                coverImage: coverImage || null,
                featured: featured || false,
            },
        });

        res.status(201).json(project);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create project' });
    }
});

// PUT /api/projects/:id — update a project
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const id = parseInt(String(req.params.id));
        const { name, description, techStack, liveUrl, repoUrl, coverImage, featured } = req.body;

        const data: any = {};
        if (name !== undefined) data.name = name;
        if (description !== undefined) data.description = description;
        if (techStack !== undefined) data.techStack = techStack;
        if (liveUrl !== undefined) data.liveUrl = liveUrl;
        if (repoUrl !== undefined) data.repoUrl = repoUrl;
        if (coverImage !== undefined) data.coverImage = coverImage;
        if (featured !== undefined) data.featured = featured;

        const project = await prisma.project.update({
            where: { id },
            data,
        });

        res.json(project);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update project' });
    }
});

// DELETE /api/projects/:id — delete a project
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const id = parseInt(String(req.params.id));
        await prisma.project.delete({ where: { id } });
        res.json({ message: 'Project deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete project' });
    }
});

export default router;
