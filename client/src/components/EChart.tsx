import { useEffect, useMemo, useRef } from 'react';
import * as echarts from 'echarts';
import type { EChartsOption } from 'echarts';

interface EChartProps {
    option: EChartsOption;
    className?: string;
    height?: number;
}

export default function EChart({ option, className = '', height = 320 }: EChartProps) {
    const hostRef = useRef<HTMLDivElement | null>(null);

    const stableOption = useMemo(() => option, [option]);

    useEffect(() => {
        if (!hostRef.current) {
            return;
        }

        const chart = echarts.init(hostRef.current, undefined, { renderer: 'canvas' });
        chart.setOption(stableOption);

        const resizeObserver = new ResizeObserver(() => chart.resize());
        resizeObserver.observe(hostRef.current);

        const handleWindowResize = () => chart.resize();
        window.addEventListener('resize', handleWindowResize);

        return () => {
            resizeObserver.disconnect();
            window.removeEventListener('resize', handleWindowResize);
            chart.dispose();
        };
    }, [stableOption]);

    return <div ref={hostRef} className={className} style={{ width: '100%', height }} />;
}
