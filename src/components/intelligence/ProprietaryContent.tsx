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
    key: 'metals',
    label: 'METALS & RATIOS',
    content: () => (
      <div className="space-y-12">
        <section>
          <SectionDivider label="METAL RATIOS" />
          <WidgetDocWrapper widgetId="ratios"><GAGoldRatio /></WidgetDocWrapper>
        </section>
        <section>
          <SectionDivider label="METAL PROFILES" />
          <WidgetDocWrapper widgetId="profiles"><GAMetalProfile /></WidgetDocWrapper>
        </section>
        <section>
          <SectionDivider label="BULLION SCREENER" />
          <WidgetDocWrapper widgetId="screener"><GAMetalScreener /></WidgetDocWrapper>
        </section>
      </div>
    ),
  },
  {
    key: 'reserves',
    label: 'RESERVES & VAULT',
    content: () => (
      <div className="space-y-12">
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <section>
            <SectionDivider label="VAULT INVENTORY" />
            <WidgetDocWrapper widgetId="vault"><GAVaultMatrix /></WidgetDocWrapper>
          </section>
          <section>
            <SectionDivider label="BULLION HEATMAP" />
            <WidgetDocWrapper widgetId="bullion-heatmap"><GABullionHeatmap /></WidgetDocWrapper>
          </section>
        </div>
      </div>
    ),
  },
  {
    key: 'certs',
    label: 'CERTIFICATES & ANCHORS',
    content: () => (
      <div className="space-y-12">
        <section>
          <SectionDivider label="CERTIFICATE REGISTRY" />
          <WidgetDocWrapper widgetId="certs"><GACertificateFlow /></WidgetDocWrapper>
        </section>
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
        <section>
          <SectionDivider label="PARTNER NETWORK" />
          <WidgetDocWrapper widgetId="partners"><GAPartnerNetwork /></WidgetDocWrapper>
        </section>
      </div>
    ),
  },
];

const ProprietaryContent = () => (
  <SubTabLayout banner="PROPRIETARY DATA" bannerSub="GOLD ARROW INTERNAL · LOVABLE CLOUD" tabs={tabs} />
);

export default ProprietaryContent;
