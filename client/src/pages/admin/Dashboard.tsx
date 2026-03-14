import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { EChartsOption } from 'echarts';
import EChart from '../../components/EChart';
import { fetchAnalyticsDashboard, type AnalyticsDashboard } from '../../api/client';
import { useToast } from '../../hooks/useToast';
import { formatDateTime } from '../../lib/format';

const emptyDashboard: AnalyticsDashboard = {
    summary: { totalPosts: 0, totalViews: 0, totalLikes: 0, totalComments: 0, pendingComments: 0 },
    trend: [],
    topPosts: [],
    commentStatus: { pending: 0, approved: 0, rejected: 0 },
    recentActivity: [],
    startedAt: new Date().toISOString(),
};

const palette = {
    cyan: '#71f6ff',
    blue: '#6d88ff',
    pink: '#ff5ba9',
    gold: '#ffd36b',
    grid: 'rgba(255,255,255,0.08)',
    text: 'rgba(230,240,255,0.86)',
    muted: 'rgba(185,200,228,0.58)',
};

const workbenchLinks = [
    { to: '/admin/posts', label: '文章管理', description: '编辑、删除和筛选文章' },
    { to: '/admin/projects', label: '项目管理', description: '维护公开项目与草稿状态' },
    { to: '/admin/comments', label: '评论管理', description: '处理审核队列与评论状态' },
    { to: '/admin/homepage', label: '首页编排', description: '整理首页精选与 CTA' },
    { to: '/admin/newsletter', label: 'Newsletter', description: '管理 issue 与发送队列' },
    { to: '/admin/series', label: '专栏管理', description: '维护专栏信息与章节顺序' },
    { to: '/admin/taxonomy', label: '分类与标签', description: '清理前台筛选项与脏标签' },
    { to: '/admin/api-keys', label: 'API Key', description: '维护开放发布凭证' },
];

