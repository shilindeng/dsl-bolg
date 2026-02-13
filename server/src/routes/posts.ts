import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../lib/supabase.js';
import slugify from 'slugify';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// Helper to get tags for posts
async function attachTagsToPosts(posts: any[]) {
    if (!posts || posts.length === 0) return posts;
    const postIds = posts.map(p => p.id);

    // Get PostTags
    const { data: postTags } = await supabaseAdmin
        .from('PostTags')
        .select('postId, tagId')
        .in('postId', postIds);

    if (!postTags || postTags.length === 0) return posts.map(p => ({ ...p, tags: [] }));

    const tagIds = [...new Set(postTags.map(pt => pt.tagId))];
    const { data: allTags } = await supabaseAdmin
        .from('Tag')
        .select('*')
        .in('id', tagIds);

    return posts.map(post => {
        const currentTagIds = postTags.filter(pt => pt.postId === post.id).map(pt => pt.tagId);
        const tags = allTags?.filter(t => currentTagIds.includes(t.id)) || [];
        return { ...post, tags };
    });
}

// GET /api/posts — 分页列表
router.get('/', async (req: Request, res: Response) => {
    try {
        const { tag, published, search, category, page = '1', limit = '10' } = req.query;

        const pageNum = Math.max(1, parseInt(page as string));
        const pageSize = Math.min(50, Math.max(1, parseInt(limit as string)));
        const from = (pageNum - 1) * pageSize;
        const to = from + pageSize - 1;

        let query = supabaseAdmin
            .from('Post')
            .select(`
                *,
                category:Category(*),
                meta:PostMeta(*),
                series:Series(*)
            `, { count: 'exact' });

        // Filters
        if (published === 'true') query = query.eq('published', true);
        if (published === 'false') query = query.eq('published', false);

        if (category) {
            // Get Category ID first
            const { data: cat } = await supabaseAdmin.from('Category').select('id').eq('slug', category).single();
            if (cat) query = query.eq('categoryId', cat.id);
            else return res.json({ data: [], pagination: { page: pageNum, limit: pageSize, total: 0, totalPages: 0 } });
        }

        if (tag) {
            // Get Tag ID -> Post IDs
            const { data: t } = await supabaseAdmin.from('Tag').select('id').eq('slug', tag).single();
            if (t) {
                const { data: pts } = await supabaseAdmin.from('PostTags').select('postId').eq('tagId', t.id);
                const postIds = pts?.map(pt => pt.postId) || [];
                if (postIds.length > 0) query = query.in('id', postIds);
                else return res.json({ data: [], pagination: { page: pageNum, limit: pageSize, total: 0, totalPages: 0 } });
            } else {
                return res.json({ data: [], pagination: { page: pageNum, limit: pageSize, total: 0, totalPages: 0 } });
            }
        }

        if (search) {
            query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
        }

        query = query.order('createdAt', { ascending: false }).range(from, to);

        const { data: posts, count, error } = await query;

        if (error) throw error;

        // Attach tags manually
        let postsWithTags = await attachTagsToPosts(posts || []);

        // Flatten arrays for 1:1 relations (meta, category, series) if Supabase returns them as arrays
        postsWithTags = postsWithTags.map((p: any) => ({
            ...p,
            meta: Array.isArray(p.meta) ? p.meta[0] : p.meta,
            category: Array.isArray(p.category) ? p.category[0] : p.category,
            series: Array.isArray(p.series) ? p.series[0] : p.series
        }));

        res.json({
            data: postsWithTags,
            pagination: {
                page: pageNum,
                limit: pageSize,
                total: count || 0,
                totalPages: Math.ceil((count || 0) / pageSize),
            },
        });
    } catch (error) {
        console.error('Error fetching posts:', error);
        res.status(500).json({ error: '获取文章失败' });
    }
});

