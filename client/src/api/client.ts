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
    userId?: number | null;
    parentId: number | null;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: string;
    updatedAt?: string;
    isOwner?: boolean;
    user?: {
        id: number;
        name: string;
        avatarUrl?: string | null;
        email?: string;
    } | null;
    replies?: Comment[];
    post?: PostLink & { id: number };
    parent?: { id: number; author: string } | null;
}

export interface Post {
    id: number;
    title: string;
    slug: string;
    deck?: string | null;
    excerpt: string;
    content: string;
    coverImage: string | null;
    coverAlt?: string | null;
    sourceUrl?: string | null;
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
    series?: {
        id: number;
        title: string;
        slug: string;
        summary?: string | null;
        description?: string | null;
        coverImage?: string | null;
        status?: string;
        order?: number;
    } | null;
    seriesOrder?: number | null;
    viewerState?: { bookmarked: boolean };
}

export interface Project {
    id: number;
    name: string;
    slug: string;
    headline?: string | null;
    summary: string;
    description: string;
    techStack: string;
    published: boolean;
    status?: string | null;
    period?: string | null;
    role?: string | null;
    liveUrl: string | null;
    repoUrl: string | null;
    coverImage: string | null;
    featured: boolean;
    order: number;
    createdAt: string;
    updatedAt: string;
}

export interface Series {
    id: number;
    title: string;
    slug: string;
    summary: string | null;
    description: string | null;
    coverImage: string | null;
    status: string;
    order: number;
    createdAt: string;
    updatedAt: string;
    stats?: {
        totalPosts?: number;
        publishedPosts?: number;
        lastUpdatedAt?: string | null;
    };
}

export interface SeriesPost {
    id: number;
    title: string;
    slug: string;
    deck: string | null;
    excerpt: string;
    coverImage: string | null;
    coverAlt: string | null;
    publishedAt: string | null;
    createdAt: string;
    updatedAt: string;
    seriesOrder: number | null;
    meta?: PostMeta | null;
    category?: Category | null;
    tags: Tag[];
}

export interface SeriesDetail extends Series {
    posts: SeriesPost[];
}

export interface User {
    id: number;
    email: string;
    name: string;
    role: string;
    avatarUrl?: string | null;
    bio?: string | null;
    emailVerifiedAt?: string | null;
    lastLoginAt?: string | null;
    createdAt?: string;
}

export interface PostInput {
    title: string;
    slug?: string;
    deck?: string;
    content: string;
    excerpt: string;
    coverImage: string | null;
    coverAlt?: string | null;
    published: boolean;
    featured: boolean;
    tags: string[];
    categoryId?: number | null;
    seriesId?: number | null;
    seriesOrder?: number | null;
}

export interface ProjectInput {
    name: string;
    slug?: string;
    headline?: string | null;
    summary: string;
    description: string;
    techStack: string;
    published: boolean;
    status?: string | null;
    period?: string | null;
    role?: string | null;
    liveUrl?: string | null;
    repoUrl?: string | null;
    coverImage?: string | null;
    featured: boolean;
    order: number;
}

export interface AccountComment extends Comment {
    post?: PostLink & { id: number };
}

export interface BookmarkRecord {
    id: number;
    createdAt: string;
    post: Post;
}

export interface ReadingHistoryRecord {
    id: number;
    createdAt: string;
    lastViewedAt: string;
    viewCount: number;
    post: Post;
}

