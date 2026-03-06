const API_BASE = import.meta.env.VITE_API_BASE || '/api';

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

export interface PostMeta {
    views: number;
    likes: number;
    readTime: number;
}

export interface PostLink {
    slug: string;
    title: string;
}

export interface TocHeading {
    id: string;
    text: string;
    level: number;
}

export interface Comment {
    id: number;
    content: string;
    author: string;
    email: string | null;
    postId: number;
    parentId: number | null;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: string;
    updatedAt?: string;
    replies?: Comment[];
    post?: PostLink & { id: number };
    parent?: { id: number; author: string } | null;
}

export interface Post {
    id: number;
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    coverImage: string | null;
    published: boolean;
    featured: boolean;
    publishedAt: string | null;
    createdAt: string;
    updatedAt: string;
    tags: Tag[];
    category?: Category | null;
    meta?: PostMeta | null;
    comments?: Comment[];
    toc?: TocHeading[];
    relatedPosts?: Post[];
    previousPost?: PostLink | null;
    nextPost?: PostLink | null;
}

export interface Project {
    id: number;
    name: string;
    slug: string;
    summary: string;
    description: string;
    techStack: string;
    liveUrl: string | null;
    repoUrl: string | null;
    coverImage: string | null;
    featured: boolean;
    order: number;
    createdAt: string;
    updatedAt: string;
}

export interface User {
    id: number;
    email: string;
    name: string;
    role: string;
}

export interface PostInput {
    title: string;
    slug?: string;
    content: string;
    excerpt: string;
    coverImage: string | null;
    published: boolean;
    featured: boolean;
    tags: string[];
    categoryId?: number | null;
}

export interface ProjectInput {
    name: string;
    slug?: string;
    summary: string;
    description: string;
    techStack: string;
    liveUrl?: string | null;
    repoUrl?: string | null;
    coverImage?: string | null;
    featured: boolean;
    order: number;
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

export interface AnalyticsSummary {
    totalPosts: number;
    totalViews: number;
    totalLikes: number;
    totalComments: number;
    pendingComments: number;
}

async function fetchJson<T>(input: string, init?: RequestInit): Promise<T> {
    const response = await fetch(input, {
        ...init,
        headers: {
            ...(init?.body && !(init.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
            ...getAuthHeaders(),
            ...init?.headers,
        },
    });

    if (!response.ok) {
        let message = 'Request failed';
        try {
            const data = (await response.json()) as { error?: string };
            if (data.error) {
                message = data.error;
            }
        } catch {
            message = response.statusText || message;
        }
        throw new Error(message);
    }

    if (response.status === 204) {
        return undefined as T;
    }

    return response.json() as Promise<T>;
}

function getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('auth_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
}

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

    return fetchJson(`${API_BASE}/posts?${query.toString()}`);
}

export async function fetchPost(slug: string): Promise<Post> {
    return fetchJson(`${API_BASE}/posts/${slug}`);
}

export async function createPost(post: PostInput): Promise<Post> {
    return fetchJson(`${API_BASE}/posts`, {
        method: 'POST',
        body: JSON.stringify(post),
    });
}

export async function updatePost(id: number, post: Partial<PostInput>): Promise<Post> {
    return fetchJson(`${API_BASE}/posts/${id}`, {
        method: 'PUT',
        body: JSON.stringify(post),
    });
}

export async function deletePost(id: number): Promise<void> {
    await fetchJson(`${API_BASE}/posts/${id}`, { method: 'DELETE' });
}

export async function likePost(slug: string): Promise<{ likes: number }> {
    return fetchJson(`${API_BASE}/posts/${slug}/like`, { method: 'POST' });
}

export async function fetchComments(postId: number): Promise<Comment[]> {
    return fetchJson(`${API_BASE}/comments?postId=${postId}`);
}

export async function createComment(data: {
    content: string;
    author: string;
    email?: string;
    postId: number;
    parentId?: number;
    turnstileToken?: string;
}): Promise<{ message: string; comment: Comment }> {
    return fetchJson(`${API_BASE}/comments`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export async function fetchAdminComments(status?: 'pending' | 'approved' | 'rejected') {
    const query = new URLSearchParams();
    if (status) query.set('status', status);
    return fetchJson<Comment[]>(`${API_BASE}/comments/admin?${query.toString()}`);
}

export async function updateCommentStatus(id: number, status: 'pending' | 'approved' | 'rejected') {
    return fetchJson<Comment>(`${API_BASE}/comments/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
    });
}

export async function fetchCategories(): Promise<Category[]> {
    return fetchJson(`${API_BASE}/categories`);
}

export async function fetchTags(): Promise<Tag[]> {
    return fetchJson(`${API_BASE}/tags`);
}

export async function fetchProjects(): Promise<Project[]> {
    return fetchJson(`${API_BASE}/projects`);
}

export async function createProject(project: ProjectInput): Promise<Project> {
    return fetchJson(`${API_BASE}/projects`, {
        method: 'POST',
        body: JSON.stringify(project),
    });
}

export async function updateProject(id: number, project: Partial<ProjectInput>): Promise<Project> {
    return fetchJson(`${API_BASE}/projects/${id}`, {
        method: 'PUT',
        body: JSON.stringify(project),
    });
}

export async function deleteProject(id: number) {
    return fetchJson<void>(`${API_BASE}/projects/${id}`, { method: 'DELETE' });
}

export async function uploadImage(file: File): Promise<{ url: string; filename: string; storage: 'local' | 'r2' }> {
    const formData = new FormData();
    formData.append('image', file);

    return fetchJson(`${API_BASE}/upload`, {
        method: 'POST',
        body: formData,
    });
}

export async function login(data: { email: string; password: string; turnstileToken?: string }) {
    return fetchJson<{ token: string; user: User }>(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: {},
        body: JSON.stringify(data),
    });
}

export async function fetchCurrentUser() {
    return fetchJson<User>(`${API_BASE}/auth/me`);
}

export async function fetchAnalyticsSummary() {
    return fetchJson<AnalyticsSummary>(`${API_BASE}/analytics/summary`);
}

export async function fetchTopPosts() {
    return fetchJson<Array<PostLink & { id: number; views: number; likes: number }>>(`${API_BASE}/analytics/top-posts`);
}
