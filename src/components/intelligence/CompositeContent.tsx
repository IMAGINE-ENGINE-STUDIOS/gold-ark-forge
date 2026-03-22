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
    label: 'PULSE & CORRELATION',
    content: () => (
      <div className="space-y-12">
        <section>
          <SectionDivider label="MARKET PULSE COMMAND CENTER" />
          <WidgetDocWrapper widgetId="pulse"><GAMarketPulse /></WidgetDocWrapper>
        </section>
        <section>
          <SectionDivider label="CROSS-ASSET CORRELATION" />
          <WidgetDocWrapper widgetId="correlation"><GACrossAssetDashboard /></WidgetDocWrapper>
        </section>
      </div>
    ),
  },
  {
    key: 'commodity-fx',
    label: 'COMMODITY & FOREX',
    content: () => (
      <div className="space-y-12">
        <section>
          <SectionDivider label="BLOCKCHAIN ANALYTICS HUB" />
          <WidgetDocWrapper widgetId="chain-hub"><GABlockchainHub /></WidgetDocWrapper>
        </section>
        <section>
          <SectionDivider label="COMMODITY RADAR" />
          <WidgetDocWrapper widgetId="commodity-radar"><GACommodityRadar /></WidgetDocWrapper>
        </section>
        <section>
          <SectionDivider label="FOREX WAR ROOM" />
          <WidgetDocWrapper widgetId="forex-room"><GAForexWarRoom /></WidgetDocWrapper>
        </section>
      </div>
    ),
  },
  {
    key: 'risk-alloc',
    label: 'VOLATILITY & YIELD',
    content: () => (
      <div className="space-y-12">
        <section>
          <SectionDivider label="VOLATILITY MATRIX" />
          <WidgetDocWrapper widgetId="volatility"><GAVolatilityMatrix /></WidgetDocWrapper>
        </section>
        <section>
          <SectionDivider label="PORTFOLIO ALLOCATOR" />
          <WidgetDocWrapper widgetId="portfolios"><GAPortfolioAllocator /></WidgetDocWrapper>
        </section>
        <section>
          <SectionDivider label="DeFi YIELD MONITOR" />
          <WidgetDocWrapper widgetId="yields"><GAYieldMonitor /></WidgetDocWrapper>
        </section>
      </div>
    ),
  },
];

const CompositeContent = () => (
  <SubTabLayout banner="COMPOSITE TOOLS" bannerSub="MULTI-SOURCE · CROSS-ASSET ANALYSIS" tabs={tabs} />
);

export default CompositeContent;
