import { Link } from 'react-router-dom';

export default function NotFound() {
    return (
        <section className="section">
            <div className="container">
                <div className="empty-state" style={{ display: 'grid', gap: '1rem' }}>
                    <span className="eyebrow">404</span>
                    <h1 className="section-title">这个地址不存在</h1>
                    <p className="muted" style={{ margin: 0 }}>
                        你访问的页面可能被移动、删除，或者链接本身已经失效。
                    </p>
                    <div>
                        <Link to="/" className="btn btn-primary">返回首页</Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
