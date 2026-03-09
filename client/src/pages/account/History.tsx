import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchReadingHistory, type ReadingHistoryRecord } from '../../api/client';
import { formatDateTime } from '../../lib/format';

export default function AccountHistoryPage() {
    const [history, setHistory] = useState<ReadingHistoryRecord[]>([]);

    useEffect(() => {
        fetchReadingHistory().then(setHistory).catch(() => setHistory([]));
    }, []);

    return (
        <div className="feature-panel">
            <div className="section-heading">
                <div>
                    <div className="eyebrow">Reading History</div>
                    <h2 className="section-title">阅读历史</h2>
                </div>
            </div>
            {history.length ? (
                <div className="account-list">
                    {history.map((item) => (
                        <Link key={item.id} to={`/blog/${item.post.slug}`} className="archive-row">
                            <div>
                                <h3>{item.post.title}</h3>
                                <p>最近阅读于 {formatDateTime(item.lastViewedAt)}</p>
                            </div>
                            <span className="command-hint">{item.viewCount} 次</span>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="empty-state">登录后阅读过的文章会显示在这里。</div>
            )}
        </div>
    );
}