export default function Dashboard() {
    const { showToast } = useToast();
    const [dashboard, setDashboard] = useState<AnalyticsDashboard>(emptyDashboard);
    const [loading, setLoading] = useState(true);

    const reload = async () => {
        const response = await fetchAnalyticsDashboard();
        setDashboard(response);
    };

    useEffect(() => {
        reload()
            .catch(() => showToast('后台数据读取失败。', 'error'))
            .finally(() => setLoading(false));
    }, [showToast]);

    const trendOption = useMemo<EChartsOption>(() => ({
        backgroundColor: 'transparent',
        animationDuration: 700,
        grid: { left: 18, right: 18, top: 26, bottom: 18, containLabel: true },
        tooltip: {
            trigger: 'axis',
            backgroundColor: 'rgba(8,12,28,0.94)',
            borderColor: 'rgba(113,246,255,0.18)',
            textStyle: { color: '#eef4ff' },
        },
        legend: {
            top: 0,
            right: 0,
            textStyle: { color: palette.muted },
            itemWidth: 10,
            itemHeight: 10,
        },
        xAxis: {
            type: 'category',
            boundaryGap: false,
            data: dashboard.trend.map((item) => item.date.slice(5)),
            axisLine: { lineStyle: { color: palette.grid } },
            axisTick: { show: false },
            axisLabel: { color: palette.muted },
        },
        yAxis: {
            type: 'value',
            splitLine: { lineStyle: { color: palette.grid } },
            axisLabel: { color: palette.muted },
        },
        series: [
            { name: '浏览', type: 'line', smooth: true, symbol: 'none', lineStyle: { color: palette.cyan, width: 3 }, areaStyle: { opacity: 0.16, color: palette.cyan }, data: dashboard.trend.map((item) => item.views) },
            { name: '点赞', type: 'line', smooth: true, symbol: 'none', lineStyle: { color: palette.blue, width: 2 }, data: dashboard.trend.map((item) => item.likes) },
            { name: '评论', type: 'line', smooth: true, symbol: 'none', lineStyle: { color: palette.pink, width: 2 }, data: dashboard.trend.map((item) => item.comments) },
        ],
    }), [dashboard.trend]);

    const topPostsOption = useMemo<EChartsOption>(() => ({
        backgroundColor: 'transparent',
        animationDuration: 700,
        grid: { left: 10, right: 10, top: 10, bottom: 10, containLabel: true },
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' },
            backgroundColor: 'rgba(8,12,28,0.94)',
            borderColor: 'rgba(109,136,255,0.18)',
            textStyle: { color: '#eef4ff' },
        },
        xAxis: {
            type: 'value',
            axisLabel: { color: palette.muted },
            splitLine: { lineStyle: { color: palette.grid } },
        },
        yAxis: {
            type: 'category',
            axisTick: { show: false },
            axisLine: { show: false },
            axisLabel: { color: palette.text },
            data: dashboard.topPosts.map((item) => item.title.length > 16 ? `${item.title.slice(0, 16)}…` : item.title),
        },
        series: [
            { type: 'bar', barWidth: 14, data: dashboard.topPosts.map((item) => item.views), itemStyle: { color: palette.cyan, borderRadius: [0, 10, 10, 0] } },
        ],
    }), [dashboard.topPosts]);

    const commentHealthOption = useMemo<EChartsOption>(() => ({
        backgroundColor: 'transparent',
        tooltip: {
            trigger: 'item',
            backgroundColor: 'rgba(8,12,28,0.94)',
            borderColor: 'rgba(255,91,169,0.18)',
            textStyle: { color: '#eef4ff' },
        },
        legend: {
            bottom: 0,
            textStyle: { color: palette.muted },
            itemWidth: 10,
            itemHeight: 10,
        },
        series: [
            {
                type: 'pie',
                radius: ['58%', '80%'],
                center: ['50%', '44%'],
                itemStyle: { borderColor: 'rgba(6,9,22,1)', borderWidth: 4 },
                label: { color: palette.text, formatter: '{d}%' },
                data: [
                    { value: dashboard.commentStatus.pending, name: '待审核', itemStyle: { color: palette.pink } },
                    { value: dashboard.commentStatus.approved, name: '已通过', itemStyle: { color: palette.cyan } },
                    { value: dashboard.commentStatus.rejected, name: '已拒绝', itemStyle: { color: palette.gold } },
                ].filter((item) => item.value > 0),
            },
        ],
    }), [dashboard.commentStatus]);

    if (loading) {
        return (
            <section className="section">
                <div className="container">
                    <div className="empty-state">正在加载后台数据...</div>
                </div>
            </section>
        );
    }

    return (
        <section className="section">
            <div className="container admin-shell admin-dashboard-shell admin-dashboard-v2">
                <header className="feature-panel admin-overview-panel">
                    <div className="admin-overview-copy">
                        <div className="eyebrow">运营控制室</div>
                        <h1 className="section-title admin-page-title">内容运营总览</h1>
                        <p className="lead admin-page-lead">
                            Dashboard 只负责全局视图：看趋势、看风险、看近期动作。重编辑操作已经拆到独立管理页。
                        </p>
                    </div>
                    <div className="admin-overview-actions">
                        <Link to="/editor" className="btn btn-primary">新建文章</Link>
                        <Link to="/admin/posts" className="btn btn-secondary">文章管理</Link>
                        <Link to="/admin/projects" className="btn btn-secondary">项目管理</Link>
                        <Link to="/" className="btn btn-ghost">查看首页</Link>
                    </div>
                    <div className="admin-summary-strip">
                        <div className="metric-card stat-panel"><span className="muted mono">ARTICLES</span><h2>{dashboard.summary.totalPosts}</h2><p>累计内容资产</p></div>
                        <div className="metric-card stat-panel"><span className="muted mono">VIEWS</span><h2>{dashboard.summary.totalViews}</h2><p>总浏览量</p></div>
                        <div className="metric-card stat-panel"><span className="muted mono">COMMENTS</span><h2>{dashboard.summary.totalComments}</h2><p>总评论与互动</p></div>
                        <div className="metric-card stat-panel"><span className="muted mono">QUEUE</span><h2>{dashboard.summary.pendingComments}</h2><p>待审核消息</p></div>
                    </div>
                </header>

                <section className="feature-panel">
                    <div className="editor-card-head">
                        <strong>运营入口</strong>
                        <span className="command-hint">拆分后的独立工作台</span>
                    </div>
                    <div className="activity-grid-list">
                        {workbenchLinks.map((item) => (
                            <Link key={item.to} to={item.to} className="activity-tile">
                                <span className="chip mono">WORKBENCH</span>
                                <strong>{item.label}</strong>
                                <p className="muted">{item.description}</p>
                                <span className="section-link">进入</span>
                            </Link>
                        ))}
                    </div>
                </section>

                <section className="admin-analytics-stage">
                    <div className="feature-panel chart-panel chart-panel-wide" data-testid="dashboard-trend-chart">
                        <div className="editor-card-head">
                            <strong>内容热度趋势</strong>
                            <span className="command-hint">统计起始：{formatDateTime(dashboard.startedAt)}</span>
                        </div>
                        {dashboard.trend.length ? <EChart option={trendOption} className="echart-canvas" height={360} /> : <div className="empty-state">趋势统计会从这次升级后开始沉淀。</div>}
                    </div>

                    <div className="admin-side-stack">
                        <div className="feature-panel chart-panel" data-testid="dashboard-top-posts-chart">
                            <div className="editor-card-head"><strong>文章表现排行</strong><span className="command-hint">重点内容</span></div>
                            {dashboard.topPosts.length ? <EChart option={topPostsOption} className="echart-canvas" height={260} /> : <div className="empty-state">还没有足够的内容表现数据。</div>}
                        </div>
                        <div className="feature-panel chart-panel" data-testid="dashboard-comment-chart">
                            <div className="editor-card-head"><strong>评论健康度</strong><span className="command-hint">审核队列</span></div>
                            {(dashboard.commentStatus.pending || dashboard.commentStatus.approved || dashboard.commentStatus.rejected)
                                ? <EChart option={commentHealthOption} className="echart-canvas" height={260} />
                                : <div className="empty-state">当前还没有评论审核数据。</div>}
                        </div>
                    </div>
                </section>

                <section className="feature-panel">
                    <div className="editor-card-head"><strong>最近活动</strong><span className="command-hint">近时段动态</span></div>
                    <div className="activity-list activity-grid-list">
                        {dashboard.recentActivity.length ? dashboard.recentActivity.map((item) => (
                            <article key={`${item.type}-${item.createdAt}-${item.title}`} className="activity-tile">
                                <span className="chip mono">{item.type.replace('_', ' ')}</span>
                                <strong>{item.title}</strong>
                                <p className="muted">{item.description}</p>
                                <span className="command-hint">{formatDateTime(item.createdAt)}</span>
                            </article>
                        )) : <div className="empty-state">还没有可展示的活动记录。</div>}
                    </div>
                </section>
            </div>
        </section>
    );
}
