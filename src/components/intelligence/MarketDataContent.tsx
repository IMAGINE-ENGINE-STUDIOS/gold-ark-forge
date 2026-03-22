import { SectionDivider, SubTab, SubTabLayout } from './SubTabLayout';
import WidgetDocWrapper from '@/components/ga-widgets/WidgetDocWrapper';

import GAPriceCards from '@/components/ga-widgets/GAPriceCards';
import GACryptoPriceCards from '@/components/ga-widgets/GACryptoPriceCards';
import GAAllAssetPriceCards from '@/components/ga-widgets/GAAllAssetPriceCards';
import GALiveTicker from '@/components/ga-widgets/GALiveTicker';
import GAMiniCharts from '@/components/ga-widgets/GAMiniCharts';
import GAAssetOverview from '@/components/ga-widgets/GAAssetOverview';
import GAMetalChart from '@/components/ga-widgets/GAMetalChart';
import GALiveStandalone from '@/components/ga-widgets/GALiveStandalone';
import GATechnicalGauge from '@/components/ga-widgets/GATechnicalGauge';
import GAMarketSummary from '@/components/ga-widgets/GAMarketSummary';
import GAMarketQuotes from '@/components/ga-widgets/GAMarketQuotes';
import GATopMovers from '@/components/ga-widgets/GATopMovers';
import GANewsFeed from '@/components/ga-widgets/GANewsFeed';
import GAForexMatrix from '@/components/ga-widgets/GAForexMatrix';
import GAMarketHeatmap from '@/components/ga-widgets/GAMarketHeatmap';
import GAEconomicCalendar from '@/components/ga-widgets/GAEconomicCalendar';

const tabs: SubTab[] = [
  {
    key: 'ticker',
    label: 'LIVE TICKER',
    content: () => (
      <section>
        <SectionDivider label="LIVE TICKER TAPE" />
        <GALiveTicker />
      </section>
    ),
  },
  {
    key: 'spot-prices',
    label: 'SPOT PRICES',
    content: () => (
      <div className="space-y-12">
        <section>
          <SectionDivider label="METAL SPOT PRICES" />
          <WidgetDocWrapper widgetId="prices"><GAPriceCards /></WidgetDocWrapper>
        </section>
        <section>
          <SectionDivider label="CRYPTO SPOT PRICES" />
          <WidgetDocWrapper widgetId="prices"><GACryptoPriceCards /></WidgetDocWrapper>
        </section>
      </div>
    ),
  },
  {
    key: 'all-assets',
    label: 'ALL ASSETS',
    content: () => (
      <section>
        <SectionDivider label="ALL SWAP ASSETS — REAL-TIME" />
        <WidgetDocWrapper widgetId="prices"><GAAllAssetPriceCards /></WidgetDocWrapper>
      </section>
    ),
  },
  {
    key: 'charts',
    label: 'CHARTS',
    content: () => (
      <div className="space-y-12">
        <section>
          <SectionDivider label="COMPACT CHARTS" />
          <WidgetDocWrapper widgetId="mini-charts"><GAMiniCharts /></WidgetDocWrapper>
        </section>
        <section>
          <SectionDivider label="GOLD ARROW LIVE" />
          <WidgetDocWrapper widgetId="chart"><GALiveStandalone /></WidgetDocWrapper>
        </section>
        <section>
          <SectionDivider label="METALS CHART" />
          <WidgetDocWrapper widgetId="chart"><GAMetalChart /></WidgetDocWrapper>
        </section>
      </div>
    ),
  },
  {
    key: 'overview',
    label: 'OVERVIEW',
    content: () => (
      <section>
        <SectionDivider label="MULTI-ASSET OVERVIEW" />
        <WidgetDocWrapper widgetId="overview"><GAAssetOverview /></WidgetDocWrapper>
      </section>
    ),
  },
  {
    key: 'technical',
    label: 'TECHNICAL',
    content: () => (
      <section>
        <SectionDivider label="TECHNICAL ANALYSIS" />
        <WidgetDocWrapper widgetId="analysis"><GATechnicalGauge /></WidgetDocWrapper>
      </section>
    ),
  },
  {
    key: 'summary',
    label: 'MARKET SUMMARY',
    content: () => (
      <section>
        <SectionDivider label="GLOBAL MARKET OVERVIEW" />
        <WidgetDocWrapper widgetId="market-summary"><GAMarketSummary /></WidgetDocWrapper>
      </section>
    ),
  },
  {
    key: 'quotes',
    label: 'QUOTES',
    content: () => (
      <section>
        <SectionDivider label="MARKET QUOTES" />
        <WidgetDocWrapper widgetId="quotes"><GAMarketQuotes /></WidgetDocWrapper>
      </section>
    ),
  },
  {
    key: 'movers',
    label: 'TOP MOVERS',
    content: () => (
      <section>
        <SectionDivider label="TOP MOVERS" />
        <WidgetDocWrapper widgetId="movers"><GATopMovers /></WidgetDocWrapper>
      </section>
    ),
  },
  {
    key: 'news',
    label: 'NEWS',
    content: () => (
      <section>
        <SectionDivider label="MARKET INTELLIGENCE FEED" />
        <WidgetDocWrapper widgetId="news"><GANewsFeed /></WidgetDocWrapper>
      </section>
    ),
  },
  {
    key: 'forex',
    label: 'FOREX',
    content: () => (
      <section>
        <SectionDivider label="FOREX INTELLIGENCE" />
        <WidgetDocWrapper widgetId="forex"><GAForexMatrix /></WidgetDocWrapper>
      </section>
    ),
  },
  {
    key: 'heatmap',
    label: 'HEATMAP',
    content: () => (
      <section>
        <SectionDivider label="MULTI-MARKET HEATMAP" />
        <WidgetDocWrapper widgetId="heatmap"><GAMarketHeatmap /></WidgetDocWrapper>
      </section>
    ),
  },
  {
    key: 'calendar',
    label: 'ECONOMIC CALENDAR',
    content: () => (
      <section>
        <SectionDivider label="ECONOMIC CALENDAR" />
        <WidgetDocWrapper widgetId="calendar"><GAEconomicCalendar /></WidgetDocWrapper>
      </section>
    ),
  },
];

const MarketDataContent = () => (
  <SubTabLayout banner="MARKET DATA" bannerSub="LIVE AUTO-REFRESH · FREE PUBLIC APIs · ZERO INTERMEDIARIES" tabs={tabs} />
);

export default MarketDataContent;