export interface NewsletterSubscriber {
    id: number;
    email: string;
    status: string;
    source: string;
    confirmedAt: string | null;
    unsubscribedAt: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface NewsletterDelivery {
    id: number;
    status: string;
    providerMessageId: string | null;
    errorMessage: string | null;
    sentAt: string | null;
    createdAt: string;
}

export interface NewsletterIssue {
    id: number;
    title: string;
    slug: string;
    subject: string;
    previewText: string;
    bodyMarkdown: string;
    status: string;
    sentAt: string | null;
    createdAt: string;
    updatedAt: string;
    deliveries?: NewsletterDelivery[];
}

export interface HomepageSection {
    id: number;
    type: string;
    enabled: boolean;
    sortOrder: number;
    sourceType: string;
    eyebrow: string | null;
    title: string | null;
    description: string | null;
    ctaLabel: string | null;
    ctaHref: string | null;
    configJson: string | null;
    config?: {
        postIds?: number[];
        projectIds?: number[];
        limit?: number;
        autoFill?: boolean;
        hidden?: boolean;
    };
    items?: Array<Post | Project>;
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

export interface AnalyticsTrendPoint {
    date: string;
    views: number;
    likes: number;
    comments: number;
}

export interface AnalyticsTopPost extends PostLink {
    id: number;
    views: number;
    likes: number;
    comments: number;
    score: number;
}

export interface DashboardActivityItem {
    type: string;
    title: string;
    slug: string;
    description: string;
    createdAt: string;
}

export interface AnalyticsDashboard {
    summary: AnalyticsSummary;
    trend: AnalyticsTrendPoint[];
    topPosts: AnalyticsTopPost[];
    commentStatus: {
        pending: number;
        approved: number;
        rejected: number;
    };
    recentActivity: DashboardActivityItem[];
    startedAt: string;
}

export interface ApiKeyRecord {
    id: number;
    name: string;
    keyPrefix: string;
    scopes: string[];
    lastUsedAt: string | null;
    revokedAt: string | null;
    createdAt: string;
}

export interface CreatedApiKey extends ApiKeyRecord {
    key: string;
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
    postId: number;
    parentId?: number;
}): Promise<{ message: string; comment: Comment }> {
    return fetchJson(`${API_BASE}/comments`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export async function fetchAdminComments(status?: 'pending' | 'approved' | 'rejected', filters?: { postId?: number; userId?: number }) {
    const query = new URLSearchParams();
    if (status) query.set('status', status);
    if (filters?.postId) query.set('postId', String(filters.postId));
    if (filters?.userId) query.set('userId', String(filters.userId));
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

export async function fetchAdminProjects(): Promise<Project[]> {
    return fetchJson(`${API_BASE}/projects/admin`);
}

export async function fetchProject(slug: string): Promise<Project> {
    return fetchJson(`${API_BASE}/projects/${slug}`);
}

export async function fetchSeries() {
    return fetchJson<Series[]>(`${API_BASE}/series`);
}

export async function fetchSeriesDetail(slug: string) {
    return fetchJson<SeriesDetail>(`${API_BASE}/series/${slug}`);
}

export async function fetchAdminSeries() {
    return fetchJson<Series[]>(`${API_BASE}/series/admin`);
}

export async function createSeries(data: {
    title: string;
    slug?: string;
    summary?: string | null;
    description?: string | null;
    coverImage?: string | null;
    status?: string | null;
    order?: number | string | null;
}) {
    return fetchJson<Series>(`${API_BASE}/series`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export async function updateSeries(id: number, data: Partial<{
    title: string;
    slug: string;
    summary: string | null;
    description: string | null;
    coverImage: string | null;
    status: string | null;
    order: number | string | null;
}>) {
    return fetchJson<Series>(`${API_BASE}/series/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
}

export async function deleteSeries(id: number) {
    return fetchJson<void>(`${API_BASE}/series/${id}`, { method: 'DELETE' });
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

export async function uploadOpenApiImage(file: File, apiKey: string): Promise<{ url: string; filename: string; storage: 'local' | 'r2' }> {
    const formData = new FormData();
    formData.append('image', file);

    return fetchJson(`${API_BASE}/open/v1/media`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}` },
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

export async function requestLoginCode(data: { email: string; turnstileToken?: string }) {
    return fetchJson<{ message: string; expiresAt: string; previewCode?: string }>(`${API_BASE}/auth/request-code`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export async function verifyLoginCode(data: { email: string; code: string }) {
    return fetchJson<{ token: string; user: User }>(`${API_BASE}/auth/verify-code`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export async function logout() {
    return fetchJson<void>(`${API_BASE}/auth/logout`, {
        method: 'POST',
    });
}

export async function fetchCurrentUser() {
    return fetchJson<User>(`${API_BASE}/auth/me`);
}

export async function fetchAccountProfile() {
    return fetchJson<User>(`${API_BASE}/account/profile`);
}

export async function updateAccountProfile(data: { name?: string; avatarUrl?: string | null; bio?: string | null }) {
    return fetchJson<User>(`${API_BASE}/account/profile`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    });
}

export async function fetchAccountComments() {
    return fetchJson<AccountComment[]>(`${API_BASE}/account/comments`);
}

export async function fetchBookmarks() {
    return fetchJson<BookmarkRecord[]>(`${API_BASE}/account/bookmarks`);
}

export async function addBookmark(postId: number) {
    return fetchJson<{ id: number }>(`${API_BASE}/account/bookmarks/${postId}`, {
        method: 'POST',
    });
}

export async function removeBookmark(postId: number) {
    return fetchJson<void>(`${API_BASE}/account/bookmarks/${postId}`, {
        method: 'DELETE',
    });
}

export async function fetchReadingHistory() {
    return fetchJson<ReadingHistoryRecord[]>(`${API_BASE}/account/history`);
}

export async function subscribeNewsletter(data: { email: string; turnstileToken?: string; source?: string }) {
    return fetchJson<{ message: string; expiresAt: string; preview?: { preview?: string } }>(`${API_BASE}/newsletter/subscribe`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export async function confirmNewsletter(data: { email: string; token: string }) {
    return fetchJson<NewsletterSubscriber>(`${API_BASE}/newsletter/confirm`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export async function unsubscribeNewsletter(data: { email: string; token: string }) {
    return fetchJson<NewsletterSubscriber>(`${API_BASE}/newsletter/unsubscribe`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export async function fetchNewsletterIssues() {
    return fetchJson<NewsletterIssue[]>(`${API_BASE}/newsletter/issues`);
}

export async function fetchNewsletterIssue(slug: string) {
    return fetchJson<NewsletterIssue>(`${API_BASE}/newsletter/issues/${slug}`);
}

export async function fetchNewsletterSubscribers() {
    return fetchJson<NewsletterSubscriber[]>(`${API_BASE}/newsletter/admin/subscribers`);
}

export async function fetchAdminNewsletterIssues() {
    return fetchJson<NewsletterIssue[]>(`${API_BASE}/newsletter/admin/issues`);
}

export async function createNewsletterIssue(data: {
    title: string;
    slug?: string;
    subject: string;
    previewText?: string;
    bodyMarkdown: string;
    status?: string;
}) {
    return fetchJson<NewsletterIssue>(`${API_BASE}/newsletter/admin/issues`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export async function updateNewsletterIssue(id: number, data: {
    title?: string;
    slug?: string;
    subject?: string;
    previewText?: string;
    bodyMarkdown?: string;
    status?: string;
}) {
    return fetchJson<NewsletterIssue>(`${API_BASE}/newsletter/admin/issues/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
}

export async function sendNewsletterIssue(id: number) {
    return fetchJson<{ issue: NewsletterIssue; message: string }>(`${API_BASE}/newsletter/admin/issues/${id}/send`, {
        method: 'POST',
    });
}

export async function fetchHomepage() {
    return fetchJson<{ sections: HomepageSection[] }>(`${API_BASE}/homepage`);
}

export async function fetchAdminHomepage() {
    return fetchJson<{ sections: HomepageSection[] }>(`${API_BASE}/homepage/admin`);
}

export async function saveAdminHomepage(sections: HomepageSection[]) {
    return fetchJson<{ sections: HomepageSection[] }>(`${API_BASE}/homepage/admin`, {
        method: 'PUT',
        body: JSON.stringify({ sections }),
    });
}

export async function fetchAnalyticsSummary() {
    return fetchJson<AnalyticsSummary>(`${API_BASE}/analytics/summary`);
}

export async function fetchTopPosts() {
    return fetchJson<Array<PostLink & { id: number; views: number; likes: number }>>(`${API_BASE}/analytics/top-posts`);
}

export async function fetchAnalyticsDashboard(days = 30) {
    return fetchJson<AnalyticsDashboard>(`${API_BASE}/analytics/dashboard?days=${days}`);
}

export async function fetchApiKeys() {
    return fetchJson<ApiKeyRecord[]>(`${API_BASE}/open/admin/keys`);
}

export async function createApiKey(data: { name: string; scopes: string[] }) {
    return fetchJson<CreatedApiKey>(`${API_BASE}/open/admin/keys`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export async function revokeApiKey(id: number) {
    return fetchJson<{ id: number; revokedAt: string }>(`${API_BASE}/open/admin/keys/${id}/revoke`, {
        method: 'POST',
    });
}

export async function createCategory(data: { name: string }) {
    return fetchJson<Category>(`${API_BASE}/categories`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export async function updateCategory(id: number, data: { name: string }) {
    return fetchJson<Category>(`${API_BASE}/categories/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
}

export async function deleteCategory(id: number) {
    return fetchJson<void>(`${API_BASE}/categories/${id}`, {
        method: 'DELETE',
    });
}

export async function createTag(data: { name: string }) {
    return fetchJson<Tag>(`${API_BASE}/tags`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export async function updateTag(id: number, data: { name: string }) {
    return fetchJson<Tag>(`${API_BASE}/tags/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
}

export async function deleteTag(id: number) {
    return fetchJson<void>(`${API_BASE}/tags/${id}`, {
        method: 'DELETE',
    });
}