// GET /api/posts/:slug — 单篇文章
router.get('/:slug', async (req: Request, res: Response) => {
    try {
        const { data: post, error } = await supabaseAdmin
            .from('Post')
            .select(`
                *,
                category:Category(*),
                meta:PostMeta(*),
                series:Series(*),
                comments:Comment(*)
            `)
            .eq('slug', req.params.slug)
            .single();

        if (error || !post) {
            return res.status(404).json({ error: '文章未找到' });
        }

        // Attach tags
        let [postWithTags] = await attachTagsToPosts([post]);

        // Flatten 1:1 relations
        postWithTags = {
            ...postWithTags,
            meta: Array.isArray(postWithTags.meta) ? postWithTags.meta[0] : postWithTags.meta,
            category: Array.isArray(postWithTags.category) ? postWithTags.category[0] : postWithTags.category,
            series: Array.isArray(postWithTags.series) ? postWithTags.series[0] : postWithTags.series,
        };

        // Fetch comments recursively (manual or separate query?)
        // The simple select above gets comments but not replies. 
        // We fetch comments separately to match structure.
        const { data: comments } = await supabaseAdmin
            .from('Comment')
            .select('*, replies:Comment!parentId(*)')
            .eq('postId', post.id)
            .eq('approved', true) // Only approved
            .is('parentId', null)
            .order('createdAt', { ascending: false });

        postWithTags.comments = comments || [];

        // Increment views
        const { error: rpcError } = await supabaseAdmin.rpc('increment_page_view', { page_slug: req.params.slug });

        if (rpcError) {
            // Fallback: manual update if RPC fails (e.g. not applied yet)
            console.warn('RPC increment_page_view failed, trying manual update', rpcError);
            const { data: meta } = await supabaseAdmin.from('PostMeta').select('*').eq('postId', post.id).single();
            if (meta) {
                await supabaseAdmin.from('PostMeta').update({ views: meta.views + 1 }).eq('postId', post.id);
            } else {
                await supabaseAdmin.from('PostMeta').insert({ postId: post.id, views: 1, readTime: Math.ceil(post.content.length / 500) });
            }
        }
        // Or manual upsert meta
        const { data: meta } = await supabaseAdmin.from('PostMeta').select('*').eq('postId', post.id).single();
        if (meta) {
            await supabaseAdmin.from('PostMeta').update({ views: meta.views + 1 }).eq('postId', post.id);
        } else {
            await supabaseAdmin.from('PostMeta').insert({ postId: post.id, views: 1, readTime: Math.ceil(post.content.length / 500) });
        }

        res.json(postWithTags);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: '获取文章失败' });
    }
});

// POST /api/posts/:slug/like
router.post('/:slug/like', async (req: Request, res: Response) => {
    try {
        const { data: post } = await supabaseAdmin.from('Post').select('id').eq('slug', req.params.slug).single();
        if (!post) return res.status(404).json({ error: '文章未找到' });

        const { data: meta } = await supabaseAdmin.from('PostMeta').select('*').eq('postId', post.id).single();
        let newLikes = 1;
        if (meta) {
            newLikes = meta.likes + 1;
            await supabaseAdmin.from('PostMeta').update({ likes: newLikes }).eq('postId', post.id);
        } else {
            await supabaseAdmin.from('PostMeta').insert({ postId: post.id, likes: 1 });
        }

        console.log(`[Like] Post ${post.id} liked. New count: ${newLikes}`);
        res.json({ likes: newLikes });
    } catch (error) {
        res.status(500).json({ error: '点赞失败' });
    }
});

