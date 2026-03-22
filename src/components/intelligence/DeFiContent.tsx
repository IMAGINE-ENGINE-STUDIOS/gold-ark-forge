import { SectionDivider, SubTab, SubTabLayout } from './SubTabLayout';
import WidgetDocWrapper from '@/components/ga-widgets/WidgetDocWrapper';

import GACryptoMarket from '@/components/ga-widgets/GACryptoMarket';
import GACryptoHeatmap from '@/components/ga-widgets/GACryptoHeatmap';
import GADeFiDashboard from '@/components/ga-widgets/GADeFiDashboard';

const tabs: SubTab[] = [
  {
    key: 'market',
    label: 'CRYPTO MARKET',
    content: () => (
      <section>
        <SectionDivider label="CRYPTO MARKET OVERVIEW" />
        <WidgetDocWrapper widgetId="crypto-market"><GACryptoMarket /></WidgetDocWrapper>
      </section>
    ),
  },
  {
    key: 'heatmap',
    label: 'CRYPTO HEATMAP',
    content: () => (
      <section>
        <SectionDivider label="CRYPTO HEATMAP" />
        <WidgetDocWrapper widgetId="crypto-heatmap"><GACryptoHeatmap /></WidgetDocWrapper>
      </section>
    ),
  },
  {
    key: 'defi',
    label: 'DeFi TVL',
    content: () => (
      <section>
        <SectionDivider label="DeFi TOTAL VALUE LOCKED" />
        <WidgetDocWrapper widgetId="defi"><GADeFiDashboard /></WidgetDocWrapper>
      </section>
    ),
  },
];

const DeFiContent = () => (
  <SubTabLayout banner="DeFi & SENTIMENT" bannerSub="FREE PUBLIC APIs · AUTO-REFRESH" tabs={tabs} />
);

export default DeFiContent;
