import { SectionDivider, SubTab, SubTabLayout } from './SubTabLayout';
import WidgetDocWrapper from '@/components/ga-widgets/WidgetDocWrapper';

import GAGoldRatio from '@/components/ga-widgets/GAGoldRatio';
import GAReserveGauge from '@/components/ga-widgets/GAReserveGauge';
import GAReserveTimeline from '@/components/ga-widgets/GAReserveTimeline';
import GAMetalProfile from '@/components/ga-widgets/GAMetalProfile';
import GAVaultMatrix from '@/components/ga-widgets/GAVaultMatrix';
import GABullionHeatmap from '@/components/ga-widgets/GABullionHeatmap';
import GAMetalScreener from '@/components/ga-widgets/GAMetalScreener';
import GACertificateFlow from '@/components/ga-widgets/GACertificateFlow';
import GAAnchorStatus from '@/components/ga-widgets/GAAnchorStatus';
import GAActivityFeed from '@/components/ga-widgets/GAActivityFeed';
import GAPartnerNetwork from '@/components/ga-widgets/GAPartnerNetwork';

const tabs: SubTab[] = [
  {
    key: 'ratios',
    label: 'METAL RATIOS',
    content: () => (
      <section>
        <SectionDivider label="METAL RATIOS" />
        <WidgetDocWrapper widgetId="ratios"><GAGoldRatio /></WidgetDocWrapper>
      </section>
    ),
  },
  {
    key: 'profiles',
    label: 'METAL PROFILES',
    content: () => (
      <section>
        <SectionDivider label="METAL PROFILES" />
        <WidgetDocWrapper widgetId="profiles"><GAMetalProfile /></WidgetDocWrapper>
      </section>
    ),
  },
  {
    key: 'screener',
    label: 'SCREENER',
    content: () => (
      <section>
        <SectionDivider label="BULLION SCREENER" />
        <WidgetDocWrapper widgetId="screener"><GAMetalScreener /></WidgetDocWrapper>
      </section>
    ),
  },
  {
    key: 'reserves',
    label: 'RESERVES',
    content: () => (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section>
          <SectionDivider label="RESERVE BACKING" />
          <WidgetDocWrapper widgetId="reserves"><GAReserveGauge /></WidgetDocWrapper>
        </section>
        <section>
          <SectionDivider label="RESERVE HISTORY" />
          <WidgetDocWrapper widgetId="timeline"><GAReserveTimeline /></WidgetDocWrapper>
        </section>
      </div>
    ),
  },
  {
    key: 'vault',
    label: 'VAULT INVENTORY',
    content: () => (
      <section>
        <SectionDivider label="VAULT INVENTORY" />
        <WidgetDocWrapper widgetId="vault"><GAVaultMatrix /></WidgetDocWrapper>
      </section>
    ),
  },
  {
    key: 'bullion-heatmap',
    label: 'BULLION HEATMAP',
    content: () => (
      <section>
        <SectionDivider label="BULLION HEATMAP" />
        <WidgetDocWrapper widgetId="bullion-heatmap"><GABullionHeatmap /></WidgetDocWrapper>
      </section>
    ),
  },
  {
    key: 'certificates',
    label: 'CERTIFICATES',
    content: () => (
      <section>
        <SectionDivider label="CERTIFICATE REGISTRY" />
        <WidgetDocWrapper widgetId="certs"><GACertificateFlow /></WidgetDocWrapper>
      </section>
    ),
  },
  {
    key: 'anchors',
    label: 'BTC ANCHORS',
    content: () => (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section>
          <SectionDivider label="BITCOIN ANCHORS" />
          <WidgetDocWrapper widgetId="anchors"><GAAnchorStatus /></WidgetDocWrapper>
        </section>
        <section>
          <SectionDivider label="ANCHORED ACTIVITY" />
          <WidgetDocWrapper widgetId="activity"><GAActivityFeed /></WidgetDocWrapper>
        </section>
      </div>
    ),
  },
  {
    key: 'partners',
    label: 'PARTNER NETWORK',
    content: () => (
      <section>
        <SectionDivider label="PARTNER NETWORK" />
        <WidgetDocWrapper widgetId="partners"><GAPartnerNetwork /></WidgetDocWrapper>
      </section>
    ),
  },
];

const ProprietaryContent = () => (
  <SubTabLayout banner="PROPRIETARY DATA" bannerSub="GOLD ARROW INTERNAL · LOVABLE CLOUD" tabs={tabs} />
);

export default ProprietaryContent;