// POST /api/posts
router.post('/', authMiddleware, async (req: Request, res: Response) => {
    try {
        console.log('[Create Post] Request Body:', req.body);
        const { title, content, excerpt, coverImage, published, tags, categoryId } = req.body;
        // Append random 6 chars to slug to ensure uniqueness and avoid collisions
        const slug = slugify(title, { lower: true, strict: true }) + '-' + Math.random().toString(36).substring(2, 8);

        // 1. Upsert Tags and get IDs
        let tagIds: number[] = [];
        if (tags && Array.isArray(tags)) {
            for (const tagName of tags) {
                const tSlug = slugify(tagName, { lower: true, strict: true });
                // Upsert? 
                const { data: existing } = await supabaseAdmin.from('Tag').select('id').eq('slug', tSlug).single();
                if (existing) {
                    tagIds.push(existing.id);
                } else {
                    const { data: newTag } = await supabaseAdmin.from('Tag').insert({ name: tagName, slug: tSlug }).select().single();
                    if (newTag) tagIds.push(newTag.id);
                }
            }
        }

        // 2. Create Post
        const { data: post, error } = await supabaseAdmin
            .from('Post')
            .insert({
                title, slug, content,
                excerpt: excerpt || '',
                coverImage: coverImage || null,
                published: published || false,
                categoryId: categoryId || null,
                updatedAt: new Date().toISOString(), // Fix: Manual updatedAt
            })
            .select()
            .single();

        if (error) throw error;

        // 3. Create PostMeta
        await supabaseAdmin.from('PostMeta').insert({
            postId: post.id,
            readTime: Math.ceil(content.length / 500)
        });

        // 4. Link Tags (Insert into View? or _PostTags via View)
        if (tagIds.length > 0) {
            const links = tagIds.map(tid => ({ postId: post.id, tagId: tid }));
            // Insert into PostTags view (Assuming it supports insert, simplified view often does)
            // If View insert fails, user needs to expose table or use RPC.
            // Let's assume View insert works for "PostTags" view mapping 1:1 to "_PostTags".
            await supabaseAdmin.from('PostTags').insert(links);
        }

        const [finalPost] = await attachTagsToPosts([post]);
        res.status(201).json(finalPost);
    } catch (error) {
        console.error('[Create Post] FAILED:', error);
        res.status(500).json({ error: '创建文章失败', details: error });
    }
});

// PUT /api/posts/:id
router.put('/:id', authMiddleware, async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id as string);
        const { title, content, excerpt, coverImage, published, tags, categoryId } = req.body;

        const updates: any = {};
        if (title !== undefined) {
            updates.title = title;
            updates.slug = slugify(title, { lower: true, strict: true });
        }
        if (content !== undefined) updates.content = content;
        if (excerpt !== undefined) updates.excerpt = excerpt;
        if (coverImage !== undefined) updates.coverImage = coverImage;
        if (published !== undefined) updates.published = published;
        if (categoryId !== undefined) updates.categoryId = categoryId;

        // Update Post
        const { data: post, error } = await supabaseAdmin
            .from('Post')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        // Update Meta
        if (content !== undefined) {
            const readTime = Math.ceil(content.length / 500);
            const { data: meta } = await supabaseAdmin.from('PostMeta').select('id').eq('postId', id).single();
            if (meta) await supabaseAdmin.from('PostMeta').update({ readTime }).eq('postId', id);
            else await supabaseAdmin.from('PostMeta').insert({ postId: id, readTime });
        }

        // Update Tags
        if (tags && Array.isArray(tags)) {
            // Delete old
            await supabaseAdmin.from('PostTags').delete().eq('postId', id);

            // Re-insert
            let tagIds: number[] = [];
            for (const tagName of tags) {
                const tSlug = slugify(tagName, { lower: true, strict: true });
                const { data: existing } = await supabaseAdmin.from('Tag').select('id').eq('slug', tSlug).single();
                if (existing) {
                    tagIds.push(existing.id);
                } else {
                    const { data: newTag } = await supabaseAdmin.from('Tag').insert({ name: tagName, slug: tSlug }).select().single();
                    if (newTag) tagIds.push(newTag.id);
                }
            }
            if (tagIds.length > 0) {
                const links = tagIds.map(tid => ({ postId: id, tagId: tid }));
                await supabaseAdmin.from('PostTags').insert(links);
            }
        }

        const [finalPost] = await attachTagsToPosts([post]);
        res.json(finalPost);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: '更新文章失败' });
    }
});

// DELETE /api/posts/:id
router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id as string);
        await supabaseAdmin.from('Post').delete().eq('id', id);
        res.json({ message: '文章已删除' });
    } catch (error) {
        res.status(500).json({ error: '删除文章失败' });
    }
});

export default router;
