import { Link } from 'react-router-dom';
import SiteIcon from '../components/SiteIcon';

export default function NotFound() {
    return (
        <section className="section">
            <div className="container">
                <div className="empty-state">
                    <span className="eyebrow">404</span>
                    <h1 className="section-title">这个地址不存在</h1>
                    <p className="section-copy">你访问的页面可能已被移动、删除，或者当前链接本身已经失效。</p>
                    <div className="hero-actions">
                        <Link to="/" className="btn btn-primary">
                            <SiteIcon name="home" size={14} />
                            <span>返回首页</span>
                        </Link>
                        <Link to="/blog" className="btn btn-secondary">
                            <SiteIcon name="book-open" size={14} />
                            <span>进入博客</span>
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
