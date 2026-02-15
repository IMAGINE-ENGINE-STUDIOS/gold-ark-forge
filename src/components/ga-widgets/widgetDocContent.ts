export interface TutorialHotspot {
  label: string;
  description: string;
  x: number;
  y: number;
  spotlightW?: number;
  spotlightH?: number;
  tooltipSide?: 'top' | 'bottom' | 'left' | 'right';
}

export interface WidgetDocEntry {
  name: string;
  purpose: string;
  sources: string[];
  refreshInterval: string;
  thesis: string;
  metrics: string[];
  instructions: string[];
  tier: 'MARKET DATA' | 'BLOCKCHAIN' | 'DeFi' | 'COMPOSITE' | 'PROPRIETARY' | 'ENERGY';
  tutorial?: TutorialHotspot[];
}

export const widgetDocContent: Record<string, WidgetDocEntry> = {
  prices: {
    name: 'Spot Price Cards',
    purpose: 'Real-time precious metal and cryptocurrency spot prices with 24h change indicators.',
    sources: ['Metal Price API', 'CoinGecko'],
    refreshInterval: '30s auto-refresh',
    tier: 'MARKET DATA',
    thesis: `The Spot Price Cards serve as the foundational pricing layer for the entire Intelligence suite. They display live bid prices for gold, silver, and platinum alongside top-tier cryptocurrencies, providing the baseline reference that every other analytical widget builds upon.

For institutional traders and portfolio managers, accurate spot pricing is the single most critical data point. This widget aggregates feeds from multiple free public APIs with automatic failover, ensuring continuous price visibility even when individual sources experience downtime. The 24-hour change percentage provides immediate directional context without requiring chart analysis.

By combining precious metals and digital assets in a single view, the widget enables rapid cross-asset comparison — a capability typically requiring multiple terminal subscriptions at traditional institutions.`,
    metrics: [
      'Live spot price in USD for gold, silver, platinum',
      'Top cryptocurrency prices (BTC, ETH, SOL, etc.)',
      '24-hour absolute and percentage change',
      'Directional color coding (green/red)',
      'Last update timestamp',
    ],
    instructions: [
      'Prices update automatically every 30 seconds — no action required.',
      'Green values indicate positive 24h movement; red indicates negative.',
      'Use spot prices as the reference baseline when interpreting other widgets.',
      'Metal prices reflect troy ounce USD pricing; crypto prices reflect per-unit USD.',
    ],
    tutorial: [
      { label: 'Symbol Badge', description: 'Asset identifier showing the trading pair and metal/crypto type', x: 15, y: 15, spotlightW: 18, spotlightH: 14, tooltipSide: 'right' },
      { label: 'Spot Price', description: 'Live spot price in USD, updated every 30 seconds from aggregated feeds', x: 50, y: 40, spotlightW: 30, spotlightH: 18 },
      { label: 'Change Indicator', description: '24-hour percentage change with green (up) or red (down) color coding', x: 85, y: 15, spotlightW: 18, spotlightH: 14, tooltipSide: 'left' },
      { label: 'Sparkline', description: 'Intraday price trend visualization showing recent price movement shape', x: 50, y: 80, spotlightW: 60, spotlightH: 18, tooltipSide: 'top' },
    ],
  },

  'mini-charts': {
    name: 'Compact Mini Charts',
    purpose: 'Sparkline-style price trend visualizations for rapid multi-asset scanning.',
    sources: ['Metal Price API', 'CoinGecko'],
    refreshInterval: '60s auto-refresh',
    tier: 'MARKET DATA',
    thesis: `Mini Charts compress 24-hour price histories into compact sparkline visualizations, enabling traders to scan directional trends across multiple assets in seconds. This visual pattern-recognition approach complements the numerical data in the Spot Price Cards.

The sparkline format is deliberately minimal — it strips away axis labels and gridlines to emphasize the shape of price movement over the period. Professional traders use this "at-a-glance" scanning technique to identify which assets deserve deeper analysis, making the Mini Charts an efficient triage tool for large watchlists.

Each chart is independently rendered with its own data feed, ensuring that a slow response from one API does not delay the rendering of others.`,
    metrics: [
      '24-hour price trend sparklines for each tracked asset',
      'Current price overlay on each mini chart',
      'Percentage change badge per asset',
      'Visual trend direction (upward/downward slope)',
    ],
    instructions: [
      'Scan the sparkline shapes to identify trending vs. ranging assets.',
      'Steep upward curves indicate strong bullish momentum in the last 24 hours.',
      'Flat lines suggest consolidation — useful for identifying breakout candidates.',
      'Use alongside Spot Price Cards for combined numerical and visual analysis.',
    ],
    tutorial: [
      { label: 'Asset Label', description: 'Identifies which asset the sparkline represents', x: 10, y: 20 },
      { label: 'Sparkline Chart', description: '24-hour compressed price trend — steep curves show momentum', x: 50, y: 50 },
      { label: 'Current Price', description: 'Latest spot price overlaid on the sparkline endpoint', x: 80, y: 30 },
      { label: 'Change Badge', description: 'Percentage change badge with directional color', x: 90, y: 70 },
    ],
  },

  overview: {
    name: 'Multi-Asset Overview',
    purpose: 'Comprehensive cross-asset dashboard combining prices, changes, and market data.',
    sources: ['Metal Price API', 'CoinGecko', 'Frankfurter'],
    refreshInterval: '30s auto-refresh',
    tier: 'MARKET DATA',
    thesis: `The Multi-Asset Overview provides a unified dashboard that spans precious metals, cryptocurrencies, and forex pairs in a single tabbed interface. It serves as the primary situational awareness tool for portfolio managers who need to monitor correlations across asset classes.

Unlike single-asset widgets, the Overview is designed for comparative analysis. By presenting metals, crypto, and currencies side-by-side with standardized formatting, it exposes relative strength and weakness patterns that would be invisible when viewing each asset class in isolation.

The tabbed architecture keeps the interface clean while allowing rapid switching between asset universes. Each tab maintains its own data stream, so switching is instantaneous with no loading delay.`,
    metrics: [
      'Tabbed views: Metals, Crypto, Forex',
      'Price, 24h change, 7d change per asset',
      'Market cap (crypto) / weight (metals)',
      'Volume indicators where available',
    ],
    instructions: [
      'Click the asset class tabs (Metals, Crypto, Forex) to switch views.',
      'Sort by any column header to rank assets by that metric.',
      'Compare 24h changes across tabs to identify risk-on/risk-off flows.',
      'Use the forex tab to assess USD strength relative to major currencies.',
    ],
    tutorial: [
      { label: 'Asset Class Tabs', description: 'Switch between Metals, Crypto, and Forex views', x: 30, y: 8, spotlightW: 50, spotlightH: 10, tooltipSide: 'bottom' },
      { label: 'Price Column', description: 'Current price for each asset in USD', x: 50, y: 40, spotlightW: 20, spotlightH: 30 },
      { label: '24h Change', description: 'Daily percentage change with color coding', x: 75, y: 40, spotlightW: 20, spotlightH: 30, tooltipSide: 'left' },
      { label: 'Sort Headers', description: 'Click any column header to rank assets by that metric', x: 50, y: 20, spotlightW: 70, spotlightH: 8, tooltipSide: 'bottom' },
    ],
  },

  chart: {
    name: 'Advanced Metal Chart',
    purpose: 'Full-featured interactive price chart with technical indicators and timeframe selection.',
    sources: ['Metal Price API'],
    refreshInterval: '30s auto-refresh',
    tier: 'MARKET DATA',
    thesis: `The Advanced Metal Chart is the primary technical analysis workspace for precious metals. It renders candlestick-style price data with configurable timeframes and overlay indicators, providing the depth of analysis typically found only in professional trading terminals.

Technical analysis remains the dominant methodology for short-to-medium term trading decisions in commodity markets. This chart implements industry-standard indicators (SMA, EMA, RSI) calculated directly from raw price feeds, ensuring mathematical accuracy without relying on third-party indicator services.

The chart supports multiple metal selections, allowing direct visual comparison of gold, silver, and platinum price action within the same analytical framework.`,
    metrics: [
      'Candlestick/line chart with configurable timeframes',
      'Simple Moving Average (SMA) overlay',
      'Exponential Moving Average (EMA) overlay',
      'Relative Strength Index (RSI) sub-panel',
      'Volume bars (where available)',
    ],
    instructions: [
      'Select the metal (Gold, Silver, Platinum) using the asset selector.',
      'Choose a timeframe (1D, 1W, 1M, 3M) to adjust the chart period.',
      'Toggle indicators on/off using the indicator buttons.',
      'Hover over any candle/point to see exact OHLC values and timestamp.',
      'RSI above 70 suggests overbought conditions; below 30 suggests oversold.',
    ],
    tutorial: [
      { label: 'Asset Selector', description: 'Choose which metal (Gold, Silver, Platinum) to chart', x: 15, y: 8, spotlightW: 20, spotlightH: 10, tooltipSide: 'bottom' },
      { label: 'Timeframe Buttons', description: 'Switch between 1D, 1W, 1M, 3M chart periods', x: 50, y: 8, spotlightW: 30, spotlightH: 10, tooltipSide: 'bottom' },
      { label: 'Candlestick Area', description: 'Main price chart with OHLC data — hover for details', x: 50, y: 45, spotlightW: 80, spotlightH: 40 },
      { label: 'Indicator Toggles', description: 'Enable/disable SMA, EMA, RSI overlays', x: 85, y: 8, spotlightW: 20, spotlightH: 10, tooltipSide: 'left' },
      { label: 'RSI Panel', description: 'Relative Strength Index sub-panel below the main chart', x: 50, y: 85, spotlightW: 80, spotlightH: 14, tooltipSide: 'top' },
    ],
  },

  analysis: {
    name: 'Technical Analysis Gauge',
    purpose: 'Aggregated buy/sell signal gauge based on multiple technical indicators.',
    sources: ['Metal Price API', 'Internal Calculations'],
    refreshInterval: '30s auto-refresh',
    tier: 'MARKET DATA',
    thesis: `The Technical Analysis Gauge distills multiple technical indicators into a single directional consensus reading, presented as an intuitive gauge visualization. It answers the fundamental question every trader asks: "What is the overall technical bias right now?"

The gauge aggregates signals from oscillators (RSI, Stochastic, MACD), moving averages (SMA/EMA across multiple periods), and momentum indicators to produce a composite score. This multi-indicator approach reduces the noise inherent in any single indicator, producing more reliable directional signals.

Institutional desks use similar composite indicators to quickly validate or challenge their discretionary bias before executing trades. The gauge format makes the consensus immediately readable without requiring deep technical analysis expertise.`,
    metrics: [
      'Composite signal gauge: Strong Sell → Strong Buy',
      'Individual oscillator readings (RSI, Stochastic, CCI)',
      'Moving average consensus (short, medium, long-term)',
      'Overall signal count: Buy vs. Sell vs. Neutral',
    ],
    instructions: [
      'Read the main gauge needle position for overall technical bias.',
      'Check individual indicator breakdowns below the gauge for detail.',
      'A strong consensus (most indicators aligned) is more reliable than a mixed signal.',
      'Use in combination with the Advanced Chart for confirmation.',
    ],
    tutorial: [
      { label: 'Gauge Needle', description: 'Overall technical bias — Strong Sell through Strong Buy', x: 50, y: 35 },
      { label: 'Signal Count', description: 'Buy vs Sell vs Neutral indicator breakdown', x: 50, y: 70 },
      { label: 'Oscillator Panel', description: 'Individual oscillator readings (RSI, Stochastic, CCI)', x: 25, y: 85 },
      { label: 'Moving Averages', description: 'Short, medium, and long-term MA consensus', x: 75, y: 85 },
    ],
  },

  'market-summary': {
    name: 'Global Market Summary',
    purpose: 'High-level overview of global market conditions across equities, commodities, and crypto.',
    sources: ['CoinGecko', 'Metal Price API', 'Frankfurter'],
    refreshInterval: '60s auto-refresh',
    tier: 'MARKET DATA',
    thesis: `The Global Market Summary provides an executive-level snapshot of worldwide market conditions, aggregating key metrics from equities, commodities, currencies, and crypto into a single condensed view. It is designed for the first 30 seconds of any trading session.

Professional traders and analysts begin each session by establishing macro context: Is the market risk-on or risk-off? Which asset classes are leading? Where is volatility concentrated? This widget answers those questions instantly, replacing the need to cycle through multiple specialized screens.

The summary format prioritizes breadth over depth — it shows the most decision-relevant data point for each market segment, trusting that users will drill into specialized widgets for deeper analysis when needed.`,
    metrics: [
      'Global crypto market cap and 24h change',
      'Bitcoin dominance percentage',
      'Precious metal price levels',
      'Key forex pair rates (EUR/USD, GBP/USD)',
      'Market breadth indicators',
    ],
    instructions: [
      'Review the summary at the start of each session for macro context.',
      'Rising BTC dominance suggests crypto flight to safety; falling suggests altcoin risk appetite.',
      'Cross-reference metal and crypto movements for macro correlation signals.',
      'Use as a navigation guide — identify which asset class needs deeper investigation.',
    ],
    tutorial: [
      { label: 'Crypto Market Cap', description: 'Global crypto market capitalization with 24h change', x: 20, y: 25 },
      { label: 'BTC Dominance', description: 'Bitcoin share of total crypto market — risk sentiment barometer', x: 60, y: 25 },
      { label: 'Metal Prices', description: 'Precious metal spot price levels for quick reference', x: 20, y: 60 },
      { label: 'Forex Rates', description: 'Key currency pair rates (EUR/USD, GBP/USD)', x: 60, y: 60 },
    ],
  },

  quotes: {
    name: 'Market Quotes',
    purpose: 'Detailed quote table with bid/ask spreads and key trading metrics.',
    sources: ['Metal Price API', 'CoinGecko'],
    refreshInterval: '30s auto-refresh',
    tier: 'MARKET DATA',
    thesis: `Market Quotes provides a professional-grade quote table showing detailed pricing data beyond simple spot prices. It includes bid/ask spreads, daily ranges, and volume metrics in a format familiar to anyone who has used a Bloomberg terminal or Reuters Eikon.

Spread analysis is critical for assessing market liquidity and execution quality. Wide spreads indicate thin markets or high volatility — conditions where slippage risk increases. The Quotes widget exposes this dimension of market microstructure that simpler price displays omit.

The tabular format supports rapid scanning across many instruments simultaneously, making it the preferred view for traders monitoring a diversified portfolio.`,
    metrics: [
      'Bid and ask prices per instrument',
      'Bid/ask spread (absolute and percentage)',
      'Daily high and low range',
      '24h volume in USD',
      'Change from previous close',
    ],
    instructions: [
      'Scan the spread column to identify the most liquid instruments.',
      'Wide spreads (>1%) suggest caution when placing large orders.',
      'Compare daily range to current price to assess intraday positioning.',
      'Sort by volume to find the most actively traded assets.',
    ],
    tutorial: [
      { label: 'Instrument Column', description: 'Asset names with symbols for identification', x: 12, y: 40 },
      { label: 'Bid/Ask', description: 'Current bid and ask prices — the tighter the spread, the more liquid', x: 40, y: 40 },
      { label: 'Spread Column', description: 'Absolute and percentage spread indicating market liquidity', x: 60, y: 40 },
      { label: 'Volume', description: '24h trading volume in USD — higher means more liquid', x: 80, y: 40 },
    ],
  },

  movers: {
    name: 'Top Movers',
    purpose: 'Ranked display of the biggest gainers and losers across all tracked assets.',
    sources: ['CoinGecko', 'Metal Price API'],
    refreshInterval: '30s auto-refresh',
    tier: 'MARKET DATA',
    thesis: `Top Movers surfaces the most significant price movements across the entire asset universe, separating them into gainers and losers columns. It is the Intelligence suite's early warning system for unusual market activity.

Extreme price movements often precede broader market shifts. A precious metal surging while equities fall may signal a flight to safety. A cryptocurrency spiking on high volume may indicate breaking news or whale accumulation. By surfacing these outliers, the Top Movers widget directs analyst attention to where it matters most.

The widget filters out stablecoins and low-cap noise assets to ensure the rankings reflect genuine market-moving activity rather than illiquid token volatility.`,
    metrics: [
      'Top 5 gainers with percentage change',
      'Top 5 losers with percentage change',
      'Asset name, current price, and 24h change',
      'Volume context for each mover',
    ],
    instructions: [
      'Check gainers for momentum trade candidates.',
      'Check losers for potential mean-reversion opportunities.',
      'Large moves on high volume are more significant than low-volume spikes.',
      'Cross-reference unusual movers with the News Feed for catalyst identification.',
    ],
    tutorial: [
      { label: 'Gainers Column', description: 'Top performing assets ranked by 24h percentage gain', x: 25, y: 40 },
      { label: 'Losers Column', description: 'Worst performing assets ranked by 24h percentage loss', x: 75, y: 40 },
      { label: 'Price Display', description: 'Current price alongside change percentage for each mover', x: 50, y: 60 },
      { label: 'Volume Context', description: 'Trading volume validates whether the move has conviction', x: 50, y: 80 },
    ],
  },

  news: {
    name: 'Market Intelligence Feed',
    purpose: 'Curated real-time news stream covering metals, crypto, and macro events.',
    sources: ['CoinGecko News', 'Public RSS'],
    refreshInterval: '5m auto-refresh',
    tier: 'MARKET DATA',
    thesis: `The Market Intelligence Feed aggregates breaking news and analysis from multiple public sources, filtered for relevance to the asset classes tracked by the Intelligence suite. It provides the narrative context that explains price movements observed in other widgets.

Markets are driven by information flow. Price-only analysis reveals what is happening; news reveals why. Professional analysts maintain continuous news surveillance to identify catalysts, assess sentiment shifts, and anticipate regulatory developments before they impact pricing.

The feed applies categorical filtering to separate metal-specific news from crypto developments and macro events, allowing users to focus on their area of interest without information overload.`,
    metrics: [
      'Headline, source, and publication timestamp',
      'Category tags (Metals, Crypto, Macro, Regulatory)',
      'Source attribution and credibility indicator',
      'Link to full article',
    ],
    instructions: [
      'Scan headlines for breaking catalysts that explain unusual price movements.',
      'Use category filters to focus on specific asset classes.',
      'Click any headline to open the full article in a new tab.',
      'Cross-reference news timing with chart movements for cause-and-effect analysis.',
    ],
    tutorial: [
      { label: 'Headline', description: 'Breaking news title — click to open the full article', x: 50, y: 30 },
      { label: 'Source Tag', description: 'Attribution showing where the story originates', x: 15, y: 50 },
      { label: 'Timestamp', description: 'Publication time for assessing recency and market impact window', x: 85, y: 30 },
      { label: 'Category Filter', description: 'Filter by Metals, Crypto, Macro, or Regulatory topics', x: 50, y: 10 },
    ],
  },

  forex: {
    name: 'Forex Intelligence Matrix',
    purpose: 'Live currency pair matrix with cross-rates and directional signals.',
    sources: ['Frankfurter API'],
    refreshInterval: '60s auto-refresh',
    tier: 'MARKET DATA',
    thesis: `The Forex Intelligence Matrix displays a comprehensive grid of major and cross currency pair rates, providing the foreign exchange context essential for interpreting commodity and crypto prices denominated in USD.

Gold and oil are priced in US dollars globally. A strengthening dollar mechanically suppresses commodity prices even when underlying demand is unchanged. Understanding forex dynamics is therefore not optional for metal and energy analysts — it is a prerequisite for accurate price interpretation.

The matrix format enables rapid identification of currency strength and weakness patterns. When EUR, GBP, and JPY all weaken against USD simultaneously, it signals broad dollar strength rather than isolated pair movement — a critical distinction for macro positioning.`,
    metrics: [
      'Major pair rates: EUR/USD, GBP/USD, USD/JPY, etc.',
      'Cross-pair rates for non-USD combinations',
      '24h change with directional color coding',
      'Currency strength ranking',
    ],
    instructions: [
      'Read rows horizontally to assess one currency against all others.',
      'Green cells indicate the base currency strengthening against the quote.',
      'Use USD row/column specifically when analyzing metal price movements.',
      'A uniformly strong USD row suggests dollar-driven commodity weakness.',
    ],
    tutorial: [
      { label: 'Currency Grid', description: 'Cross-rate matrix — read rows for one currency vs all others', x: 50, y: 50 },
      { label: 'Color Coding', description: 'Green = base strengthening; Red = base weakening', x: 50, y: 30 },
      { label: 'USD Row', description: 'Critical for interpreting commodity price movements', x: 15, y: 40 },
      { label: 'Strength Ranking', description: 'Overall currency strength sorted by performance', x: 85, y: 70 },
    ],
  },

  heatmap: {
    name: 'Multi-Market Heatmap',
    purpose: 'Color-coded performance heatmap spanning multiple asset classes.',
    sources: ['CoinGecko', 'Metal Price API', 'Frankfurter'],
    refreshInterval: '60s auto-refresh',
    tier: 'MARKET DATA',
    thesis: `The Multi-Market Heatmap renders asset performance as a color-intensity grid, enabling pattern recognition across dozens of instruments in a single glance. It is the Intelligence suite's most efficient tool for identifying broad market themes.

Heatmaps leverage the human visual cortex's natural ability to detect color patterns faster than it can process numerical tables. A sea of green with isolated red cells tells a very different story than a mixed or uniformly red display — and the heatmap communicates this in milliseconds.

The multi-market scope (metals, crypto, forex, indices) makes cross-asset correlation visible without statistical computation. When metals and crypto are both green while the dollar is red, the correlation is instantly apparent.`,
    metrics: [
      'Color-coded tiles: deep green (strong gains) to deep red (strong losses)',
      'Asset name and percentage change per tile',
      'Grouped by asset class for categorical comparison',
      'Tile size weighted by market cap or importance',
    ],
    instructions: [
      'Scan for dominant color to assess overall market sentiment.',
      'Look for outlier tiles (different color from neighbors) for divergence signals.',
      'Compare metal tiles to crypto tiles for cross-asset correlation.',
      'Hover over any tile for exact percentage and price details.',
    ],
    tutorial: [
      { label: 'Color Tiles', description: 'Deep green = strong gains, deep red = strong losses — scan for dominant color', x: 50, y: 50 },
      { label: 'Asset Labels', description: 'Name and percentage change overlaid on each tile', x: 30, y: 30 },
      { label: 'Category Groups', description: 'Tiles grouped by asset class for categorical comparison', x: 50, y: 15 },
      { label: 'Tile Size', description: 'Larger tiles indicate higher market cap or importance weighting', x: 70, y: 70 },
    ],
  },

  calendar: {
    name: 'Economic Calendar',
    purpose: 'Upcoming macro-economic events and data releases with impact ratings.',
    sources: ['Public Economic Data'],
    refreshInterval: '15m auto-refresh',
    tier: 'MARKET DATA',
    thesis: `The Economic Calendar tracks scheduled macro-economic events — GDP releases, employment reports, central bank decisions, PMI data — that can cause significant price volatility across all asset classes. It transforms reactive trading into proactive risk management.

Institutional trading desks never enter a session without reviewing the day's event calendar. A Federal Reserve rate decision or Non-Farm Payrolls release can move gold by $50/oz and crypto by 5-10% within minutes. Knowing these events in advance allows position sizing adjustment, stop placement, and strategic trade timing.

The calendar assigns impact ratings (high, medium, low) based on historical volatility impact, helping analysts prioritize which events require active monitoring versus passive awareness.`,
    metrics: [
      'Event name, date, and time',
      'Country/region of origin',
      'Impact rating: High, Medium, Low',
      'Previous, forecast, and actual values (when released)',
    ],
    instructions: [
      'Review high-impact events at the start of each session.',
      'Reduce position sizes or widen stops before high-impact releases.',
      'Compare actual vs. forecast values — surprises drive the biggest moves.',
      'Filter by country or impact level to focus your attention.',
    ],
    tutorial: [
      { label: 'Event List', description: 'Upcoming economic events with dates and times', x: 30, y: 40 },
      { label: 'Impact Rating', description: 'High/Medium/Low impact — high-impact events move markets', x: 80, y: 40 },
      { label: 'Forecast vs Actual', description: 'Compare expected vs actual — surprises drive the biggest moves', x: 60, y: 60 },
      { label: 'Country Flag', description: 'Region of origin for the economic release', x: 10, y: 40 },
    ],
  },

  bitcoin: {
    name: 'Bitcoin Network Monitor',
    purpose: 'Live Bitcoin blockchain metrics including mempool, hashrate, and block data.',
    sources: ['mempool.space', 'Blockchain.info'],
    refreshInterval: '30s auto-refresh',
    tier: 'BLOCKCHAIN',
    thesis: `The Bitcoin Network Monitor provides direct visibility into the Bitcoin blockchain's operational state, sourced from public node APIs without intermediaries. It surfaces the on-chain metrics that fundamentally drive Bitcoin's value proposition and network security.

Bitcoin's price is ultimately a reflection of network health and adoption. Hashrate indicates miner confidence and network security. Mempool depth reveals transaction demand and potential fee pressure. Block data shows the heartbeat of the world's largest proof-of-work system.

These on-chain metrics provide analytical edge because they reflect actual network activity rather than speculative sentiment. When exchange prices fall but hashrate and active addresses rise, it suggests accumulation by informed participants — a bullish divergence invisible to price-only analysis.`,
    metrics: [
      'Current block height and time since last block',
      'Network hashrate (EH/s) and difficulty',
      'Mempool transaction count and size (MB)',
      'Recommended fee rates (sat/vB) by priority',
      'Bitcoin price and market cap',
    ],
    instructions: [
      'Monitor hashrate trends — declining hashrate may signal miner capitulation.',
      'High mempool counts indicate network congestion and higher transaction fees.',
      'Block time averaging >10 minutes suggests the network is between difficulty adjustments.',
      'Use fee rate data to time Bitcoin transactions optimally.',
    ],
    tutorial: [
      { label: 'Block Height', description: 'Current Bitcoin blockchain height — the global block counter', x: 20, y: 20 },
      { label: 'Last Block Timer', description: 'Minutes since the last mined block — typically ~10 min', x: 50, y: 20 },
      { label: 'Hashrate Gauge', description: 'Network security measured in exahashes per second', x: 80, y: 20 },
      { label: 'Fee Estimates', description: 'Priority, Standard, and Economy fee tiers in sat/vB', x: 30, y: 70 },
      { label: 'Mempool Count', description: 'Unconfirmed transactions awaiting block inclusion', x: 70, y: 70 },
    ],
  },

  ethereum: {
    name: 'Ethereum Network Monitor',
    purpose: 'Live Ethereum network stats including gas fees, staking, and block data.',
    sources: ['Etherscan Public API', 'CoinGecko'],
    refreshInterval: '30s auto-refresh',
    tier: 'BLOCKCHAIN',
    thesis: `The Ethereum Network Monitor tracks the operational metrics of the Ethereum blockchain — the foundation layer for DeFi, NFTs, and the majority of tokenized asset infrastructure. Understanding Ethereum's state is essential for anyone operating in the digital asset ecosystem.

Gas fees are the pulse of Ethereum demand. High gas indicates heavy network utilization (DeFi activity, NFT mints, token launches), while low gas suggests reduced activity. For Gold Arrow's certificate infrastructure, which may interact with EVM-compatible chains, monitoring Ethereum gas is operationally relevant.

Post-Merge, Ethereum's staking metrics (total staked, validator count, yield) provide insight into the network's long-term security model and the opportunity cost of capital locked in staking versus other yield sources.`,
    metrics: [
      'Current gas price (Gwei) with slow/standard/fast tiers',
      'ETH price and 24h change',
      'Total ETH staked and staking APY',
      'Latest block number and block time',
      'Network transaction throughput',
    ],
    instructions: [
      'Check gas prices before initiating any on-chain transactions.',
      'Gas above 50 Gwei indicates high network activity — consider delaying non-urgent transactions.',
      'Compare staking APY to DeFi yields to assess capital efficiency.',
      'Monitor ETH burn rate as an indicator of network utilization intensity.',
    ],
    tutorial: [
      { label: 'Gas Price', description: 'Current gas in Gwei — slow/standard/fast tiers', x: 50, y: 20 },
      { label: 'ETH Price', description: 'Live ETH/USD price with 24h change', x: 20, y: 20 },
      { label: 'Staking Data', description: 'Total ETH staked and current staking APY', x: 50, y: 55 },
      { label: 'Block Info', description: 'Latest block number and average block time', x: 80, y: 55 },
    ],
  },

  xrp: {
    name: 'XRP Ledger Monitor',
    purpose: 'Real-time XRP Ledger metrics including ledger close times and escrow data.',
    sources: ['XRPL Public API', 'CoinGecko'],
    refreshInterval: '30s auto-refresh',
    tier: 'BLOCKCHAIN',
    thesis: `The XRP Ledger Monitor provides visibility into the XRPL — a blockchain specifically designed for high-speed payment settlement and increasingly relevant for institutional cross-border transactions. Its consensus mechanism differs fundamentally from both Bitcoin's proof-of-work and Ethereum's proof-of-stake.

XRPL's 3-5 second ledger close time and minimal transaction costs make it relevant for asset tokenization and settlement use cases. Monitoring ledger activity provides insight into institutional adoption trends and cross-border payment volumes.

The escrow data is particularly noteworthy: Ripple's programmatic XRP escrow releases impact circulating supply and are closely watched by traders for their potential price impact.`,
    metrics: [
      'XRP price and 24h change',
      'Current ledger index and close time',
      'Transaction throughput and fees',
      'Escrow and circulating supply data',
      'Active account estimates',
    ],
    instructions: [
      'Monitor ledger close time — consistent 3-5s indicates healthy consensus.',
      'Watch transaction volume for institutional adoption trends.',
      'Track escrow release schedules for supply impact awareness.',
      'Compare XRP performance to BTC and ETH for relative value analysis.',
    ],
    tutorial: [
      { label: 'XRP Price', description: 'Live XRP/USD spot price with 24h movement', x: 20, y: 20 },
      { label: 'Ledger Index', description: 'Current ledger sequence number and close time', x: 50, y: 20 },
      { label: 'Transaction Data', description: 'Throughput and fees — indicates network utilization', x: 50, y: 55 },
      { label: 'Escrow Info', description: 'Circulating supply and programmatic escrow release schedule', x: 80, y: 55 },
    ],
  },

  tron: {
    name: 'TRON Network Monitor',
    purpose: 'Live TRON blockchain data focused on stablecoin transfer activity.',
    sources: ['TronGrid API', 'CoinGecko'],
    refreshInterval: '30s auto-refresh',
    tier: 'BLOCKCHAIN',
    thesis: `The TRON Network Monitor tracks one of the most heavily used blockchains for stablecoin transfers (USDT-TRC20). Despite lower profile than Ethereum, TRON processes more stablecoin transaction volume than any other chain, making it a critical infrastructure layer for global digital dollar movement.

For precious metal markets, stablecoin flow is a leading indicator of capital entering or exiting the broader digital asset ecosystem. Large USDT transfers on TRON often precede significant exchange inflows, which can impact both crypto and (increasingly) tokenized commodity prices.

Monitoring TRON's energy and bandwidth economics provides insight into the cost structure of high-volume stablecoin operations — relevant for any institution considering blockchain-based settlement.`,
    metrics: [
      'TRX price and 24h change',
      'Total accounts and daily active addresses',
      'Current block height and block time',
      'Energy and bandwidth pricing',
      'USDT-TRC20 transfer activity estimates',
    ],
    instructions: [
      'Focus on account growth trends as an adoption metric.',
      'High TRX price with stable block production indicates healthy network economics.',
      'Compare TRON USDT volume to Ethereum USDT volume for settlement market share.',
      'Use alongside Whale Watch for large USDT flow detection.',
    ],
    tutorial: [
      { label: 'TRX Price', description: 'Live TRX/USD price with daily change', x: 20, y: 20 },
      { label: 'Account Stats', description: 'Total accounts and daily active addresses', x: 50, y: 20 },
      { label: 'Block Data', description: 'Current block height and block production rate', x: 80, y: 20 },
      { label: 'Energy/Bandwidth', description: 'Network resource pricing for transaction economics', x: 50, y: 70 },
    ],
  },

  sec: {
    name: 'SEC EDGAR Filings',
    purpose: 'Recent SEC filings from EDGAR for commodity ETFs and mining companies.',
    sources: ['SEC EDGAR Public API'],
    refreshInterval: '15m auto-refresh',
    tier: 'BLOCKCHAIN',
    thesis: `The SEC EDGAR Filings widget surfaces recent regulatory filings from the U.S. Securities and Exchange Commission, filtered for relevance to precious metals, mining equities, and digital asset products. Regulatory developments are among the most impactful catalysts for these markets.

Gold ETF filings (GLD, IAU) reveal institutional flow data before it appears in price action. Mining company 10-K and 10-Q filings expose production costs, reserve estimates, and hedging positions. Bitcoin and Ethereum ETF amendments track the evolving regulatory landscape for digital assets.

This widget transforms the EDGAR database from a compliance archive into a competitive intelligence tool by filtering and presenting only the filings relevant to Gold Arrow's asset universe.`,
    metrics: [
      'Filing type (10-K, 10-Q, 8-K, S-1, etc.)',
      'Company name and CIK number',
      'Filing date and acceptance timestamp',
      'Direct link to full filing on EDGAR',
    ],
    instructions: [
      'Monitor 8-K filings for material event disclosures from mining companies.',
      'Track ETF prospectus amendments (S-1, 485BPOS) for product structure changes.',
      'Click any filing to open the full document on the SEC website.',
      'Cross-reference filing dates with price movements for event-driven analysis.',
    ],
    tutorial: [
      { label: 'Filing Type', description: '10-K, 10-Q, 8-K, S-1 — each type has different significance', x: 15, y: 40 },
      { label: 'Company Name', description: 'Entity that filed — filtered for metals, mining, and digital assets', x: 40, y: 40 },
      { label: 'Filing Date', description: 'When the filing was submitted and accepted by the SEC', x: 70, y: 40 },
      { label: 'EDGAR Link', description: 'Click to open the full filing document on SEC.gov', x: 90, y: 40 },
    ],
  },

  whales: {
    name: 'Whale Watch',
    purpose: 'Large cryptocurrency transaction monitoring for smart money flow detection.',
    sources: ['Blockchain APIs', 'CoinGecko'],
    refreshInterval: '60s auto-refresh',
    tier: 'BLOCKCHAIN',
    thesis: `Whale Watch monitors large-value cryptocurrency transactions across major blockchains, surfacing the activity of institutional-scale wallets. These "whale" movements often precede significant price action, making them one of the most valuable leading indicators in crypto markets.

When a whale moves large Bitcoin holdings from a cold wallet to an exchange, it frequently signals intent to sell — creating selling pressure within hours. Conversely, large exchange outflows to cold storage suggest accumulation and reduced liquid supply. These flow patterns provide actionable intelligence before price impact occurs.

The widget aggregates whale alerts across multiple chains, providing a unified view of large-scale capital movement that would otherwise require monitoring multiple blockchain explorers simultaneously.`,
    metrics: [
      'Transaction hash, value, and timestamp',
      'Source and destination wallet classification (Exchange, Unknown, Known Entity)',
      'Chain identification (Bitcoin, Ethereum, etc.)',
      'Transaction value in USD equivalent',
    ],
    instructions: [
      'Watch for large exchange inflows — these often precede selling pressure.',
      'Exchange outflows to unknown wallets suggest institutional accumulation.',
      'Multiple large transactions in the same direction amplify the signal.',
      'Cross-reference whale alerts with Top Movers for confirmation.',
    ],
    tutorial: [
      { label: 'Transaction Hash', description: 'Unique transaction identifier — click to view on explorer', x: 15, y: 40 },
      { label: 'Value (USD)', description: 'Transaction value in US dollars — larger = more significant', x: 50, y: 40 },
      { label: 'Wallet Type', description: 'Source/destination classified: Exchange, Cold Wallet, Unknown', x: 75, y: 40 },
      { label: 'Chain Badge', description: 'Which blockchain the transaction occurred on', x: 90, y: 20 },
    ],
  },

  'crypto-market': {
    name: 'Crypto Market Overview',
    purpose: 'Comprehensive cryptocurrency market data with rankings, dominance, and volume.',
    sources: ['CoinGecko'],
    refreshInterval: '30s auto-refresh',
    tier: 'DeFi',
    thesis: `The Crypto Market Overview provides a Bloomberg-style terminal view of the cryptocurrency market, displaying top assets by market capitalization with comprehensive trading metrics. It serves as the primary reference for digital asset relative value analysis.

Market capitalization rankings reveal the crypto market's structural hierarchy and how capital is distributed across the ecosystem. When BTC dominance rises, it typically signals risk-off behavior within crypto; when it falls, capital is rotating into altcoins — a risk-on signal.

Volume analysis adds a critical dimension: price movements on high volume carry more conviction than those on thin trading. The widget surfaces this volume context alongside price data, enabling more nuanced interpretation of market movements.`,
    metrics: [
      'Top cryptocurrencies ranked by market cap',
      'Price, 24h change, 7d change per asset',
      'Market cap and 24h trading volume',
      'BTC dominance and total crypto market cap',
      'Circulating supply percentage',
    ],
    instructions: [
      'Sort by market cap for structural market view; by 24h change for momentum.',
      'Track BTC dominance as a risk sentiment barometer.',
      'High volume + price increase = strong trend; low volume + increase = weak trend.',
      'Use the 7d column to distinguish noise from sustained trends.',
    ],
    tutorial: [
      { label: 'Rank Column', description: 'Market cap ranking — top assets by total market value', x: 8, y: 40 },
      { label: 'Price & Change', description: 'Current price with 24h and 7d percentage changes', x: 45, y: 40 },
      { label: 'Market Cap', description: 'Total market capitalization — measures asset size', x: 70, y: 40 },
      { label: 'BTC Dominance', description: 'Bitcoin share of total market — risk sentiment indicator', x: 50, y: 10 },
      { label: 'Volume', description: '24h trading volume — validates price move conviction', x: 88, y: 40 },
    ],
  },

  sentiment: {
    name: 'Fear & Greed Index',
    purpose: 'Market sentiment gauge measuring crowd psychology from extreme fear to extreme greed.',
    sources: ['Alternative.me API'],
    refreshInterval: '5m auto-refresh',
    tier: 'DeFi',
    thesis: `The Fear & Greed Index quantifies market sentiment on a 0-100 scale, derived from multiple factors including volatility, volume, social media, dominance, and trends. It provides a contrarian signal framework: extreme fear often marks buying opportunities, while extreme greed precedes corrections.

Warren Buffett's maxim to "be fearful when others are greedy, and greedy when others are fearful" is the philosophical foundation of this widget. By quantifying crowd psychology, it helps analysts maintain discipline against the natural human tendency to follow the herd.

Historical analysis shows that sustained readings below 20 (Extreme Fear) have preceded significant recovery rallies, while readings above 80 (Extreme Greed) have preceded corrections. The widget displays both the current reading and recent history to show sentiment trajectory.`,
    metrics: [
      'Current index value (0-100) with sentiment label',
      'Sentiment classification: Extreme Fear, Fear, Neutral, Greed, Extreme Greed',
      'Visual gauge with color gradient',
      'Historical trend over recent periods',
    ],
    instructions: [
      'Use as a contrarian indicator — extreme readings often precede reversals.',
      'Extreme Fear (<20) historically correlates with market bottoms.',
      'Extreme Greed (>80) historically precedes corrections.',
      'Combine with technical analysis — sentiment confirms but should not replace chart analysis.',
    ],
    tutorial: [
      { label: 'Gauge Dial', description: 'Main sentiment reading from 0 (Extreme Fear) to 100 (Extreme Greed)', x: 50, y: 40 },
      { label: 'Sentiment Label', description: 'Classification text: Fear, Neutral, Greed, or Extreme variants', x: 50, y: 65 },
      { label: 'Historical Chart', description: 'Recent sentiment trajectory showing trend direction', x: 50, y: 85 },
    ],
  },

  defi: {
    name: 'DeFi TVL Dashboard',
    purpose: 'Total Value Locked across DeFi protocols with chain breakdown and trends.',
    sources: ['DeFi Llama'],
    refreshInterval: '5m auto-refresh',
    tier: 'DeFi',
    thesis: `The DeFi TVL Dashboard tracks Total Value Locked (TVL) across decentralized finance protocols — the most widely accepted measure of DeFi ecosystem size and health. TVL represents the aggregate capital deployed in smart contracts for lending, trading, and yield generation.

TVL trends serve as a proxy for institutional crypto adoption. Rising TVL indicates growing confidence in DeFi infrastructure, while declining TVL suggests capital flight to centralized alternatives or general market deleveraging. For precious metal-focused institutions, DeFi TVL indicates the maturity of the infrastructure that may eventually support tokenized commodity markets.

The chain breakdown reveals competitive dynamics: Ethereum's TVL dominance, Solana's growth rate, and L2 adoption all provide insight into where blockchain innovation is concentrating capital.`,
    metrics: [
      'Total DeFi TVL across all chains',
      'TVL by blockchain (Ethereum, BSC, Solana, etc.)',
      'Top protocols by TVL with 24h change',
      'TVL trend charts (7d, 30d)',
      'Chain dominance percentages',
    ],
    instructions: [
      'Monitor total TVL trend as a macro indicator for DeFi health.',
      'Chain breakdown reveals where developer and capital attention is focused.',
      'Rapidly declining TVL in a protocol may signal a de-pegging or exploit risk.',
      'Compare TVL growth rates between chains for relative momentum analysis.',
    ],
    tutorial: [
      { label: 'Total TVL', description: 'Aggregate value locked across all DeFi protocols', x: 50, y: 15 },
      { label: 'Chain Breakdown', description: 'TVL split by blockchain — Ethereum, Solana, BSC, etc.', x: 30, y: 50 },
      { label: 'Top Protocols', description: 'Highest TVL protocols with 24h change indicators', x: 70, y: 50 },
      { label: 'TVL Trend', description: '7d/30d trend chart showing ecosystem growth or contraction', x: 50, y: 80 },
    ],
  },

  pulse: {
    name: 'Market Pulse Command Center',
    purpose: 'Multi-pane executive dashboard combining price, sentiment, and volume in one view.',
    sources: ['CoinGecko', 'Metal Price API', 'Alternative.me'],
    refreshInterval: '30s auto-refresh',
    tier: 'COMPOSITE',
    thesis: `The Market Pulse Command Center is a composite analysis workspace that aggregates the most decision-critical data from multiple individual widgets into a single executive dashboard. It is designed for the portfolio manager who needs comprehensive market awareness without scrolling through dozens of individual widgets.

This workspace implements the "single-pane-of-glass" principle used by institutional trading desks: every data point needed for a go/no-go trading decision is visible simultaneously. Price action, sentiment, volume, and cross-asset correlations are presented in coordinated panels that update in unison.

The Command Center is not a replacement for individual widgets — it is a curated synthesis. Users who identify a signal in the Command Center can drill down into the specialized widget for deeper analysis.`,
    metrics: [
      'Multi-asset price ticker with sparklines',
      'Sentiment gauge (Fear & Greed)',
      'Volume anomaly detection',
      'Cross-asset momentum scores',
      'Key economic event countdown',
    ],
    instructions: [
      'Use as your session opener — scan all panels for 30 seconds to establish context.',
      'Red alerts in any panel indicate unusual conditions requiring attention.',
      'Click any panel element to navigate to the corresponding detailed widget.',
      'The combined view reveals correlations invisible in isolated widgets.',
    ],
    tutorial: [
      { label: 'Price Ticker', description: 'Multi-asset price strip with sparklines across top', x: 50, y: 10 },
      { label: 'Sentiment Gauge', description: 'Fear & Greed index providing market psychology reading', x: 20, y: 45 },
      { label: 'Volume Panel', description: 'Volume anomaly detection with alerts for unusual activity', x: 50, y: 45 },
      { label: 'Momentum Scores', description: 'Cross-asset momentum rankings for directional bias', x: 80, y: 45 },
      { label: 'Event Countdown', description: 'Upcoming high-impact economic events with timers', x: 50, y: 85 },
    ],
  },

  correlation: {
    name: 'Cross-Asset Correlation',
    purpose: 'Statistical correlation matrix between metals, crypto, forex, and commodities.',
    sources: ['Metal Price API', 'CoinGecko', 'Frankfurter'],
    refreshInterval: '60s auto-refresh',
    tier: 'COMPOSITE',
    thesis: `The Cross-Asset Correlation Dashboard computes and visualizes statistical correlations between asset classes, revealing hidden relationships and diversification opportunities. It transforms raw price data into actionable portfolio construction intelligence.

Correlations are not static — they shift with market regimes. Gold and Bitcoin may be uncorrelated during calm markets but become positively correlated during currency crises. Silver may track gold closely in one regime and diverge sharply in another. The Correlation Dashboard exposes these dynamic relationships in real-time.

For portfolio managers, correlation data is essential for true diversification. Assets that appear different but are highly correlated provide false diversification — a risk that is only visible through quantitative correlation analysis.`,
    metrics: [
      'Correlation matrix: metals, crypto, forex, energy',
      'Correlation coefficients (-1 to +1) with color intensity',
      'Rolling correlation windows (7d, 30d, 90d)',
      'Correlation breakdowns and regime changes highlighted',
    ],
    instructions: [
      'Read the matrix: values near +1 indicate assets that move together; near -1 move opposite.',
      'Values near 0 indicate true independence — ideal for diversification.',
      'Compare short-term (7d) and long-term (90d) correlations to detect regime changes.',
      'Use for portfolio construction: combine low-correlation assets for maximum diversification.',
    ],
    tutorial: [
      { label: 'Correlation Matrix', description: 'Color-coded grid — green (+1) to red (-1) showing asset relationships', x: 50, y: 45 },
      { label: 'Asset Labels', description: 'Row and column headers identifying each tracked asset', x: 10, y: 25 },
      { label: 'Time Window', description: 'Toggle between 7d, 30d, 90d rolling correlation periods', x: 80, y: 10 },
      { label: 'Diagonal', description: 'Self-correlation (always 1.0) — reference baseline', x: 30, y: 30 },
    ],
  },

  'chain-hub': {
    name: 'Blockchain Analytics Hub',
    purpose: 'Unified multi-chain dashboard aggregating BTC, ETH, XRP, and TRON metrics.',
    sources: ['mempool.space', 'Etherscan', 'XRPL API', 'TronGrid'],
    refreshInterval: '30s auto-refresh',
    tier: 'COMPOSITE',
    thesis: `The Blockchain Analytics Hub consolidates on-chain metrics from all four monitored blockchains (Bitcoin, Ethereum, XRP Ledger, TRON) into a unified comparative dashboard. It provides the cross-chain perspective essential for understanding the broader blockchain ecosystem.

Each blockchain serves a different function: Bitcoin for value storage and anchoring, Ethereum for smart contracts and DeFi, XRP for payments, TRON for stablecoin transfers. The Hub presents their respective health metrics side-by-side, enabling comparative analysis that reveals which networks are gaining or losing activity.

For Gold Arrow specifically, this Hub is operationally relevant — the certificate anchoring system interacts with Bitcoin, while the broader digital asset ecosystem spans all four chains. Understanding their collective state informs infrastructure and timing decisions.`,
    metrics: [
      'Side-by-side network health metrics for BTC, ETH, XRP, TRON',
      'Transaction throughput comparison',
      'Fee economics across chains',
      'Active address trends',
      'Block production health status',
    ],
    instructions: [
      'Compare transaction throughput across chains for relative activity analysis.',
      'Monitor fee trends — rising fees indicate growing demand for block space.',
      'Use the health status indicators to quickly identify any network issues.',
      'Tabbed interface allows focusing on individual chains or viewing all at once.',
    ],
    tutorial: [
      { label: 'Chain Tabs', description: 'Switch between BTC, ETH, XRP, TRON individual views', x: 30, y: 8 },
      { label: 'Health Status', description: 'Green/yellow/red indicators for each network\'s operational state', x: 80, y: 15 },
      { label: 'Throughput Cards', description: 'Transaction volume comparison across all four chains', x: 50, y: 45 },
      { label: 'Fee Comparison', description: 'Cross-chain fee economics side-by-side', x: 50, y: 75 },
    ],
  },

  'commodity-radar': {
    name: 'Commodity Radar',
    purpose: 'Multi-commodity performance scanner with category filtering and ranking.',
    sources: ['Metal Price API', 'CoinGecko'],
    refreshInterval: '30s auto-refresh',
    tier: 'COMPOSITE',
    thesis: `The Commodity Radar is a performance scanning tool that ranks all tracked commodities and assets by their recent price performance, with filtering by category (Metals, Energy, Crypto). It is the Intelligence suite's primary tool for identifying momentum leaders and laggards.

Relative performance analysis is a cornerstone of institutional portfolio management. Rather than asking "Is gold up today?" the Radar asks "Is gold outperforming silver, platinum, and crypto today?" This relative framing reveals strength and weakness patterns that absolute price analysis misses.

The bar chart visualization makes performance ranking immediately intuitive — the longest bars are the leaders, the shortest are the laggards. The leaders/laggards panel highlights the extremes for quick action.`,
    metrics: [
      'Performance bar chart ranking all assets by 24h change',
      'Category filter tabs: All, Metals, Energy, Crypto',
      'Leaders panel (top 3 performers)',
      'Laggards panel (bottom 3 performers)',
      'Asset price grid with detailed metrics',
    ],
    instructions: [
      'Use the category tabs to filter by asset class.',
      'Long green bars = strong outperformers; consider momentum positions.',
      'Long red bars = significant underperformers; evaluate for mean reversion.',
      'Compare leaders across categories to identify cross-asset themes.',
    ],
    tutorial: [
      { label: 'Category Tabs', description: 'Filter by ALL, METALS, ENERGY, or CRYPTO categories', x: 30, y: 8 },
      { label: 'Performance Bars', description: '24h performance ranking — longest bars are strongest movers', x: 50, y: 40 },
      { label: 'Leaders Panel', description: 'Top 3 best-performing assets with percentage gains', x: 20, y: 75 },
      { label: 'Laggards Panel', description: 'Bottom 3 worst-performing assets with percentage losses', x: 80, y: 75 },
      { label: 'Price Grid', description: 'Scrollable list of all assets with detailed metrics', x: 50, y: 90 },
    ],
  },

  'forex-room': {
    name: 'Forex War Room',
    purpose: 'Professional forex dashboard with currency strength, session clocks, and pair analysis.',
    sources: ['Frankfurter API'],
    refreshInterval: '60s auto-refresh',
    tier: 'COMPOSITE',
    thesis: `The Forex War Room is a comprehensive currency analysis workspace designed for professional forex monitoring. It combines currency pair analysis, a currency strength index, and global trading session indicators into a unified command center.

Currency strength analysis goes beyond individual pair rates — it reveals which currencies are broadly strong or weak across all their crosses. A currency that is strong against all counterparts is in a genuine bullish trend, not just benefiting from one weak counterpart.

The trading session indicators (Tokyo, London, New York) add temporal context critical for forex analysis. Liquidity, volatility, and spread conditions vary dramatically by session, and the War Room makes the current session immediately visible.`,
    metrics: [
      'Major and cross pair rates with 24h change',
      'Currency strength index ranking',
      'Active trading session indicators (Tokyo, London, New York)',
      'Session overlap periods highlighted',
      'Pair volatility indicators',
    ],
    instructions: [
      'Check the currency strength index before trading individual pairs.',
      'Trade in the direction of strong vs. weak: buy strong currency, sell weak currency.',
      'Session indicators show current market hours — liquidity is highest during overlaps.',
      'London-New York overlap (13:00-17:00 UTC) is the highest-volume forex window.',
    ],
    tutorial: [
      { label: 'Pair Table', description: 'Major and cross currency pair rates with 24h changes', x: 40, y: 35 },
      { label: 'Strength Index', description: 'Currency strength ranking — strongest to weakest', x: 80, y: 35 },
      { label: 'Session Clocks', description: 'Tokyo, London, New York session indicators with overlap highlighting', x: 50, y: 10 },
      { label: 'Volatility Bars', description: 'Per-pair volatility indicators for risk assessment', x: 40, y: 75 },
    ],
  },

  volatility: {
    name: 'Volatility Matrix',
    purpose: 'Market-wide volatility assessment with risk-level classification per asset.',
    sources: ['Metal Price API', 'CoinGecko'],
    refreshInterval: '60s auto-refresh',
    tier: 'COMPOSITE',
    thesis: `The Volatility Matrix measures and classifies price volatility across all tracked assets, assigning risk levels (Low, Moderate, High, Extreme) based on recent price standard deviation. It is the Intelligence suite's primary risk monitoring tool.

Volatility is not just a risk metric — it is an opportunity metric. Professional traders adjust position sizes inversely to volatility: smaller positions in high-volatility environments, larger in low-volatility. The Matrix provides the data needed for this critical risk management function.

The comparison between 24-hour and 7-day volatility reveals whether current conditions are escalating or normalizing. A 24h volatility spike above the 7d average signals a market event in progress; convergence suggests stabilization.`,
    metrics: [
      'Per-asset volatility scores (24h and 7d)',
      'Risk classification: Low, Moderate, High, Extreme',
      'Color-coded risk tiles (green to red)',
      'Volatility trend direction (expanding/contracting)',
      'Cross-asset volatility comparison',
    ],
    instructions: [
      'Red "EXTREME" tiles indicate assets requiring immediate attention or position reduction.',
      'Green "LOW" tiles suggest stable conditions suitable for tighter stop placement.',
      'Compare 24h vs 7d volatility — 24h > 7d indicates escalating risk.',
      'Use volatility readings to scale position sizes inversely.',
    ],
    tutorial: [
      { label: 'Risk Tiles', description: 'Color-coded tiles — green (Low) through red (Extreme) per asset', x: 50, y: 40 },
      { label: '24h Volatility', description: 'Recent 24-hour price standard deviation score', x: 30, y: 60 },
      { label: '7d Volatility', description: 'Week-long volatility for trend comparison', x: 60, y: 60 },
      { label: 'Risk Label', description: 'Classification: Low, Moderate, High, or Extreme risk level', x: 85, y: 40 },
    ],
  },

  portfolios: {
    name: 'Portfolio Allocator',
    purpose: 'Model portfolio visualizations with weighted return calculations.',
    sources: ['Metal Price API', 'CoinGecko', 'Internal Models'],
    refreshInterval: '30s auto-refresh',
    tier: 'COMPOSITE',
    thesis: `The Portfolio Allocator presents three model portfolio constructions (Conservative, Balanced, Aggressive) with real-time weighted performance calculations. It translates market data into portfolio-level impact analysis, bridging the gap between individual asset performance and investment strategy outcomes.

Asset allocation is the single most significant driver of portfolio returns — academic research consistently shows it explains 90%+ of return variation. By presenting pre-built allocation models with live performance, the Allocator demonstrates how different risk appetites translate into real portfolio behavior under current market conditions.

The weighted return calculation shows the actual portfolio-level impact of each asset's movement, preventing the common error of overreacting to a single asset's large move when its portfolio weight is small.`,
    metrics: [
      'Three model portfolios: Conservative, Balanced, Aggressive',
      'Pie chart allocation visualization per portfolio',
      'Weighted 24h return per portfolio',
      'Individual asset contribution to portfolio return',
      'Risk-return characteristics per model',
    ],
    instructions: [
      'Compare portfolio returns to identify which risk level is currently rewarded.',
      'Click portfolio tabs to switch between Conservative, Balanced, and Aggressive.',
      'Pie charts show allocation weights — larger slices have more portfolio impact.',
      'Use as a framework for your own allocation, adjusting weights to your risk tolerance.',
    ],
    tutorial: [
      { label: 'Portfolio Tabs', description: 'Switch between Conservative, Balanced, and Aggressive models', x: 30, y: 8 },
      { label: 'Pie Chart', description: 'Visual allocation weights — larger slices have more impact', x: 35, y: 50 },
      { label: 'Weighted Return', description: 'Portfolio-level 24h return based on current allocation', x: 75, y: 25 },
      { label: 'Asset Breakdown', description: 'Individual asset contribution to overall portfolio return', x: 75, y: 65 },
    ],
  },

  yields: {
    name: 'DeFi Yield Monitor',
    purpose: 'DeFi protocol yield tracking with APY comparison and trend analysis.',
    sources: ['DeFi Llama', 'CoinGecko'],
    refreshInterval: '5m auto-refresh',
    tier: 'COMPOSITE',
    thesis: `The DeFi Yield Monitor tracks yield opportunities across decentralized finance protocols, comparing APYs across lending, staking, and liquidity provision categories. For institutional analysts, DeFi yields represent both an opportunity set and a benchmark for traditional fixed-income alternatives.

Yield levels in DeFi are driven by supply/demand dynamics for capital within each protocol. Abnormally high yields may indicate either genuine demand (bullish for the protocol) or unsustainable incentive programs (risk of yield collapse). The Monitor provides the data to distinguish between these scenarios.

By categorizing yields (Lending, Staking, LP), the Monitor enables like-for-like comparison. Comparing a staking yield to a lending yield is apples-to-oranges; the Monitor ensures proper categorization for valid benchmarking.`,
    metrics: [
      'Protocol name, category, and current APY',
      'TVL per protocol with 24h change',
      'Yield trend charts (30-day history)',
      'Category breakdown: Lending, Staking, Liquidity Provision',
      'Risk-adjusted yield rankings',
    ],
    instructions: [
      'Filter by category to compare like-for-like yield opportunities.',
      'Yields significantly above category average may carry elevated risk.',
      'Check TVL alongside APY — high APY with declining TVL is a warning sign.',
      'Use the trend chart to identify yields that are compressing or expanding.',
    ],
    tutorial: [
      { label: 'Protocol List', description: 'DeFi protocols sorted by APY with category tags', x: 30, y: 40 },
      { label: 'APY Column', description: 'Current annual percentage yield — higher may mean more risk', x: 60, y: 40 },
      { label: 'TVL Column', description: 'Total value locked — validates protocol trust and adoption', x: 75, y: 40 },
      { label: 'Category Filter', description: 'Filter by Lending, Staking, or Liquidity Provision', x: 50, y: 10 },
      { label: 'Trend Chart', description: '30-day yield history showing compression or expansion', x: 50, y: 85 },
    ],
  },

  ratios: {
    name: 'Metal Ratios (Gold/Silver)',
    purpose: 'Gold-to-silver and cross-metal ratio analysis with historical context.',
    sources: ['Metal Price API', 'Internal Calculations'],
    refreshInterval: '30s auto-refresh',
    tier: 'PROPRIETARY',
    thesis: `The Metal Ratios widget calculates and visualizes cross-metal price ratios, with the gold/silver ratio as its centerpiece. This ratio is one of the oldest and most closely watched metrics in precious metals trading, with a history spanning thousands of years.

The gold/silver ratio (currently fluctuating between 75-90) measures how many ounces of silver are needed to buy one ounce of gold. Historical extremes in this ratio have been reliable indicators of relative value: when the ratio exceeds 80, silver is historically "cheap" relative to gold; below 60, silver is "expensive."

For traders, the ratio provides a pairs-trading framework: buy silver and sell gold when the ratio is historically high, expecting mean reversion. This relative value approach is market-neutral, generating returns from the spread rather than directional metal price movement.`,
    metrics: [
      'Gold/Silver ratio with historical range context',
      'Gold/Platinum ratio',
      'Silver/Platinum ratio',
      'Ratio trend chart with mean reversion bands',
      'Historical percentile ranking',
    ],
    instructions: [
      'Gold/Silver ratio above 80 historically favors long silver / short gold positions.',
      'Ratio below 60 historically favors long gold / short silver positions.',
      'Use the trend chart to identify if the ratio is expanding or compressing.',
      'Cross-reference with individual metal price trends for confirmation.',
    ],
    tutorial: [
      { label: 'Ratio Display', description: 'Current gold/silver ratio with historical context', x: 50, y: 25 },
      { label: 'Trend Chart', description: 'Ratio trend with mean reversion bands showing extremes', x: 50, y: 55 },
      { label: 'Percentile Rank', description: 'Where the current ratio falls vs historical distribution', x: 80, y: 25 },
      { label: 'Cross-Metal Ratios', description: 'Gold/Platinum and Silver/Platinum for complete picture', x: 20, y: 80 },
    ],
  },

  reserves: {
    name: 'Reserve Backing Gauge',
    purpose: 'Real-time proof-of-reserves dashboard showing physical backing ratios.',
    sources: ['Lovable Cloud DB', 'Internal Audit Data'],
    refreshInterval: 'Real-time',
    tier: 'PROPRIETARY',
    thesis: `The Reserve Backing Gauge provides cryptographic proof-of-reserves data, showing the ratio between issued certificates and physical bullion held in custody. This transparency mechanism is the foundation of Gold Arrow's institutional credibility.

Traditional precious metal certificate programs rely on periodic third-party audits with months of lag. The Reserve Gauge provides continuous, real-time backing verification derived directly from the certificate registry and vault inventory databases. Any discrepancy between issued certificates and physical holdings would be immediately visible.

This widget serves both compliance and marketing functions: it demonstrates to regulators, partners, and clients that Gold Arrow maintains full backing of all issued certificates at all times.`,
    metrics: [
      'Total certificates issued by metal type',
      'Total physical ounces in custody',
      'Backing ratio (should be ≥100%)',
      'Reserve breakdown by vault location',
      'Last audit timestamp and merkle proof hash',
    ],
    instructions: [
      'The backing ratio should always be ≥100% — anything below requires investigation.',
      'Compare certificate counts to physical ounce totals for verification.',
      'Click the merkle proof hash to view the cryptographic verification details.',
      'Monitor trends over time — consistent 100%+ backing demonstrates operational integrity.',
    ],
    tutorial: [
      { label: 'Backing Gauge', description: 'Visual gauge showing certificate-to-physical backing ratio', x: 50, y: 35 },
      { label: 'Certificate Count', description: 'Total issued certificates by metal type', x: 25, y: 65 },
      { label: 'Physical Ounces', description: 'Total physical bullion in custody backing certificates', x: 75, y: 65 },
      { label: 'Merkle Proof', description: 'Cryptographic verification hash — click to inspect', x: 50, y: 85 },
    ],
  },

  timeline: {
    name: 'Reserve History Timeline',
    purpose: 'Historical reserve snapshot timeline with merkle root anchoring proof.',
    sources: ['Lovable Cloud DB', 'Bitcoin Blockchain'],
    refreshInterval: 'Real-time',
    tier: 'PROPRIETARY',
    thesis: `The Reserve History Timeline displays a chronological record of all reserve proof snapshots, each anchored to the Bitcoin blockchain via merkle root commitments. It provides an immutable, tamper-evident audit trail of Gold Arrow's reserve history.

Each snapshot captures the state of all physical holdings at a point in time, hashes this data into a merkle tree, and commits the root hash to a Bitcoin transaction. This creates an audit trail that is cryptographically verifiable by any third party and cannot be retroactively altered without modifying the Bitcoin blockchain.

This timeline serves as the historical complement to the Reserve Gauge's real-time view. Together, they provide both current state and historical accountability.`,
    metrics: [
      'Chronological snapshot entries with timestamps',
      'Merkle root hash per snapshot',
      'Bitcoin transaction ID (txid) for blockchain anchor',
      'Total ounces at each snapshot point',
      'Bar count and metal breakdown per snapshot',
    ],
    instructions: [
      'Scroll through the timeline to review historical reserve states.',
      'Click any Bitcoin txid to verify the merkle root on a block explorer.',
      'Compare consecutive snapshots to identify reserve changes over time.',
      'Consistent or growing reserves across snapshots demonstrate ongoing backing.',
    ],
    tutorial: [
      { label: 'Timeline Entries', description: 'Chronological snapshot records with timestamps', x: 15, y: 40 },
      { label: 'Merkle Root', description: 'Cryptographic hash of the snapshot data at that point in time', x: 50, y: 40 },
      { label: 'Bitcoin TxID', description: 'Click to verify the anchor on a Bitcoin block explorer', x: 80, y: 40 },
      { label: 'Ounce Totals', description: 'Total physical ounces at each snapshot point', x: 50, y: 70 },
    ],
  },

  profiles: {
    name: 'Metal Profiles',
    purpose: 'Detailed fundamental profiles for gold, silver, and platinum with market context.',
    sources: ['Metal Price API', 'Internal Research'],
    refreshInterval: '60s auto-refresh',
    tier: 'PROPRIETARY',
    thesis: `Metal Profiles provides comprehensive fundamental analysis for each precious metal, combining current pricing with market context, use-case breakdowns, and supply/demand dynamics. It serves as the educational and analytical foundation for metal-specific investment decisions.

While price widgets show what is happening, Metal Profiles explains why. Each profile covers the metal's industrial applications, investment demand drivers, mining supply dynamics, and geopolitical sensitivity — the fundamental factors that ultimately determine long-term price trends.

The profiles are designed for both experienced metal traders who need quick reference data and newer market participants who benefit from the educational context around each metal's unique characteristics.`,
    metrics: [
      'Current price, 24h change, and YTD performance',
      'Market cap / total above-ground stock estimates',
      'Supply breakdown: mining, recycling, central bank',
      'Demand breakdown: jewelry, industrial, investment',
      'Key price drivers and risk factors',
    ],
    instructions: [
      'Select a metal tab to view its complete fundamental profile.',
      'Use the supply/demand breakdown to understand structural price drivers.',
      'Compare YTD performance across metals for relative value assessment.',
      'Review key price drivers to inform your fundamental outlook.',
    ],
    tutorial: [
      { label: 'Metal Tabs', description: 'Select Gold, Silver, or Platinum for detailed profile', x: 30, y: 8 },
      { label: 'Price & Performance', description: 'Current price, 24h change, and YTD return', x: 50, y: 25 },
      { label: 'Supply Breakdown', description: 'Mining, recycling, and central bank supply sources', x: 30, y: 60 },
      { label: 'Demand Breakdown', description: 'Jewelry, industrial, and investment demand allocation', x: 70, y: 60 },
    ],
  },

  vault: {
    name: 'Vault Inventory Matrix',
    purpose: 'Real-time inventory dashboard of physical bullion across all vault locations.',
    sources: ['Lovable Cloud DB'],
    refreshInterval: 'Real-time',
    tier: 'PROPRIETARY',
    thesis: `The Vault Inventory Matrix provides a real-time view of all physical bullion bars held across Gold Arrow's vault network. Each entry includes the bar's serial number, metal type, weight, purity, and custody status — creating a complete inventory register accessible to authorized viewers.

Physical custody transparency is the differentiator between certificate programs that build trust and those that rely on faith. The Vault Matrix makes every bar individually verifiable, preventing the common "paper gold" criticism leveled at programs with opaque custody.

The matrix also serves operational functions: identifying which bars are available (free) versus pledged against active certificates, tracking verification schedules, and monitoring vault utilization across jurisdictions.`,
    metrics: [
      'Total bar count by metal type',
      'Individual bar details: serial, weight, purity',
      'Custody status: Free, Pledged, Redeemed',
      'Vault location and jurisdiction',
      'Last verification date per bar',
    ],
    instructions: [
      'Filter by metal type to view gold, silver, or platinum inventory separately.',
      'Check custody status to see available vs. committed inventory.',
      'Click any bar serial number for full details and verification history.',
      'Monitor "Last Verified" dates — recent verification indicates active custody management.',
    ],
    tutorial: [
      { label: 'Metal Filter', description: 'Filter by gold, silver, or platinum inventory', x: 20, y: 8 },
      { label: 'Bar Table', description: 'Individual bar details: serial, weight, purity, custody status', x: 50, y: 45 },
      { label: 'Custody Status', description: 'Free, Pledged, or Redeemed — shows bar availability', x: 75, y: 45 },
      { label: 'Last Verified', description: 'Date of most recent physical verification for each bar', x: 90, y: 45 },
    ],
  },

  'bullion-heatmap': {
    name: 'Bullion Heatmap',
    purpose: 'Visual heatmap of bullion inventory distribution by weight and metal type.',
    sources: ['Lovable Cloud DB'],
    refreshInterval: 'Real-time',
    tier: 'PROPRIETARY',
    thesis: `The Bullion Heatmap transforms raw inventory data into a visual representation of how bullion is distributed across weight classes and metal types. It reveals inventory concentration patterns that numerical tables cannot convey as effectively.

For vault operations and risk management, understanding inventory distribution is critical. A vault with 90% of its gold in 400oz bars has a very different liquidity and operational profile than one distributed across 1oz, 10oz, and 100oz bars. The Heatmap exposes these distribution patterns instantly.

The color intensity encoding provides immediate visual feedback: darker tiles represent higher concentration of inventory, enabling rapid identification of over-concentration or gaps in specific weight/metal combinations.`,
    metrics: [
      'Color-coded tiles by weight class and metal type',
      'Total ounces per category',
      'Bar count per weight class',
      'Percentage of total inventory per tile',
    ],
    instructions: [
      'Darker tiles indicate higher inventory concentration in that category.',
      'Hover over any tile to see exact bar count and total ounces.',
      'Look for gaps in the heatmap — they indicate weight classes with no inventory.',
      'Use for inventory diversification planning and rebalancing decisions.',
    ],
    tutorial: [
      { label: 'Color Tiles', description: 'Darker tiles = higher inventory concentration in that category', x: 50, y: 45 },
      { label: 'Weight Classes', description: 'Column headers showing bar weight categories (1oz, 10oz, 100oz, etc.)', x: 50, y: 10 },
      { label: 'Metal Rows', description: 'Row labels for Gold, Silver, Platinum', x: 8, y: 45 },
      { label: 'Hover Details', description: 'Hover any tile for exact bar count and total ounces', x: 70, y: 70 },
    ],
  },

  screener: {
    name: 'Bullion Screener',
    purpose: 'Filterable search tool for individual bullion bars with advanced query capabilities.',
    sources: ['Lovable Cloud DB'],
    refreshInterval: 'Real-time',
    tier: 'PROPRIETARY',
    thesis: `The Bullion Screener provides a professional-grade search and filter interface for the physical bullion inventory. It enables targeted queries by metal type, weight range, purity, custody status, and vault location — the operational equivalent of a stock screener for physical assets.

Dealers and institutional buyers need to identify specific bars that meet their requirements. A buyer seeking a 100oz gold bar with 99.99% purity in a specific jurisdiction can use the Screener to find matching inventory instantly, rather than requesting manual searches from custody operations.

The Screener also serves compliance functions: auditors can filter for bars with outdated verification dates, operations can identify bars in specific custody states, and management can monitor inventory across jurisdictions.`,
    metrics: [
      'Full bar registry with all metadata fields',
      'Filter controls: metal, weight, purity, status, vault',
      'Sort by any column (weight, purity, date)',
      'Result count and summary statistics',
    ],
    instructions: [
      'Use the filter controls to narrow results by metal type, weight, or status.',
      'Click column headers to sort the results by that field.',
      'Combine filters for precise searches (e.g., gold + 100oz + free status).',
      'Export-ready format for compliance reporting.',
    ],
    tutorial: [
      { label: 'Filter Controls', description: 'Metal, weight, purity, status, and vault filter dropdowns', x: 50, y: 10 },
      { label: 'Results Table', description: 'Matching bars with full metadata — click headers to sort', x: 50, y: 50 },
      { label: 'Result Count', description: 'Total matching bars and summary statistics', x: 85, y: 10 },
    ],
  },

  certs: {
    name: 'Certificate Registry Flow',
    purpose: 'Live certificate lifecycle tracking from issuance through transfer and redemption.',
    sources: ['Lovable Cloud DB'],
    refreshInterval: 'Real-time',
    tier: 'PROPRIETARY',
    thesis: `The Certificate Registry Flow visualizes the complete lifecycle of Gold Arrow certificates — from issuance through transfers, freezes, and redemptions. It provides unprecedented transparency into the digital asset layer that represents physical bullion ownership.

Each certificate is a cryptographically signed digital document linking a wallet address to specific physical bullion through a partner-verified attestation. The Registry Flow shows how these certificates move through their lifecycle states, providing both operational visibility and compliance documentation.

For institutional credibility, the Registry Flow demonstrates that every certificate has a verifiable origin (issuance by an authorized partner), a clear ownership chain (transfer history), and a defined end state (redemption for physical delivery or revocation). This lifecycle transparency is the foundation of trust in tokenized physical assets.`,
    metrics: [
      'Total certificates by status: Active, Frozen, Revoked, Redeemed',
      'Recent certificate events with timestamps',
      'Certificate flow visualization (issuance → transfers → end state)',
      'Partner attribution for each certificate',
      'Linked wallet addresses and bullion bar references',
    ],
    instructions: [
      'Monitor the status breakdown for overall certificate health.',
      'Click any certificate ID to view its full lifecycle history.',
      'Active certificates should always be backed by corresponding vault inventory.',
      'Frozen certificates indicate pending investigation or compliance holds.',
    ],
    tutorial: [
      { label: 'Status Breakdown', description: 'Active, Frozen, Revoked, Redeemed certificate counts', x: 50, y: 15 },
      { label: 'Event Feed', description: 'Recent certificate lifecycle events with timestamps', x: 50, y: 50 },
      { label: 'Flow Visualization', description: 'Lifecycle diagram: issuance → transfers → end state', x: 50, y: 80 },
      { label: 'Partner Tag', description: 'Which authorized partner issued each certificate', x: 85, y: 50 },
    ],
  },

  anchors: {
    name: 'Bitcoin Anchor Status',
    purpose: 'Real-time status of Bitcoin blockchain anchoring operations for certificate integrity.',
    sources: ['Lovable Cloud DB', 'Bitcoin Blockchain'],
    refreshInterval: 'Real-time',
    tier: 'PROPRIETARY',
    thesis: `The Bitcoin Anchor Status widget monitors the state of Gold Arrow's merkle root commitment operations to the Bitcoin blockchain. Each anchor represents a cryptographic proof that a specific set of certificate events existed at a specific point in time, committed to the world's most secure and immutable ledger.

The anchoring process works in stages: events are collected into merkle trees (pending), transactions are broadcast to the Bitcoin network (broadcast), and finally confirmed by miners (confirmed). This widget tracks each anchor through these stages, providing operational visibility into the proof-generation pipeline.

Confirmed anchors are Gold Arrow's strongest trust guarantee — they create an audit trail that is independently verifiable by any party with a Bitcoin node, requiring zero trust in Gold Arrow's own systems. The Anchor Status widget ensures this critical infrastructure is operating correctly.`,
    metrics: [
      'Anchor status: Pending, Broadcast, Confirmed',
      'Merkle root hash and leaf count per anchor',
      'Bitcoin transaction ID (txid) for confirmed anchors',
      'Block height and confirmation time',
      'Pipeline throughput (anchors per period)',
    ],
    instructions: [
      'Green "Confirmed" status indicates successful blockchain anchoring.',
      'Yellow "Broadcast" indicates the transaction is awaiting Bitcoin confirmations.',
      'Red "Pending" indicates anchors that have not yet been broadcast.',
      'Click any txid to verify the anchor on a Bitcoin block explorer.',
    ],
    tutorial: [
      { label: 'Status Column', description: 'Green (Confirmed), Yellow (Broadcast), Red (Pending) indicators', x: 15, y: 40 },
      { label: 'Merkle Root', description: 'Hash of the anchored data — cryptographic proof', x: 45, y: 40 },
      { label: 'Leaf Count', description: 'Number of certificate events included in this anchor', x: 65, y: 40 },
      { label: 'Bitcoin TxID', description: 'Click to verify on a block explorer', x: 85, y: 40 },
    ],
  },

  activity: {
    name: 'Anchored Activity Feed',
    purpose: 'Chronological feed of certificate events that have been anchored to Bitcoin.',
    sources: ['Lovable Cloud DB'],
    refreshInterval: 'Real-time',
    tier: 'PROPRIETARY',
    thesis: `The Anchored Activity Feed displays a chronological stream of certificate lifecycle events (issuances, transfers, status changes) that have been cryptographically committed to the Bitcoin blockchain through the anchoring system. It provides the most granular view of Gold Arrow's provenance operations.

Each event in the feed has been included in a merkle tree, whose root was committed to a Bitcoin transaction. This means every event displayed in the feed is independently verifiable — a standard of proof that exceeds traditional audit trails by leveraging Bitcoin's immutability.

The feed serves multiple audiences: operations teams monitor for unusual event patterns, compliance officers verify that all events are being properly anchored, and institutional clients can observe the real-time activity of the platform they trust with their physical asset ownership.`,
    metrics: [
      'Event type: Issued, Transferred, Frozen, Revoked, Redeemed',
      'Certificate ID and associated wallet addresses',
      'Event timestamp and anchor status',
      'Partner attribution (which partner triggered the event)',
      'Merkle leaf position for cryptographic verification',
    ],
    instructions: [
      'Scroll the feed to review recent certificate activity.',
      'Filter by event type to focus on specific lifecycle stages.',
      'Events with confirmed anchor status have the strongest integrity guarantee.',
      'Cross-reference event timestamps with Anchor Status for verification pipeline tracking.',
    ],
    tutorial: [
      { label: 'Event Type', description: 'Issued, Transferred, Frozen, Revoked, or Redeemed tag', x: 15, y: 40 },
      { label: 'Certificate ID', description: 'Unique certificate identifier — click for full history', x: 40, y: 40 },
      { label: 'Timestamp', description: 'When the event occurred in the lifecycle', x: 65, y: 40 },
      { label: 'Anchor Status', description: 'Whether this event has been committed to Bitcoin', x: 85, y: 40 },
    ],
  },

  partners: {
    name: 'Partner Network',
    purpose: 'Visualization of Gold Arrow\'s institutional partner ecosystem with status tracking.',
    sources: ['Lovable Cloud DB'],
    refreshInterval: 'Real-time',
    tier: 'PROPRIETARY',
    thesis: `The Partner Network widget visualizes Gold Arrow's ecosystem of institutional partners — vaults, dealers, custodians, and arbiters — that collectively provide the physical infrastructure backing the digital certificate system. It demonstrates the institutional breadth supporting the platform.

Each partner type serves a distinct function in the trust chain: vaults provide physical custody, dealers facilitate acquisition and liquidation, custodians manage ongoing asset management, and arbiters resolve disputes. The network visualization shows how these roles interconnect to create a complete custody ecosystem.

Partner status tracking (Active, Suspended, Offboarded) provides transparency into the operational health of the network. Active partners with verified mTLS connections demonstrate ongoing, authenticated integration with Gold Arrow's infrastructure.`,
    metrics: [
      'Partner count by type: Vault, Dealer, Custodian, Arbiter',
      'Status distribution: Active, Suspended, Offboarded',
      'Jurisdiction mapping for each partner',
      'Site count and geographic distribution',
      'Integration status (API connectivity)',
    ],
    instructions: [
      'Review the partner type distribution for ecosystem balance.',
      'Active status with green indicators confirms operational connectivity.',
      'Click any partner to view their sites, jurisdiction, and integration details.',
      'Multiple partners per type provides redundancy and competitive custody options.',
    ],
    tutorial: [
      { label: 'Partner Cards', description: 'Individual partner tiles showing type, status, and jurisdiction', x: 50, y: 40 },
      { label: 'Type Legend', description: 'Vault, Dealer, Custodian, Arbiter role indicators', x: 15, y: 15 },
      { label: 'Status Badge', description: 'Active (green), Suspended (yellow), Offboarded (red)', x: 80, y: 40 },
      { label: 'Site Count', description: 'Number of physical sites operated by each partner', x: 50, y: 75 },
    ],
  },

  // ═══════════════ OIL & GAS ENERGY WIDGETS ═══════════════

  'og-prices': {
    name: 'Energy Spot Prices',
    purpose: 'Live spot and near-month futures prices for crude oil, natural gas, and refined products.',
    sources: ['EIA v2 API', 'CME', 'ICE'],
    refreshInterval: '30s auto-refresh',
    tier: 'ENERGY',
    thesis: `The Energy Spot Prices panel is the foundational pricing layer for all energy market analysis. It displays live prices for WTI Crude, Brent Crude, Henry Hub Natural Gas, RBOB Gasoline, and Heating Oil — the five benchmark contracts that anchor global energy trading.

Each price card combines the current spot level with a 24-hour percentage change and directional indicator, providing immediate context on market momentum. The data flows from the EIA v2 API through a dedicated backend function with multi-source fallback, ensuring continuous price visibility even during API maintenance windows.

For institutional energy desks, having all five benchmarks in a single view eliminates the need to toggle between CME and ICE terminals, providing a unified pricing baseline that feeds into every other analytical widget on this dashboard.`,
    metrics: [
      'WTI Crude Oil spot price ($/bbl)',
      'Brent Crude spot price ($/bbl)',
      'Henry Hub Natural Gas ($/MMBtu)',
      'RBOB Gasoline ($/gal)',
      'Heating Oil ($/gal)',
      '24-hour change (absolute & percentage)',
    ],
    instructions: [
      'Prices auto-refresh every 30 seconds — no manual action required.',
      'Green arrows indicate positive 24h movement; red arrows indicate price decline.',
      'Use these spot prices as the baseline reference for interpreting spread and margin widgets.',
      'WTI and Brent are quoted per barrel; gas products are quoted per gallon or MMBtu.',
    ],
    tutorial: [
      { label: 'Price Cards', description: 'Individual cards for WTI, Brent, NatGas, Gasoline, Heating Oil', x: 50, y: 40 },
      { label: 'Change Arrow', description: 'Green up-arrow or red down-arrow showing 24h direction', x: 80, y: 25 },
      { label: 'Percentage Change', description: '24h percentage and absolute price movement', x: 80, y: 55 },
      { label: 'Unit Label', description: 'Per-barrel, per-gallon, or per-MMBtu pricing denomination', x: 30, y: 70 },
    ],
  },

  'og-futures': {
    name: 'Futures Curve',
    purpose: 'Forward curve visualization showing term structure across multiple contract months.',
    sources: ['CME', 'ICE'],
    refreshInterval: '60s auto-refresh',
    tier: 'ENERGY',
    thesis: `The Futures Curve widget plots the term structure of WTI and Brent crude oil futures across multiple delivery months, revealing whether the market is in contango (upward-sloping, future prices higher than spot) or backwardation (downward-sloping, spot premium over futures).

This shape of the curve is one of the most critical signals in energy trading. Persistent backwardation signals tight physical supply and draws on inventories, while steep contango indicates oversupply and incentivizes storage plays. The curve shape directly influences the economics of physical crude storage, pipeline scheduling, and refinery procurement strategies.

By visualizing the full curve rather than individual contract prices, traders can identify inflection points, roll-yield opportunities, and term-structure anomalies that are invisible when monitoring only front-month contracts.`,
    metrics: [
      'Contract prices across 12+ delivery months',
      'Contango vs backwardation shape identification',
      'Front-month to back-month spread',
      'Curve steepness and inflection points',
      'WTI and Brent curve overlay comparison',
    ],
    instructions: [
      'Examine the curve slope — upward = contango (oversupply), downward = backwardation (tightness).',
      'Hover over individual contract months to see exact settlement prices.',
      'Compare WTI and Brent curves to assess relative term structure.',
      'Look for inflection points where the curve changes direction — these often indicate seasonal supply/demand shifts.',
    ],
    tutorial: [
      { label: 'Series Toggles', description: 'Switch between WTI+Brent combined, WTI only, or Brent only', x: 25, y: 8 },
      { label: 'Curve Line', description: 'Forward price curve across delivery months — slope reveals market structure', x: 50, y: 45 },
      { label: 'M1 Spread', description: 'Front-month WTI-Brent differential value', x: 85, y: 8 },
      { label: 'Shape Label', description: 'CONTANGO or BACKWARDATION classification', x: 50, y: 90 },
      { label: 'Month Axis', description: 'Delivery months from near to far — hover for exact prices', x: 50, y: 75 },
    ],
  },

  'og-wti-brent': {
    name: 'WTI-Brent Spread Tracker',
    purpose: '30-day historical visualization of the WTI-Brent crude oil price differential.',
    sources: ['EIA', 'CME'],
    refreshInterval: '60s auto-refresh',
    tier: 'ENERGY',
    thesis: `The WTI-Brent Spread is the single most-watched inter-crude differential in global energy markets. It reflects the relative pricing between US domestic crude (WTI, delivered at Cushing, Oklahoma) and the international waterborne benchmark (Brent, North Sea), encoding information about transportation logistics, pipeline capacity, export economics, and regional supply imbalances.

When WTI trades at a deep discount to Brent, it signals US oversupply relative to export capacity, potentially indicating Cushing inventory builds or pipeline bottlenecks. Conversely, when the spread narrows or inverts, it suggests strong US crude demand or constrained international supply. This spread directly drives the profitability of US crude exports and influences refinery crude procurement strategies globally.

The 30-day historical view captures the spread's trajectory, enabling traders to identify trend changes, mean-reversion opportunities, and structural shifts driven by geopolitical events or infrastructure changes.`,
    metrics: [
      'Current WTI-Brent spread ($/bbl)',
      '30-day historical spread chart',
      'Average, minimum, and maximum spread over period',
      'Spread direction and momentum',
    ],
    instructions: [
      'A negative value means WTI trades at a discount to Brent (the typical state).',
      'Hover over the chart to see daily spread values across the 30-day window.',
      'Widening spreads may indicate US pipeline or export capacity constraints.',
      'Cross-reference with the Inventory widget to validate supply-side explanations for spread moves.',
    ],
    tutorial: [
      { label: 'Spread Value', description: 'Current WTI-Brent differential in $/bbl', x: 50, y: 15 },
      { label: 'Historical Chart', description: '30-day spread trajectory — hover for daily values', x: 50, y: 50 },
      { label: 'Average Line', description: 'Period average for mean-reversion reference', x: 30, y: 50 },
      { label: 'Min/Max Range', description: 'Extremes over the 30-day window', x: 80, y: 50 },
    ],
  },

  'og-spreads': {
    name: 'Crack Spreads & Margins',
    purpose: 'Refinery margin indicators showing the economics of converting crude oil into refined products.',
    sources: ['EIA', 'CME'],
    refreshInterval: '60s auto-refresh',
    tier: 'ENERGY',
    thesis: `Crack Spreads measure the theoretical profit margin of refining crude oil into finished products — primarily gasoline (RBOB) and distillates (heating oil/diesel). The "3-2-1" crack spread (3 barrels of crude refined into 2 barrels of gasoline and 1 barrel of distillate) is the industry-standard proxy for US Gulf Coast refinery profitability.

These margins are critical for understanding refinery utilization decisions. When crack spreads are strong, refineries maximize throughput, increasing crude demand and drawing down inventories. When spreads compress, refineries reduce runs, cutting crude demand and potentially building stocks. This feedback loop makes crack spreads a leading indicator for crude oil demand.

The widget tracks multiple spread configurations (gasoline crack, heating oil crack, composite 3-2-1) to give a complete picture of refinery economics across product slates, enabling analysts to identify which product is driving overall refinery margins.`,
    metrics: [
      '3-2-1 crack spread ($/bbl)',
      'Gasoline crack spread',
      'Distillate/heating oil crack spread',
      'Historical spread trends',
      'Margin direction indicators',
    ],
    instructions: [
      'The 3-2-1 spread is the primary indicator — higher values mean more profitable refining.',
      'Compare gasoline vs distillate cracks to see which product is driving margins.',
      'Strong cracks typically correlate with higher refinery runs and increased crude demand.',
      'Seasonal patterns are significant — gasoline cracks peak in summer, distillate cracks in winter.',
    ],
    tutorial: [
      { label: '3-2-1 Spread', description: 'Composite refinery margin — the primary indicator', x: 50, y: 20 },
      { label: 'Gasoline Crack', description: 'RBOB gasoline refining margin component', x: 25, y: 50 },
      { label: 'Distillate Crack', description: 'Heating oil/diesel refining margin component', x: 75, y: 50 },
      { label: 'Direction Arrow', description: 'Margin trend — expanding or compressing', x: 85, y: 20 },
    ],
  },

  'og-inventory': {
    name: 'EIA Crude Inventory',
    purpose: 'Weekly US commercial crude oil inventory tracking with draw/build analysis.',
    sources: ['EIA v2 API'],
    refreshInterval: '5min auto-refresh',
    tier: 'ENERGY',
    thesis: `The EIA Weekly Petroleum Status Report is the single most market-moving regularly scheduled data release in energy markets. This widget tracks US commercial crude oil inventories at Cushing, Oklahoma (the WTI delivery hub) and total US commercial stocks, providing the definitive measure of physical supply-demand balance in the world's largest oil market.

Inventory draws (declining stocks) signal that consumption and exports exceed production and imports, a fundamentally bullish signal. Inventory builds signal the opposite. The magnitude of the weekly change relative to consensus expectations drives immediate price reactions — surprises of ±2 million barrels routinely move crude prices by 1-3%.

The gauge visualization provides immediate context by showing current inventory levels relative to the 5-year seasonal range, enabling traders to assess whether stocks are historically elevated, depleted, or at normal seasonal levels — context that raw barrel counts alone cannot provide.`,
    metrics: [
      'Total US commercial crude stocks (million barrels)',
      'Cushing, OK hub inventory level',
      'Weekly change (draw or build, million barrels)',
      'Position relative to 5-year seasonal range',
      'Days of supply coverage',
    ],
    instructions: [
      'Green gauge zones indicate below-average inventory (bullish); red zones indicate builds (bearish).',
      'The weekly change figure is the most actionable data point — compare it to consensus expectations.',
      'EIA reports release every Wednesday at 10:30 AM ET — expect data updates shortly after.',
      'Cross-reference inventory changes with refinery utilization and import/export data for context.',
    ],
    tutorial: [
      { label: 'Gauge Dial', description: 'Current inventory level relative to 5-year seasonal range', x: 50, y: 35 },
      { label: 'Weekly Change', description: 'Barrels added (build) or drawn (draw) from storage', x: 50, y: 65 },
      { label: 'Cushing Level', description: 'WTI delivery hub inventory — operationally critical', x: 25, y: 80 },
      { label: 'Days of Supply', description: 'How many days current inventory would cover at current consumption', x: 75, y: 80 },
    ],
  },

  'og-rigs': {
    name: 'Baker Hughes Rig Count',
    purpose: 'Weekly US and international oil & gas rig activity tracking as a leading production indicator.',
    sources: ['Baker Hughes'],
    refreshInterval: '10min auto-refresh',
    tier: 'ENERGY',
    thesis: `The Baker Hughes Rig Count is the industry-standard leading indicator of future oil and gas production. Since drilling activity precedes production by 3-6 months, changes in rig counts provide early warning of supply trajectory shifts before they appear in production or inventory data.

This widget tracks the total US oil and gas rig count alongside directional changes, enabling analysts to monitor the upstream investment cycle. Rising rig counts signal operator confidence and expanding capital expenditure, typically associated with higher oil prices and strong balance sheets. Declining counts signal capital discipline, budget cuts, or price-driven activity reductions.

The oil/gas rig breakdown is particularly important as it reveals sector-specific drilling trends. In the US shale landscape, the mix between oil-directed and gas-directed rigs reflects relative commodity economics and producer hedging strategies.`,
    metrics: [
      'Total US oil rig count',
      'Total US gas rig count',
      'Combined US rig count',
      'Weekly change (rigs added or removed)',
      'International rig count comparison',
    ],
    instructions: [
      'Baker Hughes releases rig counts every Friday at 1:00 PM ET.',
      'Rising rig counts are a leading indicator of future production growth (3-6 month lag).',
      'Compare oil vs gas rig trends to understand producer capital allocation decisions.',
      'Sustained rig count declines often precede supply tightening and price support.',
    ],
    tutorial: [
      { label: 'Oil Rig Count', description: 'Total US oil-directed rigs currently active', x: 25, y: 30 },
      { label: 'Gas Rig Count', description: 'Total US gas-directed rigs currently active', x: 50, y: 30 },
      { label: 'Weekly Change', description: 'Rigs added or removed from last week — direction matters', x: 75, y: 30 },
      { label: 'Trend Chart', description: 'Historical rig count trajectory showing drilling cycle', x: 50, y: 70 },
    ],
  },

  'og-supply-demand': {
    name: 'Global Supply/Demand Balance',
    purpose: 'Macro-level visualization of global oil production versus consumption with surplus/deficit tracking.',
    sources: ['IEA', 'EIA', 'OPEC'],
    refreshInterval: '10min auto-refresh',
    tier: 'ENERGY',
    thesis: `The Global Supply/Demand Balance is the most fundamental analytical framework in energy markets. By aggregating production and consumption estimates from the three authoritative agencies (IEA, EIA, and OPEC), this widget reveals the global surplus or deficit that ultimately drives inventory changes, price trends, and OPEC+ policy decisions.

Each agency publishes monthly estimates that can diverge by 0.5-1.5 million barrels per day — a spread that itself contains analytical value. The IEA (Paris-based, consumer-country perspective), EIA (US government, statistically rigorous), and OPEC (producer cartel, politically influenced) each bring different methodological approaches and potential biases.

The implied stock change (production minus consumption) is the key output — a persistent deficit signals inventory draws and potential price support, while a surplus suggests builds and potential price pressure. Seasonal patterns, demand growth forecasts, and OPEC+ production decisions are the primary variables driving the balance.`,
    metrics: [
      'Global oil production (million bpd)',
      'Global oil consumption/demand (million bpd)',
      'Implied surplus or deficit (million bpd)',
      'Year-over-year demand growth rate',
      'OPEC vs non-OPEC production split',
    ],
    instructions: [
      'Focus on the surplus/deficit figure — positive means oversupply, negative means undersupply.',
      'Compare estimates across IEA, EIA, and OPEC to identify agency divergence.',
      'Seasonal demand patterns are significant — Q3 typically sees highest demand (summer driving + cooling).',
      'Cross-reference with OPEC+ Compliance to understand whether supply adjustments are voluntary or market-driven.',
    ],
    tutorial: [
      { label: 'Supply Bar', description: 'Global oil production in million barrels per day', x: 25, y: 35 },
      { label: 'Demand Bar', description: 'Global oil consumption/demand in million bpd', x: 75, y: 35 },
      { label: 'Balance Indicator', description: 'Surplus (+) or deficit (-) — the key output', x: 50, y: 60 },
      { label: 'Growth Rate', description: 'Year-over-year demand growth percentage', x: 50, y: 80 },
    ],
  },

  'og-opec': {
    name: 'OPEC+ Compliance Monitor',
    purpose: 'Tracking OPEC+ production quotas versus actual output to measure cartel discipline.',
    sources: ['OPEC MOMR'],
    refreshInterval: '10min auto-refresh',
    tier: 'ENERGY',
    thesis: `OPEC+ compliance — the degree to which member nations adhere to agreed production quotas — is the most important variable in global oil supply management. This widget tracks each member's production quota versus actual output, revealing the cartel's collective discipline and identifying habitual overproducers.

High compliance (above 90%) indicates strong cartel cohesion and effective supply management, typically supportive of oil prices. Declining compliance signals internal disagreements, quota cheating, or economic pressures forcing members to overproduce — historically a precursor to price wars or quota collapses.

The Monthly Oil Market Report (MOMR) from OPEC is the primary data source, supplemented by secondary source estimates from tanker tracking and satellite monitoring. Individual country compliance rates reveal the political dynamics within the cartel — Saudi Arabia's role as swing producer, UAE's capacity ambitions, and Russian adherence to non-OPEC+ commitments.`,
    metrics: [
      'Overall OPEC+ compliance rate (%)',
      'Individual member production vs quota',
      'Total OPEC+ production (million bpd)',
      'Voluntary cut adherence',
      'Spare capacity estimates by member',
    ],
    instructions: [
      'Compliance above 100% means the group is cutting more than agreed (bullish for prices).',
      'Identify members consistently above quota — they represent risk to cartel discipline.',
      'OPEC MOMR releases monthly — data updates reflect the latest available report.',
      'Saudi Arabia\'s production relative to its quota is the single most important member-level signal.',
    ],
    tutorial: [
      { label: 'Compliance Rate', description: 'Overall OPEC+ compliance percentage — above 100% is bullish', x: 50, y: 15 },
      { label: 'Member Table', description: 'Individual country production vs quota breakdown', x: 50, y: 50 },
      { label: 'Over-Quota Flag', description: 'Red highlights on members exceeding their allocation', x: 80, y: 50 },
      { label: 'Spare Capacity', description: 'Estimated production headroom by member', x: 50, y: 85 },
    ],
  },

  'og-production': {
    name: 'Top Producers',
    purpose: 'Ranked visualization of the world\'s largest oil-producing nations with output data.',
    sources: ['EIA', 'IEA'],
    refreshInterval: '10min auto-refresh',
    tier: 'ENERGY',
    thesis: `The Top Producers widget ranks the world's largest oil-producing nations by daily output, providing geopolitical context for global supply analysis. The concentration of production among a small number of nations — the US, Saudi Arabia, and Russia account for roughly 40% of global output — means that policy decisions, sanctions, or disruptions in any single country can materially impact global supply.

This ranking also reveals structural shifts in the production landscape. The rise of US shale transformed America from a net importer to the world's largest producer in under a decade, fundamentally altering global energy geopolitics. Similarly, production growth in Brazil, Guyana, and other non-OPEC nations is gradually eroding OPEC's market share and pricing power.

By tracking production levels alongside growth rates, analysts can identify which producers are gaining or losing share, informing long-term supply forecasts and geopolitical risk assessments.`,
    metrics: [
      'Production ranking by country (million bpd)',
      'Market share by producer',
      'Year-over-year production changes',
      'OPEC vs non-OPEC output split',
    ],
    instructions: [
      'The top three producers (US, Saudi Arabia, Russia) are the key swing suppliers.',
      'Compare OPEC members\' actual output against their quotas using the OPEC+ Compliance widget.',
      'Growth in non-OPEC producers (US, Brazil, Guyana) represents structural supply additions.',
      'Production disruptions in any top-10 producer can move global prices significantly.',
    ],
    tutorial: [
      { label: 'Country Ranking', description: 'Producers ranked by daily output in million bpd', x: 30, y: 40 },
      { label: 'Output Bar', description: 'Visual bar showing relative production size', x: 60, y: 40 },
      { label: 'Market Share', description: 'Percentage of global production each country represents', x: 80, y: 40 },
      { label: 'OPEC Badge', description: 'Identifies which producers are OPEC members', x: 15, y: 40 },
    ],
  },

  'og-pipelines': {
    name: 'Global Pipeline Flow',
    purpose: 'Major oil and gas pipeline utilization and throughput tracking.',
    sources: ['EIA', 'FERC'],
    refreshInterval: '5min auto-refresh',
    tier: 'ENERGY',
    thesis: `Pipeline infrastructure represents the physical arteries of the global energy system. This widget monitors utilization rates and throughput volumes for major crude oil and natural gas pipelines, revealing transportation bottlenecks, capacity constraints, and flow disruptions that directly impact regional pricing differentials.

Pipeline capacity constraints have historically created some of the most significant pricing dislocations in energy markets. The Permian Basin pipeline shortage of 2018-2019, for example, caused Midland WTI to trade at a $15+/bbl discount to Cushing WTI, creating massive arbitrage opportunities for traders with pipeline access. Similarly, Canadian heavy crude (WCS) discounts have widened dramatically during periods of export pipeline constraints.

By monitoring utilization rates across major corridors, traders can anticipate capacity-driven pricing anomalies, identify stranded production risk, and evaluate the impact of new pipeline projects on regional basis differentials.`,
    metrics: [
      'Pipeline utilization rate (%)',
      'Throughput volume (bpd or MMcf/d)',
      'Capacity vs actual flow',
      'Regional pipeline corridor status',
      'Maintenance and outage alerts',
    ],
    instructions: [
      'Utilization above 90% signals near-capacity operation and potential bottleneck risk.',
      'Compare pipeline flows with production data to identify stranded supply situations.',
      'Natural gas pipelines are particularly sensitive to seasonal heating/cooling demand shifts.',
      'New pipeline completions can rapidly compress regional price differentials.',
    ],
    tutorial: [
      { label: 'Pipeline List', description: 'Major crude and gas pipelines with corridor names', x: 25, y: 35 },
      { label: 'Utilization Bar', description: 'Visual capacity utilization — red above 90% signals bottleneck', x: 55, y: 35 },
      { label: 'Flow Volume', description: 'Current throughput in bpd or MMcf/d', x: 75, y: 35 },
      { label: 'Alert Icons', description: 'Maintenance or outage notifications for each pipeline', x: 90, y: 35 },
    ],
  },

  'og-chokepoints': {
    name: 'Geopolitical Chokepoint Risk',
    purpose: 'Real-time monitoring of critical maritime transit points for global oil flows.',
    sources: ['Shipping Telemetry', 'EIA'],
    refreshInterval: '60s auto-refresh',
    tier: 'ENERGY',
    thesis: `Maritime chokepoints — narrow straits and canals through which significant volumes of global oil transit — represent the highest-concentration geopolitical risk points in energy markets. The Strait of Hormuz alone handles approximately 20% of global oil consumption daily, meaning any disruption would trigger an immediate and severe supply shock.

This widget monitors vessel traffic, throughput estimates, and risk levels for the six most critical chokepoints: Strait of Hormuz, Strait of Malacca, Suez Canal, Bab el-Mandeb, Turkish Straits, and Panama Canal. Each point is assessed for operational status, recent disruption events, and geopolitical threat level based on regional conflict indicators and shipping insurance rates.

The Houthi attacks on Red Sea shipping in 2024 demonstrated how chokepoint disruptions cascade through global supply chains, increasing shipping costs, extending transit times, and creating regional supply imbalances. This widget provides early warning of similar emerging risks across all critical transit corridors.`,
    metrics: [
      'Throughput volume per chokepoint (million bpd)',
      'Vessel traffic density',
      'Risk level assessment (low/medium/high/critical)',
      'Recent disruption events',
      'Alternative routing impact (cost and time)',
    ],
    instructions: [
      'Red risk levels indicate active or imminent disruption threats — cross-reference with news feed.',
      'The Strait of Hormuz is the highest-impact chokepoint — monitor Iranian geopolitical tensions closely.',
      'Chokepoint disruptions typically cause immediate crude price spikes and tanker rate increases.',
      'Compare throughput volumes with historical averages to identify unusual flow patterns.',
    ],
    tutorial: [
      { label: 'Chokepoint Map', description: 'Six critical maritime transit points with risk indicators', x: 50, y: 35 },
      { label: 'Risk Level', description: 'Low/Medium/High/Critical assessment per chokepoint', x: 80, y: 25 },
      { label: 'Throughput', description: 'Million bpd flowing through each strait or canal', x: 30, y: 60 },
      { label: 'Disruption Log', description: 'Recent incidents or threats affecting transit', x: 50, y: 85 },
    ],
  },

  'og-news': {
    name: 'Energy Intelligence Feed',
    purpose: 'Curated energy sector news and analysis from authoritative industry sources.',
    sources: ['Public RSS', 'EIA'],
    refreshInterval: '2min auto-refresh',
    tier: 'ENERGY',
    thesis: `The Energy Intelligence Feed aggregates real-time news and analysis from authoritative energy industry sources, providing the narrative context that explains price movements, policy changes, and supply disruptions tracked by the quantitative widgets.

Energy markets are uniquely sensitive to geopolitical developments — OPEC+ meeting outcomes, sanctions announcements, pipeline outages, hurricane forecasts, and regulatory changes can all move prices significantly within minutes. This feed prioritizes institutional-quality sources over retail news, filtering for actionable intelligence rather than clickbait or opinion content.

The feed is organized chronologically with source attribution, enabling analysts to track developing stories across multiple sources and assess consensus vs contrarian viewpoints. Cross-referencing news developments with real-time price movements in the Spot Prices widget creates a complete picture of market-moving events.`,
    metrics: [
      'Breaking energy news headlines',
      'Source attribution and timestamp',
      'Category tags (OPEC, supply, demand, policy, weather)',
      'Story development tracking',
    ],
    instructions: [
      'Scan headlines for OPEC, EIA, and pipeline-related keywords — these are most market-moving.',
      'Cross-reference breaking news with the Spot Prices widget to assess market reaction.',
      'Weather-related headlines (hurricanes, polar vortex) impact both supply and demand.',
      'EIA weekly report commentary provides context for inventory data interpretation.',
    ],
    tutorial: [
      { label: 'Headlines', description: 'Breaking energy news — click to open full article', x: 50, y: 35 },
      { label: 'Source Tag', description: 'Attribution showing which authoritative source published it', x: 15, y: 55 },
      { label: 'Timestamp', description: 'Publication time for assessing recency', x: 85, y: 35 },
      { label: 'Category Tags', description: 'OPEC, supply, demand, policy, weather topic filters', x: 50, y: 15 },
    ],
  },

  'og-energy-dashboard': {
    name: 'Energy Executive Dashboard',
    purpose: 'Consolidated multi-pane energy market overview for executive-level briefings.',
    sources: ['EIA', 'CME', 'ICE'],
    refreshInterval: '60s auto-refresh',
    tier: 'ENERGY',
    thesis: `The Energy Executive Dashboard consolidates the most critical energy market indicators into a single, dense analytical workspace designed for senior decision-makers who need a comprehensive market view without navigating multiple individual widgets.

This composite tool aggregates spot prices, inventory positions, spread analytics, and supply-demand balances into a multi-pane layout that reveals cross-variable relationships. For example, viewing crack spreads alongside inventory changes and rig counts simultaneously enables rapid identification of whether margin compression is driven by oversupply, weak demand, or refinery over-processing.

The dashboard is designed for the "morning briefing" use case — a 30-second scan that provides sufficient context to make informed trading, hedging, or procurement decisions. All data panes share the same refresh cycle, ensuring temporal consistency across displayed metrics.`,
    metrics: [
      'Key benchmark prices (WTI, Brent, Henry Hub)',
      'Weekly inventory change summary',
      'Crack spread overview',
      'Rig count trend',
      'Supply/demand balance indicator',
      'Top geopolitical risk flag',
    ],
    instructions: [
      'Use this dashboard for daily morning market assessment before drilling into individual widgets.',
      'Red highlights across multiple panes simultaneously indicate correlated stress events.',
      'The dashboard provides breadth — switch to individual widgets for analytical depth on any metric.',
      'All data refreshes synchronously to ensure cross-pane temporal consistency.',
    ],
    tutorial: [
      { label: 'Price Strip', description: 'Key benchmark prices (WTI, Brent, Henry Hub) at the top', x: 50, y: 10 },
      { label: 'Inventory Pane', description: 'Weekly inventory change summary for quick context', x: 25, y: 40 },
      { label: 'Spread Pane', description: 'Crack spread and WTI-Brent differential overview', x: 75, y: 40 },
      { label: 'Rig Count', description: 'Current rig count trend indicator', x: 25, y: 75 },
      { label: 'Risk Flag', description: 'Top geopolitical risk alert — red = active concern', x: 75, y: 75 },
    ],
  },

  'og-risk-analyzer': {
    name: 'Risk & Spreads Analyzer',
    purpose: 'Multi-factor risk assessment combining price spreads, geopolitical signals, and supply metrics.',
    sources: ['EIA', 'CME', 'Shipping Telemetry'],
    refreshInterval: '60s auto-refresh',
    tier: 'ENERGY',
    thesis: `The Risk & Spreads Analyzer is the most sophisticated composite tool in the energy intelligence suite, integrating multiple data streams into a unified risk assessment framework. It combines price-based signals (crack spreads, WTI-Brent differential, futures curve shape) with physical-market indicators (inventory levels, pipeline utilization, chokepoint risk) to generate a holistic view of energy market risk.

Traditional energy risk analysis treats price risk and physical risk as separate domains — this tool bridges that gap by showing how physical market disruptions translate into spread dislocations and vice versa. For example, a Hormuz Strait disruption would simultaneously appear as elevated chokepoint risk, widening Brent-Dubai spreads, and steepening futures curve backwardation.

The analyzer is designed for risk managers, trading desk heads, and strategic planning teams who need to understand the interconnected nature of energy market risks rather than monitoring individual indicators in isolation.`,
    metrics: [
      'Composite energy risk score',
      'Spread deviation from historical norms',
      'Geopolitical risk heat indicators',
      'Supply disruption probability estimates',
      'Cross-factor correlation matrix',
    ],
    instructions: [
      'The composite risk score aggregates multiple indicators — higher scores indicate elevated market stress.',
      'Spread deviations beyond 2 standard deviations from historical norms warrant immediate attention.',
      'Cross-reference risk flags with the Chokepoints widget for geopolitical context.',
      'Use the correlation view to understand which factors are driving overall risk levels.',
    ],
    tutorial: [
      { label: 'Risk Score', description: 'Composite energy risk index — higher = more market stress', x: 50, y: 15 },
      { label: 'Spread Panel', description: 'Key spread deviations from historical norms', x: 30, y: 45 },
      { label: 'Geo-Risk Flags', description: 'Geopolitical risk heat indicators by region', x: 70, y: 45 },
      { label: 'Correlation View', description: 'Cross-factor relationships showing what drives risk', x: 50, y: 80 },
    ],
  },
};
