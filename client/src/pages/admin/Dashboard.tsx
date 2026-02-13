import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import GlitchText from '../../components/GlitchText';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function Dashboard() {
    const [stats, setStats] = useState({
        totalPosts: 0,
        totalViews: 0,
        totalLikes: 0,
        totalComments: 0
    });
    const [topPosts, setTopPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch data from our new Analytics API
        // But wait, our client.ts doesn't have analytics methods yet.
        // We can use supabase client to call our API? 
        // Or better, just add a fetch call here with token.

        const fetchData = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            if (!token) return;

            const headers = { 'Authorization': `Bearer ${token}` };

            try {
                const [summaryRes, topRes] = await Promise.all([
                    fetch('http://localhost:3001/api/analytics/summary', { headers }),
                    fetch('http://localhost:3001/api/analytics/top-posts', { headers })
                ]);

                if (summaryRes.ok) setStats(await summaryRes.json());
                if (topRes.ok) setTopPosts(await topRes.json());
            } catch (error) {
                console.error('Dashboard fetch error', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) return <div>Loading Matrix...</div>;

    // Fake trend data for chart if we don't have real time-series yet
    const data = [
        { name: 'Mon', uv: 4000, pv: 2400 },
        { name: 'Tue', uv: 3000, pv: 1398 },
        { name: 'Wed', uv: 2000, pv: 9800 },
        { name: 'Thu', uv: 2780, pv: 3908 },
        { name: 'Fri', uv: 1890, pv: 4800 },
        { name: 'Sat', uv: 2390, pv: 3800 },
        { name: 'Sun', uv: 3490, pv: 4300 },
    ];

    const cardStyle = {
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid var(--border-dim)',
        padding: '20px',
        borderRadius: '8px',
        position: 'relative' as const
    };

    return (
        <div className="container" style={{ paddingTop: 'var(--space-3xl)', paddingBottom: 'var(--space-3xl)' }}>
            <h1 style={{ marginBottom: 'var(--space-xl)', color: 'var(--accent-cyan)' }}>
                <GlitchText text="ADMIN_DASHBOARD" />
            </h1>

            {/* Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '40px' }}>
                <div style={cardStyle}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>TOTAL POSTS</div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>{stats.totalPosts}</div>
                </div>
                <div style={cardStyle}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>TOTAL VIEWS</div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--accent-pink)' }}>{stats.totalViews}</div>
                </div>
                <div style={cardStyle}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>TOTAL LIKES</div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--accent-purple)' }}>{stats.totalLikes}</div>
                </div>
                <div style={cardStyle}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>COMMENTS</div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>{stats.totalComments}</div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
                {/* Main Chart */}
                <div style={{ ...cardStyle, height: '400px' }}>
                    <h3 style={{ marginBottom: '20px', color: 'var(--text-secondary)' }}>TRAFFIC_MONITOR (SIMULATED)</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                            <XAxis dataKey="name" stroke="var(--text-muted)" />
                            <YAxis stroke="var(--text-muted)" />
                            <Tooltip
                                contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--accent-cyan)' }}
                            />
                            <Bar dataKey="pv" fill="var(--accent-cyan)" />
                            <Bar dataKey="uv" fill="var(--accent-pink)" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Top Posts */}
                <div style={cardStyle}>
                    <h3 style={{ marginBottom: '20px', color: 'var(--text-secondary)' }}>TOP_POSTS</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {topPosts.map((p, i) => (
                            <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px' }}>
                                <div>
                                    <span style={{ color: 'var(--accent-purple)', marginRight: '10px' }}>#{i + 1}</span>
                                    <span style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>{p.title.substring(0, 20)}...</span>
                                </div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                    {p.meta?.[0]?.views || p.views || 0} 👀
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
