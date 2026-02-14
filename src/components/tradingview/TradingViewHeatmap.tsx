import { useEffect, useRef, memo } from 'react';

interface Props {
  height?: number;
  dataSource?: string;
}

const TradingViewHeatmap = memo(({ height = 500, dataSource = 'AllUSA' }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = '';

    const widgetDiv = document.createElement('div');
    widgetDiv.className = 'tradingview-widget-container__widget';
    containerRef.current.appendChild(widgetDiv);

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-stock-heatmap.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      exchanges: [],
      dataSource,
      grouping: 'sector',
      blockSize: 'market_cap_basic',
      blockColor: 'change',
      locale: 'en',
      symbolUrl: '',
      colorTheme: 'dark',
      hasTopBar: true,
      isDataSet498Enabled: false,
      isZoomEnabled: true,
      hasSymbolTooltip: true,
      isMonoSize: false,
      width: '100%',
      height,
      affiliate_id: '162505',
    });

    containerRef.current.appendChild(script);
    return () => { if (containerRef.current) containerRef.current.innerHTML = ''; };
  }, [height, dataSource]);

  return (
    <div ref={containerRef} className="tradingview-widget-container rounded-lg overflow-hidden border border-gold/20" style={{ height: `${height}px`, width: '100%' }} />
  );
});

TradingViewHeatmap.displayName = 'TradingViewHeatmap';
export default TradingViewHeatmap;
