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
    key: 'bitcoin',
    label: 'BITCOIN',
    content: () => (
      <section>
        <SectionDivider label="BITCOIN NETWORK" />
        <WidgetDocWrapper widgetId="bitcoin"><GABitcoinNetwork /></WidgetDocWrapper>
      </section>
    ),
  },
  {
    key: 'ethereum',
    label: 'ETHEREUM',
    content: () => (
      <section>
        <SectionDivider label="ETHEREUM NETWORK" />
        <WidgetDocWrapper widgetId="ethereum"><GAEthereumNetwork /></WidgetDocWrapper>
      </section>
    ),
  },
  {
    key: 'xrp',
    label: 'XRP LEDGER',
    content: () => (
      <section>
        <SectionDivider label="XRP LEDGER" />
        <WidgetDocWrapper widgetId="xrp"><GAXRPLedger /></WidgetDocWrapper>
      </section>
    ),
  },
  {
    key: 'tron',
    label: 'TRON',
    content: () => (
      <section>
        <SectionDivider label="TRON NETWORK" />
        <WidgetDocWrapper widgetId="tron"><GATronNetwork /></WidgetDocWrapper>
      </section>
    ),
  },
  {
    key: 'sec',
    label: 'SEC FILINGS',
    content: () => (
      <section>
        <SectionDivider label="SEC EDGAR FILINGS" />
        <WidgetDocWrapper widgetId="sec"><GASECFilings /></WidgetDocWrapper>
      </section>
    ),
  },
  {
    key: 'whales',
    label: 'WHALE WATCH',
    content: () => (
      <section>
        <SectionDivider label="WHALE WATCH" />
        <WidgetDocWrapper widgetId="whales"><GAWhaleWatch /></WidgetDocWrapper>
      </section>
    ),
  },
];

const BlockchainContent = () => (
  <SubTabLayout banner="BLOCKCHAIN LIVE" bannerSub="DIRECT FROM NETWORKS · ZERO INTERMEDIARIES" tabs={tabs} />
);

export default BlockchainContent;
