import { SectionDivider, SubTab, SubTabLayout } from './SubTabLayout';
import WidgetDocWrapper from '@/components/ga-widgets/WidgetDocWrapper';

import GAMarketPulse from '@/components/ga-widgets/GAMarketPulse';
import GACrossAssetDashboard from '@/components/ga-widgets/GACrossAssetDashboard';
import GABlockchainHub from '@/components/ga-widgets/GABlockchainHub';
import GACommodityRadar from '@/components/ga-widgets/GACommodityRadar';
import GAForexWarRoom from '@/components/ga-widgets/GAForexWarRoom';
import GAVolatilityMatrix from '@/components/ga-widgets/GAVolatilityMatrix';
import GAPortfolioAllocator from '@/components/ga-widgets/GAPortfolioAllocator';
import GAYieldMonitor from '@/components/ga-widgets/GAYieldMonitor';

const tabs: SubTab[] = [
  {
    key: 'pulse',
    label: 'MARKET PULSE',
    content: () => (
      <section>
        <SectionDivider label="MARKET PULSE COMMAND CENTER" />
        <WidgetDocWrapper widgetId="pulse"><GAMarketPulse /></WidgetDocWrapper>
      </section>
    ),
  },
  {
    key: 'correlation',
    label: 'CORRELATION',
    content: () => (
      <section>
        <SectionDivider label="CROSS-ASSET CORRELATION" />
        <WidgetDocWrapper widgetId="correlation"><GACrossAssetDashboard /></WidgetDocWrapper>
      </section>
    ),
  },
  {
    key: 'chain-hub',
    label: 'BLOCKCHAIN HUB',
    content: () => (
      <section>
        <SectionDivider label="BLOCKCHAIN ANALYTICS HUB" />
        <WidgetDocWrapper widgetId="chain-hub"><GABlockchainHub /></WidgetDocWrapper>
      </section>
    ),
  },
  {
    key: 'commodity',
    label: 'COMMODITY RADAR',
    content: () => (
      <section>
        <SectionDivider label="COMMODITY RADAR" />
        <WidgetDocWrapper widgetId="commodity-radar"><GACommodityRadar /></WidgetDocWrapper>
      </section>
    ),
  },
  {
    key: 'forex-room',
    label: 'FOREX WAR ROOM',
    content: () => (
      <section>
        <SectionDivider label="FOREX WAR ROOM" />
        <WidgetDocWrapper widgetId="forex-room"><GAForexWarRoom /></WidgetDocWrapper>
      </section>
    ),
  },
  {
    key: 'volatility',
    label: 'VOLATILITY',
    content: () => (
      <section>
        <SectionDivider label="VOLATILITY MATRIX" />
        <WidgetDocWrapper widgetId="volatility"><GAVolatilityMatrix /></WidgetDocWrapper>
      </section>
    ),
  },
  {
    key: 'portfolio',
    label: 'PORTFOLIO',
    content: () => (
      <section>
        <SectionDivider label="PORTFOLIO ALLOCATOR" />
        <WidgetDocWrapper widgetId="portfolios"><GAPortfolioAllocator /></WidgetDocWrapper>
      </section>
    ),
  },
  {
    key: 'yields',
    label: 'YIELD MONITOR',
    content: () => (
      <section>
        <SectionDivider label="DeFi YIELD MONITOR" />
        <WidgetDocWrapper widgetId="yields"><GAYieldMonitor /></WidgetDocWrapper>
      </section>
    ),
  },
];

const CompositeContent = () => (
  <SubTabLayout banner="COMPOSITE TOOLS" bannerSub="MULTI-SOURCE · CROSS-ASSET ANALYSIS" tabs={tabs} />
);

export default CompositeContent;
