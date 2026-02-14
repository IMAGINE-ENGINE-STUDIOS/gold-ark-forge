import { useEffect, useRef, memo } from 'react';

interface Props {
  symbol?: string;
  height?: number;
}

const TradingViewFundamentalData = memo(({ symbol = 'NASDAQ:AAPL', height = 490 }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = '';

    const widgetDiv = document.createElement('div');
    widgetDiv.className = 'tradingview-widget-container__widget';
    containerRef.current.appendChild(widgetDiv);

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-financials.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      symbol,
      isTransparent: false,
      largeChartUrl: '',
      displayMode: 'regular',
      width: '100%',
      height,
      colorTheme: 'dark',
      locale: 'en',
      backgroundColor: 'rgba(10, 25, 47, 1)',
      affiliate_id: '162505',
    });

    containerRef.current.appendChild(script);
    return () => { if (containerRef.current) containerRef.current.innerHTML = ''; };
  }, [symbol, height]);

  return (
    <div ref={containerRef} className="tradingview-widget-container rounded-lg overflow-hidden border border-gold/20" style={{ height: `${height}px`, width: '100%' }} />
  );
});

TradingViewFundamentalData.displayName = 'TradingViewFundamentalData';
export default TradingViewFundamentalData;
