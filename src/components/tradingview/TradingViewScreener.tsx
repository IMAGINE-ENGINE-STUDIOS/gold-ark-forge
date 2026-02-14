import { useEffect, useRef, memo } from 'react';

interface Props {
  height?: number;
  defaultScreen?: string;
}

const TradingViewScreener = memo(({ height = 500, defaultScreen = 'most_capitalized' }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = '';

    const widgetDiv = document.createElement('div');
    widgetDiv.className = 'tradingview-widget-container__widget';
    containerRef.current.appendChild(widgetDiv);

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-screener.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      width: '100%',
      height,
      defaultColumn: 'overview',
      defaultScreen,
      market: 'commodity',
      showToolbar: true,
      colorTheme: 'dark',
      locale: 'en',
      isTransparent: false,
      backgroundColor: 'rgba(10, 25, 47, 1)',
      affiliate_id: '162505',
    });

    containerRef.current.appendChild(script);
    return () => { if (containerRef.current) containerRef.current.innerHTML = ''; };
  }, [height, defaultScreen]);

  return (
    <div ref={containerRef} className="tradingview-widget-container rounded-lg overflow-hidden border border-gold/20" style={{ height: `${height}px`, width: '100%' }} />
  );
});

TradingViewScreener.displayName = 'TradingViewScreener';
export default TradingViewScreener;
