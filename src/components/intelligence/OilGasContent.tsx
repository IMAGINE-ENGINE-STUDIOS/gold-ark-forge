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
    label: 'PRICES',
    content: () => (
      <div className="space-y-12">
        <OGMultiTicker />
        <section>
          <SectionDivider label="SPOT & FUTURES PRICES" />
          <WidgetDocWrapper widgetId="og-prices"><OGPriceCards /></WidgetDocWrapper>
        </section>
      </div>
    ),
  },
  {
    key: 'futures',
    label: 'FUTURES',
    content: () => (
      <section>
        <SectionDivider label="FUTURES CURVE" />
        <WidgetDocWrapper widgetId="og-futures"><OGFuturesCurve /></WidgetDocWrapper>
      </section>
    ),
  },
  {
    key: 'wti-brent',
    label: 'WTI-BRENT',
    content: () => (
      <section>
        <SectionDivider label="WTI-BRENT SPREAD TRACKER" />
        <WidgetDocWrapper widgetId="og-wti-brent"><OGWtiBrentSpread /></WidgetDocWrapper>
      </section>
    ),
  },
  {
    key: 'spreads',
    label: 'SPREADS',
    content: () => (
      <section>
        <SectionDivider label="SPREADS & MARGINS" />
        <WidgetDocWrapper widgetId="og-spreads"><OGCrackSpreads /></WidgetDocWrapper>
      </section>
    ),
  },
  {
    key: 'inventory',
    label: 'INVENTORY',
    content: () => (
      <section>
        <SectionDivider label="EIA CRUDE OIL INVENTORY" />
        <WidgetDocWrapper widgetId="og-inventory"><OGInventoryGauge /></WidgetDocWrapper>
      </section>
    ),
  },
  {
    key: 'rigs',
    label: 'RIG COUNT',
    content: () => (
      <section>
        <SectionDivider label="BAKER HUGHES RIG COUNT" />
        <WidgetDocWrapper widgetId="og-rigs"><OGRigCount /></WidgetDocWrapper>
      </section>
    ),
  },
  {
    key: 'supply-demand',
    label: 'S/D BALANCE',
    content: () => (
      <section>
        <SectionDivider label="GLOBAL SUPPLY / DEMAND BALANCE" />
        <WidgetDocWrapper widgetId="og-supply-demand"><OGSupplyDemand /></WidgetDocWrapper>
      </section>
    ),
  },
  {
    key: 'opec',
    label: 'OPEC+',
    content: () => (
      <section>
        <SectionDivider label="OPEC+ COMPLIANCE" />
        <WidgetDocWrapper widgetId="og-opec"><OGOPECTracker /></WidgetDocWrapper>
      </section>
    ),
  },
  {
    key: 'producers',
    label: 'PRODUCERS',
    content: () => (
      <section>
        <SectionDivider label="TOP PRODUCERS" />
        <WidgetDocWrapper widgetId="og-production"><OGProductionMap /></WidgetDocWrapper>
      </section>
    ),
  },
  {
    key: 'pipelines',
    label: 'PIPELINES',
    content: () => (
      <section>
        <SectionDivider label="GLOBAL PIPELINE FLOW" />
        <WidgetDocWrapper widgetId="og-pipelines"><OGPipelineFlow /></WidgetDocWrapper>
      </section>
    ),
  },
  {
    key: 'chokepoints',
    label: 'CHOKEPOINTS',
    content: () => (
      <section>
        <SectionDivider label="GEOPOLITICAL CHOKEPOINT RISK" />
        <WidgetDocWrapper widgetId="og-chokepoints"><OGChokepoints /></WidgetDocWrapper>
      </section>
    ),
  },
  {
    key: 'news',
    label: 'NEWS',
    content: () => (
      <div className="space-y-12">
        <section>
          <SectionDivider label="ENERGY INTELLIGENCE FEED" />
          <WidgetDocWrapper widgetId="og-news"><OGNewsFeed /></WidgetDocWrapper>
        </section>
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
