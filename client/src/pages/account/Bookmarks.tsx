import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchBookmarks, type BookmarkRecord } from '../../api/client';

export default function AccountBookmarksPage() {
    const [bookmarks, setBookmarks] = useState<BookmarkRecord[]>([]);

    useEffect(() => {
        fetchBookmarks().then(setBookmarks).catch(() => setBookmarks([]));
    }, []);

    return (
        <div className="feature-panel">
            <div className="section-heading">
                <div>
                    <div className="eyebrow">Bookmarks</div>
                    <h2 className="section-title">我的收藏</h2>
                </div>
            </div>
            {bookmarks.length ? (
                <div className="account-list">
                    {bookmarks.map((bookmark) => (
                        <Link key={bookmark.id} to={`/blog/${bookmark.post.slug}`} className="archive-row">
                            <div>
                                <h3>{bookmark.post.title}</h3>
                                <p>{bookmark.post.excerpt}</p>
                            </div>
                            <span className="command-hint">已收藏</span>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="empty-state">还没有收藏文章，去正文页试试“收藏文章”。</div>
            )}
        </div>
    );
}
