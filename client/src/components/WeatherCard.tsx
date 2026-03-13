import { useEffect, useMemo, useState } from 'react';
import { siteConfig } from '../config/site';

interface WeatherSnapshot {
    temperature: number;
    apparentTemperature: number;
    windSpeed: number;
    weatherCode: number;
    fetchedAt: number;
}

type WeatherVariant =
    | 'clear'
    | 'cloudy'
    | 'overcast'
    | 'fog'
    | 'drizzle'
    | 'rain'
    | 'shower'
    | 'snow'
    | 'storm'
    | 'unknown';

const WEATHER_CACHE_KEY = 'dsl-blog:weather-snapshot:v3';
const WEATHER_CACHE_TTL = 30 * 60 * 1000;

function getVariant(code: number): WeatherVariant {
    if (code === 0) return 'clear';
    if (code === 1 || code === 2) return 'cloudy';
    if (code === 3) return 'overcast';
    if (code === 45 || code === 48) return 'fog';

    if (code === 51 || code === 53 || code === 55 || code === 56 || code === 57) return 'drizzle';

    if (code === 61 || code === 63 || code === 65 || code === 66 || code === 67) return 'rain';

    if (code === 80 || code === 81 || code === 82) return 'shower';

    if (code === 71 || code === 73 || code === 75 || code === 77 || code === 85 || code === 86) return 'snow';

    if (code === 95 || code === 96 || code === 99) return 'storm';

    return 'unknown';
}

function getWeatherLabel(code: number) {
    switch (code) {
        case 0:
            return '晴朗';
        case 1:
            return '晴间少云';
        case 2:
            return '多云';
        case 3:
            return '阴';
        case 45:
        case 48:
            return '雾';
        case 51:
        case 53:
        case 55:
            return '毛毛雨';
        case 56:
        case 57:
            return '冻雨（毛毛雨）';
        case 61:
            return '小雨';
        case 63:
            return '中雨';
        case 65:
            return '大雨';
        case 66:
        case 67:
            return '冻雨';
        case 71:
            return '小雪';
        case 73:
            return '中雪';
        case 75:
            return '大雪';
        case 77:
            return '雪粒';
        case 80:
            return '阵雨';
        case 81:
            return '强阵雨';
        case 82:
            return '暴雨（阵雨）';
        case 85:
            return '阵雪';
        case 86:
            return '强阵雪';
        case 95:
            return '雷暴';
        case 96:
        case 99:
            return '雷暴（伴冰雹）';
        default:
            return '未知天气';
    }
}

function getSealChar(variant: WeatherVariant) {
    switch (variant) {
        case 'clear':
            return '晴';
        case 'cloudy':
            return '云';
        case 'overcast':
            return '阴';
        case 'fog':
            return '雾';
        case 'drizzle':
        case 'rain':
        case 'shower':
            return '雨';
        case 'snow':
            return '雪';
        case 'storm':
            return '雷';
        default:
            return '候';
    }
}

function pickLine(variant: WeatherVariant, seed: number) {
    const lines: Record<WeatherVariant, string[]> = {
        clear: ['晴光入窗，适合把一个问题写透。', '天色清亮，先定结构再写结论。', '今日适合收束、归档、做索引。'],
        cloudy: ['云气不急，适合慢慢把论据补齐。', '光线柔和，做一次干净的复盘。', '把分散的点连成线，会更有收获。'],
        overcast: ['阴天不散，适合做系统性的整理。', '少一点情绪，多一点证据。', '把“看见”变成“可检索”。'],
        fog: ['雾里看花，先把变量写清楚。', '信息不透明时，结构就是方向。', '不确定的时候，先做假设与验证。'],
        drizzle: ['细雨落纸，适合打磨表达与排版。', '把长文的骨架写好，剩下慢慢填。', '今天适合做“细节统一”。'],
        rain: ['雨声稳定，适合沉浸写作与推演。', '把复杂问题拆小，一块块解决。', '别赶进度，先保证可复用。'],
        shower: ['阵雨来去，适合做一次快速迭代。', '先跑通流程，再追完美。', '一轮小改动，也要留痕。'],
        snow: ['雪落无声，适合做长期主义的积累。', '把输入降噪，把输出做精。', '今天适合写“能复用的结论”。'],
        storm: ['雷声压顶，先收敛战线再推进。', '遇到噪声，越要坚持验证。', '把风险写进方案里。'],
        unknown: ['天气未明，但今日仍可推进一小步。', '先把手边能确定的事做完。', '从一条清单开始，别被不确定拖住。'],
    };

    const pool = lines[variant] || lines.unknown;
    const index = Math.abs(seed) % pool.length;
    return pool[index];
}

function getPracticalTip(snapshot: WeatherSnapshot, variant: WeatherVariant) {
    const temp = snapshot.temperature;
    const wind = snapshot.windSpeed;

    if (variant === 'rain' || variant === 'shower' || variant === 'drizzle') {
        return '出门带伞，路面湿滑，通勤注意脚下。';
    }

    if (variant === 'storm') {
        return '注意雷雨天气，尽量减少户外停留。';
    }

    if (variant === 'snow') {
        return '注意防滑与保暖，避免长时间受寒。';
    }

    if (temp >= 32) {
        return '气温偏高，注意补水与防晒。';
    }

    if (temp <= 5) {
        return '气温偏低，注意保暖，手指别冻僵。';
    }

    if (wind >= 28) {
        return '风力较大，外出注意防风，骑行更要小心。';
    }

    return '保持节奏，做一件能长期复用的小事。';
}

