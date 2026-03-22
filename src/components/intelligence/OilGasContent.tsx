import { SectionDivider, SubTab, SubTabLayout } from './SubTabLayout';

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
    label: 'PRICES & DASHBOARD',
    content: () => (
      <div className="space-y-12">
        <OGMultiTicker />
        <section>
          <SectionDivider label="ENERGY DASHBOARD" />
          <OGPriceCards />
          <div className="mt-6"><OGEnergyDashboard /></div>
        </section>
        <section>
          <SectionDivider label="FUTURES CURVE" />
          <OGFuturesCurve />
        </section>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <section>
            <SectionDivider label="INVENTORY GAUGE" />
            <OGInventoryGauge />
          </section>
          <section>
            <SectionDivider label="WTI-BRENT SPREAD" />
            <OGWtiBrentSpread />
          </section>
        </div>
      </div>
    ),
  },
  {
    key: 'fundamentals',
    label: 'SUPPLY & OPEC',
    content: () => (
      <div className="space-y-12">
        <section>
          <SectionDivider label="OPEC TRACKER" />
          <OGOPECTracker />
        </section>
        <section>
          <SectionDivider label="SUPPLY & DEMAND" />
          <OGSupplyDemand />
        </section>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <section>
            <SectionDivider label="RIG COUNT" />
            <OGRigCount />
          </section>
          <section>
            <SectionDivider label="CRACK SPREADS" />
            <OGCrackSpreads />
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
          <SectionDivider label="PRODUCTION MAP" />
          <OGProductionMap />
        </section>
        <section>
          <SectionDivider label="PIPELINE FLOW" />
          <OGPipelineFlow />
        </section>
        <section>
          <SectionDivider label="CHOKEPOINTS" />
          <OGChokepoints />
        </section>
        <section>
          <SectionDivider label="RISK ANALYZER" />
          <OGRiskAnalyzer />
        </section>
        <section>
          <SectionDivider label="ENERGY NEWS" />
          <OGNewsFeed />
        </section>
      </div>
    ),
  },
];

const OilGasContent = () => (
  <SubTabLayout banner="OIL & GAS INTELLIGENCE" bannerSub="ENERGY SECTOR · INSTITUTIONAL ANALYTICS" tabs={tabs} />
);

export default OilGasContent;
