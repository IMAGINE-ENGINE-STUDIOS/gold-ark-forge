import { useEffect, useRef, memo } from 'react';

interface Props {
  height?: number;
}

const TradingViewMarketQuotes = memo(({ height = 500 }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = '';

    const widgetDiv = document.createElement('div');
    widgetDiv.className = 'tradingview-widget-container__widget';
    containerRef.current.appendChild(widgetDiv);

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-market-quotes.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      width: '100%',
      height,
      symbolsGroups: [
        {
          name: 'Precious Metals',
          originalName: 'Precious Metals',
          symbols: [
            { name: 'OANDA:XAUUSD', displayName: 'Gold' },
            { name: 'OANDA:XAGUSD', displayName: 'Silver' },
            { name: 'OANDA:XPTUSD', displayName: 'Platinum' },
            { name: 'TVC:PALLADIUM', displayName: 'Palladium' },
          ],
        },
        {
          name: 'Crypto',
          originalName: 'Crypto',
          symbols: [
            { name: 'BITSTAMP:BTCUSD', displayName: 'Bitcoin' },
            { name: 'BITSTAMP:ETHUSD', displayName: 'Ethereum' },
          ],
        },
        {
          name: 'Indices',
          originalName: 'Indices',
          symbols: [
            { name: 'FOREXCOM:SPXUSD', displayName: 'S&P 500' },
            { name: 'FOREXCOM:DJI', displayName: 'Dow Jones' },
            { name: 'FOREXCOM:NSXUSD', displayName: 'Nasdaq' },
          ],
        },
      ],
      showSymbolLogo: true,
      isTransparent: false,
      colorTheme: 'dark',
      locale: 'en',
      backgroundColor: 'rgba(10, 25, 47, 1)',
      affiliate_id: '162505',
    });

    containerRef.current.appendChild(script);
    return () => { if (containerRef.current) containerRef.current.innerHTML = ''; };
  }, [height]);

  return (
    <div ref={containerRef} className="tradingview-widget-container rounded-lg overflow-hidden border border-gold/20" style={{ height: `${height}px`, width: '100%' }} />
  );
});

TradingViewMarketQuotes.displayName = 'TradingViewMarketQuotes';
export default TradingViewMarketQuotes;