function readCachedWeather(): WeatherSnapshot | null {
    try {
        const raw = localStorage.getItem(WEATHER_CACHE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as WeatherSnapshot;
        if (!parsed || typeof parsed !== 'object') return null;
        if (!parsed.fetchedAt || Date.now() - parsed.fetchedAt > WEATHER_CACHE_TTL) return null;
        if (typeof parsed.temperature !== 'number') return null;
        if (typeof parsed.apparentTemperature !== 'number') return null;
        if (typeof parsed.windSpeed !== 'number') return null;
        if (typeof parsed.weatherCode !== 'number') return null;
        return parsed;
    } catch {
        return null;
    }
}

function writeCachedWeather(snapshot: WeatherSnapshot) {
    try {
        localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify(snapshot));
    } catch {
        // Ignore storage quota / privacy mode.
    }
}

const studioLocation = {
    city: siteConfig.author.location.city,
    country: siteConfig.author.location.country,
    latitude: siteConfig.author.location.latitude,
    longitude: siteConfig.author.location.longitude,
    timezone: siteConfig.author.location.timezone,
};

export default function WeatherCard() {
    const [weather, setWeather] = useState<WeatherSnapshot | null>(() => {
        if (typeof window === 'undefined') {
            return null;
        }
        return readCachedWeather();
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        const cached = readCachedWeather();
        if (cached) {
            setWeather(cached);
            setLoading(false);
        }

        const controller = new AbortController();

        async function fetchWeather() {
            try {
                const query = new URLSearchParams({
                    latitude: String(studioLocation.latitude),
                    longitude: String(studioLocation.longitude),
                    current: 'temperature_2m,apparent_temperature,weather_code,wind_speed_10m',
                    timezone: studioLocation.timezone,
                    forecast_days: '1',
                });

                const response = await fetch(`https://api.open-meteo.com/v1/forecast?${query.toString()}`, {
                    signal: controller.signal,
                });
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

                const snapshot: WeatherSnapshot = {
                    temperature: data.current.temperature_2m,
                    apparentTemperature: data.current.apparent_temperature,
                    windSpeed: data.current.wind_speed_10m,
                    weatherCode: data.current.weather_code,
                    fetchedAt: Date.now(),
                };

                if (cancelled) {
                    return;
                }

                setWeather(snapshot);
                writeCachedWeather(snapshot);
                setError(null);
            } catch (fetchError) {
                if (!cancelled && !controller.signal.aborted) {
                    setError(fetchError instanceof Error ? fetchError.message : '天气信息暂时不可用。');
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
            controller.abort();
        };
    }, []);

    const variant = useMemo(() => (weather ? getVariant(weather.weatherCode) : 'unknown'), [weather]);
    const label = useMemo(() => (weather ? getWeatherLabel(weather.weatherCode) : ''), [weather]);
    const seal = useMemo(() => getSealChar(variant), [variant]);
    const poeticLine = useMemo(() => {
        if (!weather) return '';
        const seed = Math.round(weather.temperature * 10) + weather.weatherCode * 37 + Math.round(weather.windSpeed);
        return pickLine(variant, seed);
    }, [variant, weather]);
    const tip = useMemo(() => (weather ? getPracticalTip(weather, variant) : ''), [variant, weather]);
    const updatedAt = useMemo(() => {
        if (!weather?.fetchedAt) return '';
        const date = new Date(weather.fetchedAt);
        return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    }, [weather?.fetchedAt]);

    return (
        <aside className="feature-panel weather-card" data-weather={variant} data-testid="weather-card">
            <div className="weather-ink" aria-hidden="true" />

            <div className="weather-content">
                <div className="weather-card-head">
                    <div>
                        <div className="eyebrow">工作室天气</div>
                        <h3 className="weather-title">
                            {studioLocation.city}，{studioLocation.country}
                        </h3>
                        <p className="muted weather-location-note" data-testid="weather-location-note">
                            以作者基准城市为准，用天气表达“工作现场感”。
                        </p>
                    </div>

                    <div className="weather-seal" aria-hidden="true">
                        <div className="weather-seal-char">{seal}</div>
                        <div className="weather-seal-caption mono">{variant.toUpperCase()}</div>
                    </div>
                </div>

                {loading && !weather ? (
                    <div className="weather-skeleton" data-testid="weather-loading">
                        <div className="weather-skeleton-temp" />
                        <div className="weather-skeleton-line" />
                        <div className="weather-skeleton-grid">
                            <div className="weather-skeleton-card" />
                            <div className="weather-skeleton-card" />
                        </div>
                        <div className="weather-skeleton-line is-short" />
                    </div>
                ) : error && !weather ? (
                    <div className="muted" data-testid="weather-error">
                        天气信息暂时不可用。
                    </div>
                ) : weather ? (
                    <>
                        <div className="weather-main">
                            <div className="weather-temp" data-testid="weather-temperature">
                                {Math.round(weather.temperature)}°
                            </div>
                            <div className="weather-text">
                                <div className="weather-label">{label}</div>
                                <div className="weather-poem muted">{poeticLine}</div>
                            </div>
                        </div>

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

                        <p className="weather-tip muted">{tip}</p>
                        <div className="weather-updated muted mono">更新于 {updatedAt || '--'}</div>
                    </>
                ) : null}
            </div>
        </aside>
    );
}
