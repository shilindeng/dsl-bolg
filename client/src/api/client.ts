const API_BASE = '/api';

// ==================== 类型定义 ====================

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
    category?: Category | null;
    meta?: PostMeta | null;
    series?: Series | null;
    comments?: Comment[];
}

export interface PostInput {
    title: string;
    content: string;
    excerpt: string;
    coverImage: string | null;
    published: boolean;
    tags: string[];
    categoryId?: number | null;
}

export interface Tag {
    id: number;
    name: string;
    slug: string;
    _count?: { posts: number };
}

export interface Category {
    id: number;
    name: string;
    slug: string;
    _count?: { posts: number };
}

export interface Comment {
    id: number;
    content: string;
    author: string;
    email: string | null;
    postId: number;
    parentId: number | null;
    approved: boolean;
    createdAt: string;
    replies?: Comment[];
}

export interface PostMeta {
    views: number;
    likes: number;
    readTime: number;
}

export interface Series {
    id: number;
    title: string;
    slug: string;
    description: string | null;
    posts?: { id: number; title: string; slug: string; seriesOrder: number | null }[];
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

export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

// ==================== 文章 API ====================

export async function fetchPosts(params?: {
    tag?: string;
    search?: string;
    published?: boolean;
    category?: string;
    page?: number;
    limit?: number;
}): Promise<PaginatedResponse<Post>> {
    const query = new URLSearchParams();
    if (params?.published !== undefined) query.set('published', String(params.published));
    if (params?.tag) query.set('tag', params.tag);
    if (params?.search) query.set('search', params.search);
    if (params?.category) query.set('category', params.category);
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));

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
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/posts`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...headers,
        },
        body: JSON.stringify(post),
    });
    if (!res.ok) throw new Error('创建文章失败');
    return res.json();
}

export async function updatePost(id: number, post: Partial<PostInput>): Promise<Post> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/posts/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            ...headers,
        },
        body: JSON.stringify(post),
    });
    if (!res.ok) throw new Error('更新文章失败');
    return res.json();
}

export async function deletePost(id: number): Promise<void> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/posts/${id}`, {
        method: 'DELETE',
        headers: headers,
    });
    if (!res.ok) throw new Error('删除文章失败');
}

export async function likePost(slug: string): Promise<{ likes: number }> {
    const res = await fetch(`${API_BASE}/posts/${slug}/like`, { method: 'POST' });
    if (!res.ok) throw new Error('点赞失败');
    return res.json();
}

// ==================== 评论 API ====================

export async function fetchComments(postId: number): Promise<Comment[]> {
    const res = await fetch(`${API_BASE}/comments?postId=${postId}`);
    if (!res.ok) throw new Error('获取评论失败');
    return res.json();
}

export async function createComment(data: {
    content: string;
    author: string;
    email?: string;
    postId: number;
    parentId?: number;
}): Promise<{ message: string; comment: Comment }> {
    const res = await fetch(`${API_BASE}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('提交评论失败');
    return res.json();
}

// ==================== 分类 API ====================

export async function fetchCategories(): Promise<Category[]> {
    const res = await fetch(`${API_BASE}/categories`);
    if (!res.ok) throw new Error('获取分类失败');
    return res.json();
}

// ==================== 标签 API ====================

export async function fetchTags(): Promise<Tag[]> {
    const res = await fetch(`${API_BASE}/tags`);
    if (!res.ok) throw new Error('获取标签失败');
    return res.json();
}

// ==================== 项目 API ====================

export async function fetchProjects(): Promise<Project[]> {
    const res = await fetch(`${API_BASE}/projects`);
    if (!res.ok) throw new Error('获取项目失败');
    return res.json();
}

// ==================== 上传 API ====================

export async function uploadImage(file: File): Promise<{ url: string; filename: string }> {
    const formData = new FormData();
    formData.append('image', file);
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        headers: headers,
        body: formData,
    });
    if (!res.ok) throw new Error('图片上传失败');
    return res.json();
}

// ==================== 认证工具 ====================

function getAuthHeaders(): Record<string, string> {
    // Try to get token from Supabase client storage if manually set item not found
    // Usually Supabase stores it as `sb-<project-ref>-auth-token`
    // But let's assume the user's login logic sets 'supabase_token' as implied by line 227.
    // If not, we might need to debug where the token is stored. 
    // For now, trust the existing code but ensure it's actually set.
    const token = localStorage.getItem('supabase_token')
        || localStorage.getItem('sb-access-token')
        || (JSON.parse(localStorage.getItem('sb-fzwbtffigdqkppfzwbtf-auth-token') || '{}')?.access_token);

    if (token) {
        return { Authorization: `Bearer ${token}` };
    }
    return {};
}
