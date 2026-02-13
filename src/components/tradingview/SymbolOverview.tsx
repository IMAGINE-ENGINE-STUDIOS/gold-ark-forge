import { useEffect, useRef, memo } from 'react';

const SymbolOverview = memo(() => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    containerRef.current.innerHTML = '';

    const widgetDiv = document.createElement('div');
    widgetDiv.className = 'tradingview-widget-container__widget';
    containerRef.current.appendChild(widgetDiv);

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-symbol-overview.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      symbols: [
        ['Gold', 'OANDA:XAUUSD|12M'],
        ['Silver', 'OANDA:XAGUSD|12M'],
        ['Platinum', 'OANDA:XPTUSD|12M'],
        ['Bitcoin', 'BITSTAMP:BTCUSD|12M'],
      ],
      chartOnly: false,
      width: '100%',
      height: 400,
      locale: 'en',
      colorTheme: 'dark',
      autosize: true,
      showVolume: false,
      showMA: false,
      hideDateRanges: false,
      hideMarketStatus: false,
      hideSymbolLogo: false,
      scalePosition: 'right',
      scaleMode: 'Normal',
      fontFamily: '-apple-system, BlinkMacSystemFont, Trebuchet MS, Roboto, Ubuntu, sans-serif',
      fontSize: '10',
      noTimeScale: false,
      valuesTracking: '1',
      changeMode: 'price-and-percent',
      chartType: 'area',
      lineWidth: 2,
      lineType: 0,
      dateRanges: ['1d|1', '1m|30', '3m|60', '12m|1D', '60m|1W', 'all|1M'],
      backgroundColor: 'rgba(10, 25, 47, 1)',
      gridLineColor: 'rgba(197, 167, 95, 0.06)',
      affiliate_id: '162505',
    });

    containerRef.current.appendChild(script);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="tradingview-widget-container rounded-lg overflow-hidden border border-gold/20"
      style={{ height: '400px', width: '100%' }}
    />
  );
});

SymbolOverview.displayName = 'SymbolOverview';

export default SymbolOverview;
