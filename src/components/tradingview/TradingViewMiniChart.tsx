import { useEffect, useRef, memo } from 'react';

interface TradingViewMiniChartProps {
  symbol?: string;
  width?: string;
  height?: number;
}

const TradingViewMiniChart = memo(({ symbol = 'OANDA:XAUUSD', width = '100%', height = 220 }: TradingViewMiniChartProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = '';

    const widgetDiv = document.createElement('div');
    widgetDiv.className = 'tradingview-widget-container__widget';
    containerRef.current.appendChild(widgetDiv);

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      symbol,
      width,
      height,
      locale: 'en',
      dateRange: '12M',
      colorTheme: 'dark',
      isTransparent: false,
      autosize: false,
      largeChartUrl: '',
      chartOnly: false,
      noTimeScale: false,
      backgroundColor: 'rgba(10, 25, 47, 1)',
      affiliate_id: '162505',
    });

    containerRef.current.appendChild(script);
    return () => { if (containerRef.current) containerRef.current.innerHTML = ''; };
  }, [symbol, height]);

  return (
    <div ref={containerRef} className="tradingview-widget-container rounded-lg overflow-hidden border border-gold/20" style={{ height: `${height}px`, width }} />
  );
});

TradingViewMiniChart.displayName = 'TradingViewMiniChart';
export default TradingViewMiniChart;
