import { useEffect, useState } from 'react';
import { siteConfig } from '../config/site';

interface WeatherSnapshot {
    temperature: number;
    apparentTemperature: number;
    windSpeed: number;
    weatherCode: number;
    isDay: number;
}

const weatherMap: Record<number, { label: string; icon: string }> = {
    0: { label: '晴朗', icon: '☀' },
    1: { label: '少云', icon: '⛅' },
    2: { label: '多云', icon: '☁' },
    3: { label: '阴天', icon: '☁' },
    45: { label: '雾', icon: '〰' },
    48: { label: '雾', icon: '〰' },
    51: { label: '毛毛雨', icon: '🌦' },
    61: { label: '小雨', icon: '🌧' },
    63: { label: '降雨', icon: '🌧' },
    71: { label: '降雪', icon: '❄' },
    80: { label: '阵雨', icon: '🌦' },
    95: { label: '雷暴', icon: '⛈' },
};

export default function WeatherCard() {
    const [weather, setWeather] = useState<WeatherSnapshot | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        async function fetchWeather() {
            try {
                const query = new URLSearchParams({
                    latitude: String(siteConfig.author.location.latitude),
                    longitude: String(siteConfig.author.location.longitude),
                    current: 'temperature_2m,apparent_temperature,weather_code,wind_speed_10m,is_day',
                    timezone: siteConfig.author.location.timezone,
                    forecast_days: '1',
                });

                const response = await fetch(`https://api.open-meteo.com/v1/forecast?${query.toString()}`);
                if (!response.ok) {
                    throw new Error('Weather request failed');
                }

                const data = (await response.json()) as {
                    current: {
                        temperature_2m: number;
                        apparent_temperature: number;
                        weather_code: number;
                        wind_speed_10m: number;
                        is_day: number;
                    };
                };

                if (cancelled) {
                    return;
                }

                setWeather({
                    temperature: data.current.temperature_2m,
                    apparentTemperature: data.current.apparent_temperature,
                    windSpeed: data.current.wind_speed_10m,
                    weatherCode: data.current.weather_code,
                    isDay: data.current.is_day,
                });
                setError(null);
            } catch {
                if (!cancelled) {
                    setError('天气数据暂时不可用');
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        fetchWeather();
        return () => {
            cancelled = true;
        };
    }, []);

    const weatherLabel = weather ? weatherMap[weather.weatherCode] || { label: '未知天气', icon: '◌' } : null;

    return (
        <aside className="panel weather-card" data-testid="weather-card">
            <div className="panel-body" style={{ display: 'grid', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '1rem' }}>
                    <div>
                        <div className="eyebrow">Weather Node</div>
                        <h3 style={{ marginTop: '1rem', fontSize: '1.5rem' }}>
                            {siteConfig.author.location.city}, {siteConfig.author.location.country}
                        </h3>
                    </div>
                    <span style={{ fontSize: '2rem' }} aria-hidden="true">
                        {weatherLabel?.icon || '◌'}
                    </span>
                </div>

                {loading ? (
                    <div className="muted" data-testid="weather-loading">正在同步天气信号...</div>
                ) : error || !weather ? (
                    <div className="muted" data-testid="weather-error">{error}</div>
                ) : (
                    <>
                        <div className="weather-temp" data-testid="weather-temperature">
                            {Math.round(weather.temperature)}°
                            <span className="muted" style={{ fontSize: '1rem', marginLeft: '0.5rem' }}>
                                {weatherLabel?.label}
                            </span>
                        </div>

                        <div className="two-grid">
                            <div className="metric-card" data-testid="weather-feels-like">
                                <span className="muted mono">体感温度</span>
                                <strong>{Math.round(weather.apparentTemperature)}°C</strong>
                            </div>
                            <div className="metric-card" data-testid="weather-wind">
                                <span className="muted mono">风速</span>
                                <strong>{Math.round(weather.windSpeed)} km/h</strong>
                            </div>
                        </div>

                        <p className="muted" style={{ margin: 0 }}>
                            用一张赛博风天气卡片给首页增加一点正在发生的现场感，同时保持信息价值。
                        </p>
                    </>
                )}
            </div>
        </aside>
    );
}
