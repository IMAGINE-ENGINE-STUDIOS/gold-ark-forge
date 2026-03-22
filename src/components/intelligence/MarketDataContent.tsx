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
    key: 'prices',
    label: 'PRICES & TICKER',
    content: () => (
      <div className="space-y-12">
        <section>
          <SectionDivider label="LIVE TICKER TAPE" />
          <GALiveTicker />
        </section>
        <section>
          <SectionDivider label="SPOT PRICES" />
          <WidgetDocWrapper widgetId="prices">
            <GAPriceCards />
            <div className="mt-6"><GACryptoPriceCards /></div>
            <div className="mt-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-6 bg-gold rounded-full" />
                <span className="font-display text-sm tracking-[0.15em] text-gold-light">ALL SWAP ASSETS — REAL-TIME</span>
                <span className="text-[10px] text-marble/25 font-mono">200+ instruments</span>
              </div>
              <GAAllAssetPriceCards />
            </div>
          </WidgetDocWrapper>
        </section>
      </div>
    ),
  },
  {
    key: 'charts',
    label: 'CHARTS & OVERVIEW',
    content: () => (
      <div className="space-y-12">
        <section>
          <SectionDivider label="COMPACT CHARTS" />
          <WidgetDocWrapper widgetId="mini-charts"><GAMiniCharts /></WidgetDocWrapper>
        </section>
        <section>
          <SectionDivider label="MULTI-ASSET OVERVIEW" />
          <WidgetDocWrapper widgetId="overview"><GAAssetOverview /></WidgetDocWrapper>
        </section>
        <section>
          <SectionDivider label="GOLD ARROW LIVE" />
          <WidgetDocWrapper widgetId="chart"><GALiveStandalone /></WidgetDocWrapper>
          <div className="mt-8">
            <SectionDivider label="METALS CHART" />
            <WidgetDocWrapper widgetId="chart"><GAMetalChart /></WidgetDocWrapper>
          </div>
        </section>
      </div>
    ),
  },
  {
    key: 'analysis',
    label: 'ANALYSIS & QUOTES',
    content: () => (
      <div className="space-y-12">
        <section>
          <SectionDivider label="TECHNICAL ANALYSIS" />
          <WidgetDocWrapper widgetId="analysis"><GATechnicalGauge /></WidgetDocWrapper>
        </section>
        <section>
          <SectionDivider label="GLOBAL MARKET OVERVIEW" />
          <WidgetDocWrapper widgetId="market-summary"><GAMarketSummary /></WidgetDocWrapper>
        </section>
        <section>
          <SectionDivider label="MARKET QUOTES" />
          <WidgetDocWrapper widgetId="quotes"><GAMarketQuotes /></WidgetDocWrapper>
        </section>
        <section>
          <SectionDivider label="TOP MOVERS" />
          <WidgetDocWrapper widgetId="movers"><GATopMovers /></WidgetDocWrapper>
        </section>
      </div>
    ),
  },
  {
    key: 'news-fx',
    label: 'NEWS & FOREX',
    content: () => (
      <div className="space-y-12">
        <section>
          <SectionDivider label="MARKET INTELLIGENCE FEED" />
          <WidgetDocWrapper widgetId="news"><GANewsFeed /></WidgetDocWrapper>
        </section>
        <section>
          <SectionDivider label="FOREX INTELLIGENCE" />
          <WidgetDocWrapper widgetId="forex"><GAForexMatrix /></WidgetDocWrapper>
        </section>
        <section>
          <SectionDivider label="MULTI-MARKET HEATMAP" />
          <WidgetDocWrapper widgetId="heatmap"><GAMarketHeatmap /></WidgetDocWrapper>
        </section>
        <section>
          <SectionDivider label="ECONOMIC CALENDAR" />
          <WidgetDocWrapper widgetId="calendar"><GAEconomicCalendar /></WidgetDocWrapper>
        </section>
      </div>
    ),
  },
];

const MarketDataContent = () => (
  <SubTabLayout banner="MARKET DATA" bannerSub="LIVE AUTO-REFRESH · FREE PUBLIC APIs · ZERO INTERMEDIARIES" tabs={tabs} />
);

export default MarketDataContent;
