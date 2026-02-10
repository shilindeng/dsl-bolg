const API_BASE = '/api';

export interface Post {
    id: number;
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    coverImage: string | null;
    published: boolean;
    createdAt: string;
    updatedAt: string;
    tags: Tag[];
}

export interface PostInput {
    title: string;
    content: string;
    excerpt: string;
    coverImage: string | null;
    published: boolean;
    tags: string[];
}

export interface Tag {
    id: number;
    name: string;
    slug: string;
    _count?: { posts: number };
}

export interface Project {
    id: number;
    name: string;
    description: string;
    techStack: string;
    liveUrl: string | null;
    repoUrl: string | null;
    coverImage: string | null;
    featured: boolean;
    createdAt: string;
}

export async function fetchPosts(params?: { tag?: string; search?: string; published?: boolean }): Promise<Post[]> {
    const query = new URLSearchParams();
    if (params?.published !== undefined) query.set('published', String(params.published));
    if (params?.tag) query.set('tag', params.tag);
    if (params?.search) query.set('search', params.search);
    const res = await fetch(`${API_BASE}/posts?${query}`);
    if (!res.ok) throw new Error('获取文章失败');
    return res.json();
}

export async function fetchPost(slug: string): Promise<Post> {
    const res = await fetch(`${API_BASE}/posts/${slug}`);
    if (!res.ok) throw new Error('获取文章失败');
    return res.json();
}

export async function createPost(post: PostInput): Promise<Post> {
    const res = await fetch(`${API_BASE}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(post),
    });
    if (!res.ok) throw new Error('创建文章失败');
    return res.json();
}

export async function updatePost(id: number, post: Partial<PostInput>): Promise<Post> {
    const res = await fetch(`${API_BASE}/posts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(post),
    });
    if (!res.ok) throw new Error('更新文章失败');
    return res.json();
}

export async function deletePost(id: number): Promise<void> {
    const res = await fetch(`${API_BASE}/posts/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('删除文章失败');
}

export async function uploadImage(file: File): Promise<{ url: string; filename: string }> {
    const formData = new FormData();
    formData.append('image', file);
    const res = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        body: formData,
    });
    if (!res.ok) throw new Error('图片上传失败');
    return res.json();
}

export async function fetchProjects(): Promise<Project[]> {
    const res = await fetch(`${API_BASE}/projects`);
    if (!res.ok) throw new Error('获取项目失败');
    return res.json();
}

export async function fetchTags(): Promise<Tag[]> {
    const res = await fetch(`${API_BASE}/tags`);
    if (!res.ok) throw new Error('获取标签失败');
    return res.json();
}
