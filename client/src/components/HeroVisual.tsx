import type { Post, Project } from '../api/client';

interface HeroVisualProps {
    featuredPost?: Post;
    featuredProject?: Project;
}

export default function HeroVisual({ featuredPost, featuredProject }: HeroVisualProps) {
    const editorialTags = featuredPost?.tags?.slice(0, 3).map((tag) => tag.name) || ['内容系统', '界面表达', '长期运营'];

    return (
        <div className="hero-visual-stage" aria-hidden="true">
            <div className="hero-visual-orb hero-visual-orb-a" />
            <div className="hero-visual-orb hero-visual-orb-b" />
            <div className="hero-visual-grid" />

            <div className="hero-visual-card hero-visual-card-main">
                <span className="hero-visual-label mono">编辑主轴</span>
                <strong>{featuredPost?.title || '把博客经营成真正的长期数字资产。'}</strong>
                <p>{featuredPost?.excerpt || '写作、分发、视觉和部署不再分散，而是被收进一套可持续迭代的个人品牌系统。'}</p>
                <div className="hero-visual-tags">
                    {editorialTags.map((tag) => (
                        <span key={tag} className="tag">{tag}</span>
                    ))}
                </div>
            </div>

            <div className="hero-visual-card hero-visual-card-float hero-visual-card-top">
                <span className="hero-visual-kicker mono">项目信号</span>
                <strong>{featuredProject?.name || '内容与项目联动的品牌面板'}</strong>
                <p>{featuredProject?.summary || '项目页不是附属品，而是与文章、作者和方法论并列呈现的价值信号。'}</p>
            </div>

            <div className="hero-visual-card hero-visual-card-float hero-visual-card-bottom">
                <span className="hero-visual-kicker mono">运行结构</span>
                <div className="hero-visual-stats">
                    <div>
                        <span className="muted mono">内容层</span>
                        <strong>博客归档</strong>
                    </div>
                    <div>
                        <span className="muted mono">控制层</span>
                        <strong>管理后台</strong>
                    </div>
                    <div>
                        <span className="muted mono">分发层</span>
                        <strong>开放发布</strong>
                    </div>
                </div>
            </div>

            <div className="hero-visual-beam" />
        </div>
    );
}
