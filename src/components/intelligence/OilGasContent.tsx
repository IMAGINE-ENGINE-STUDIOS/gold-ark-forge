import { SectionDivider, SubTab, SubTabLayout } from './SubTabLayout';
import WidgetDocWrapper from '@/components/ga-widgets/WidgetDocWrapper';

import OGMultiTicker from '@/components/og-widgets/OGMultiTicker';
import OGPriceCards from '@/components/og-widgets/OGPriceCards';
import OGEnergyDashboard from '@/components/og-widgets/OGEnergyDashboard';
import OGFuturesCurve from '@/components/og-widgets/OGFuturesCurve';
import OGInventoryGauge from '@/components/og-widgets/OGInventoryGauge';
import OGWtiBrentSpread from '@/components/og-widgets/OGWtiBrentSpread';
import OGOPECTracker from '@/components/og-widgets/OGOPECTracker';
import OGSupplyDemand from '@/components/og-widgets/OGSupplyDemand';
import OGRigCount from '@/components/og-widgets/OGRigCount';
import OGCrackSpreads from '@/components/og-widgets/OGCrackSpreads';
import OGProductionMap from '@/components/og-widgets/OGProductionMap';
import OGPipelineFlow from '@/components/og-widgets/OGPipelineFlow';
import OGChokepoints from '@/components/og-widgets/OGChokepoints';
import OGRiskAnalyzer from '@/components/og-widgets/OGRiskAnalyzer';
import OGNewsFeed from '@/components/og-widgets/OGNewsFeed';

const tabs: SubTab[] = [
  {
    key: 'prices',
    label: 'PRICES & FUTURES',
    content: () => (
      <div className="space-y-12">
        <OGMultiTicker />
        <section>
          <SectionDivider label="SPOT & FUTURES PRICES" />
          <WidgetDocWrapper widgetId="og-prices"><OGPriceCards /></WidgetDocWrapper>
        </section>
        <section>
          <SectionDivider label="FUTURES CURVE" />
          <WidgetDocWrapper widgetId="og-futures"><OGFuturesCurve /></WidgetDocWrapper>
        </section>
        <section>
          <SectionDivider label="WTI-BRENT SPREAD TRACKER" />
          <WidgetDocWrapper widgetId="og-wti-brent"><OGWtiBrentSpread /></WidgetDocWrapper>
        </section>
        <section>
          <SectionDivider label="SPREADS & MARGINS" />
          <WidgetDocWrapper widgetId="og-spreads"><OGCrackSpreads /></WidgetDocWrapper>
        </section>
      </div>
    ),
  },
  {
    key: 'fundamentals',
    label: 'SUPPLY & OPEC',
    content: () => (
      <div className="space-y-12">
        <section>
          <SectionDivider label="EIA CRUDE OIL INVENTORY" />
          <WidgetDocWrapper widgetId="og-inventory"><OGInventoryGauge /></WidgetDocWrapper>
        </section>
        <section>
          <SectionDivider label="BAKER HUGHES RIG COUNT" />
          <WidgetDocWrapper widgetId="og-rigs"><OGRigCount /></WidgetDocWrapper>
        </section>
        <section>
          <SectionDivider label="GLOBAL SUPPLY / DEMAND BALANCE" />
          <WidgetDocWrapper widgetId="og-supply-demand"><OGSupplyDemand /></WidgetDocWrapper>
        </section>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <section>
            <SectionDivider label="OPEC+ COMPLIANCE" />
            <WidgetDocWrapper widgetId="og-opec"><OGOPECTracker /></WidgetDocWrapper>
          </section>
          <section>
            <SectionDivider label="TOP PRODUCERS" />
            <WidgetDocWrapper widgetId="og-production"><OGProductionMap /></WidgetDocWrapper>
          </section>
        </div>
      </div>
    ),
  },
  {
    key: 'infra',
    label: 'INFRASTRUCTURE & NEWS',
    content: () => (
      <div className="space-y-12">
        <section>
          <SectionDivider label="GLOBAL PIPELINE FLOW" />
          <WidgetDocWrapper widgetId="og-pipelines"><OGPipelineFlow /></WidgetDocWrapper>
        </section>
        <section>
          <SectionDivider label="GEOPOLITICAL CHOKEPOINT RISK" />
          <WidgetDocWrapper widgetId="og-chokepoints"><OGChokepoints /></WidgetDocWrapper>
        </section>
        <section>
          <SectionDivider label="ENERGY INTELLIGENCE FEED" />
          <WidgetDocWrapper widgetId="og-news"><OGNewsFeed /></WidgetDocWrapper>
        </section>
      </div>
    ),
  },
  {
    key: 'composite',
    label: 'EXECUTIVE ANALYTICS',
    content: () => (
      <div className="space-y-12">
        <section>
          <SectionDivider label="ENERGY EXECUTIVE DASHBOARD" />
          <WidgetDocWrapper widgetId="og-energy-dashboard"><OGEnergyDashboard /></WidgetDocWrapper>
        </section>
        <section>
          <SectionDivider label="RISK & SPREADS ANALYZER" />
          <WidgetDocWrapper widgetId="og-risk-analyzer"><OGRiskAnalyzer /></WidgetDocWrapper>
        </section>
      </div>
    ),
  },
];

const OilGasContent = () => (
  <SubTabLayout banner="OIL & GAS INTELLIGENCE" bannerSub="ENERGY SECTOR · INSTITUTIONAL ANALYTICS · EIA · OPEC · CME" tabs={tabs} />
);

export default OilGasContent;
