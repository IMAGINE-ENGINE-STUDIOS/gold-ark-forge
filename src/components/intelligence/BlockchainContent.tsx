import { SectionDivider, SubTab, SubTabLayout } from './SubTabLayout';
import WidgetDocWrapper from '@/components/ga-widgets/WidgetDocWrapper';

import GABitcoinNetwork from '@/components/ga-widgets/GABitcoinNetwork';
import GAEthereumNetwork from '@/components/ga-widgets/GAEthereumNetwork';
import GAXRPLedger from '@/components/ga-widgets/GAXRPLedger';
import GATronNetwork from '@/components/ga-widgets/GATronNetwork';
import GASECFilings from '@/components/ga-widgets/GASECFilings';
import GAWhaleWatch from '@/components/ga-widgets/GAWhaleWatch';

const tabs: SubTab[] = [
  {
    key: 'networks',
    label: 'NETWORKS',
    content: () => (
      <div className="space-y-12">
        <section>
          <SectionDivider label="BITCOIN NETWORK" />
          <WidgetDocWrapper widgetId="bitcoin"><GABitcoinNetwork /></WidgetDocWrapper>
        </section>
        <section>
          <SectionDivider label="ETHEREUM NETWORK" />
          <WidgetDocWrapper widgetId="ethereum"><GAEthereumNetwork /></WidgetDocWrapper>
        </section>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <section>
            <SectionDivider label="XRP LEDGER" />
            <WidgetDocWrapper widgetId="xrp"><GAXRPLedger /></WidgetDocWrapper>
          </section>
          <section>
            <SectionDivider label="TRON NETWORK" />
            <WidgetDocWrapper widgetId="tron"><GATronNetwork /></WidgetDocWrapper>
          </section>
        </div>
      </div>
    ),
  },
  {
    key: 'intelligence',
    label: 'WHALES & SEC',
    content: () => (
      <div className="space-y-12">
        <section>
          <SectionDivider label="SEC EDGAR FILINGS" />
          <WidgetDocWrapper widgetId="sec"><GASECFilings /></WidgetDocWrapper>
        </section>
        <section>
          <SectionDivider label="WHALE WATCH" />
          <WidgetDocWrapper widgetId="whales"><GAWhaleWatch /></WidgetDocWrapper>
        </section>
      </div>
    ),
  },
];

const BlockchainContent = () => (
  <SubTabLayout banner="BLOCKCHAIN LIVE" bannerSub="DIRECT FROM NETWORKS · ZERO INTERMEDIARIES" tabs={tabs} />
);

export default BlockchainContent;
