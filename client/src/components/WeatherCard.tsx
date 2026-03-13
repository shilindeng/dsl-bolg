import { useEffect, useState } from 'react';
import { siteConfig } from '../config/site';

interface WeatherSnapshot {
    temperature: number;
    apparentTemperature: number;
    windSpeed: number;
    weatherCode: number;
}

const weatherMap: Record<number, { label: string; icon: string }> = {
    0: { label: '晴朗', icon: 'SUN' },
    1: { label: '少云', icon: 'CLR' },
    2: { label: '多云', icon: 'CLD' },
    3: { label: '阴天', icon: 'OVR' },
    45: { label: '雾', icon: 'FOG' },
    48: { label: '浓雾', icon: 'FOG' },
    51: { label: '毛毛雨', icon: 'DRZ' },
    61: { label: '小雨', icon: 'RAN' },
    63: { label: '降雨', icon: 'RAN' },
    71: { label: '降雪', icon: 'SNW' },
    80: { label: '阵雨', icon: 'SHW' },
    95: { label: '雷暴', icon: 'STM' },
};

const studioLocation = {
    city: siteConfig.author.location.city,
    country: siteConfig.author.location.country,
    latitude: siteConfig.author.location.latitude,
    longitude: siteConfig.author.location.longitude,
    timezone: siteConfig.author.location.timezone,
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
                    latitude: String(studioLocation.latitude),
                    longitude: String(studioLocation.longitude),
                    current: 'temperature_2m,apparent_temperature,weather_code,wind_speed_10m',
                    timezone: studioLocation.timezone,
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
                });
                setError(null);
            } catch {
                if (!cancelled) {
                    setError('天气信息暂时不可用。');
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

    const weatherLabel = weather ? weatherMap[weather.weatherCode] || { label: '未知天气', icon: 'N/A' } : null;

    return (
        <aside className="weather-card" data-testid="weather-card">
            <div className="weather-card-head">
                <div>
                    <div className="eyebrow">工作室天气</div>
                    <h3>
                        {studioLocation.city}, {studioLocation.country}
                    </h3>
                    <p className="muted weather-location-note" data-testid="weather-location-note">
                        当前明确显示站点基准城市天气，不再伪装成访客定位结果。
                    </p>
                </div>
                <span className="weather-code mono">{weatherLabel?.icon || '...'}</span>
            </div>

            {loading ? (
                <div className="muted" data-testid="weather-loading">正在同步工作室天气...</div>
            ) : error || !weather ? (
                <div className="muted" data-testid="weather-error">{error}</div>
            ) : (
                <>
                    <div className="weather-value" data-testid="weather-temperature">
                        {Math.round(weather.temperature)}°
                    </div>
                    <p className="weather-description">{weatherLabel?.label}</p>

                    <div className="weather-metrics">
                        <div className="metric-card" data-testid="weather-feels-like">
                            <span className="muted mono">体感温度</span>
                            <strong>{Math.round(weather.apparentTemperature)}°C</strong>
                        </div>
                        <div className="metric-card" data-testid="weather-wind">
                            <span className="muted mono">风速</span>
                            <strong>{Math.round(weather.windSpeed)} km/h</strong>
                        </div>
                    </div>

                    <p className="muted">
                        这个模块只保留现场感，不再抢首页主叙事；它表达的是作者当前工作环境，而不是访客画像。
                    </p>
                </>
            )}
        </aside>
    );
}
