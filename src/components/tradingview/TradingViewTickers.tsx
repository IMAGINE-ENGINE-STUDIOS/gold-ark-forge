import { useEffect, useRef, memo } from 'react';

interface Props {
  symbols?: Array<{ proName: string; title: string }>;
}

const defaultSymbols = [
  { proName: 'OANDA:XAUUSD', title: 'Gold' },
  { proName: 'OANDA:XAGUSD', title: 'Silver' },
  { proName: 'OANDA:XPTUSD', title: 'Platinum' },
  { proName: 'BITSTAMP:BTCUSD', title: 'Bitcoin' },
  { proName: 'BITSTAMP:ETHUSD', title: 'Ethereum' },
];

const TradingViewTickers = memo(({ symbols = defaultSymbols }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = '';

    const widgetDiv = document.createElement('div');
    widgetDiv.className = 'tradingview-widget-container__widget';
    containerRef.current.appendChild(widgetDiv);

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-tickers.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      symbols: symbols.map(s => ({
        proName: s.proName,
        title: s.title,
      })),
      isTransparent: false,
      showSymbolLogo: true,
      colorTheme: 'dark',
      locale: 'en',
      backgroundColor: 'rgba(10, 25, 47, 1)',
      affiliate_id: '162505',
    });

    containerRef.current.appendChild(script);
    return () => { if (containerRef.current) containerRef.current.innerHTML = ''; };
  }, [symbols]);

  return (
    <div ref={containerRef} className="tradingview-widget-container rounded-lg overflow-hidden border border-gold/20" style={{ width: '100%' }} />
  );
});

TradingViewTickers.displayName = 'TradingViewTickers';
export default TradingViewTickers;
