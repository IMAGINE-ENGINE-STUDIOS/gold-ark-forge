import { SectionDivider, SubTab, SubTabLayout } from './SubTabLayout';
import WidgetDocWrapper from '@/components/ga-widgets/WidgetDocWrapper';

import GATimeSales from '@/components/ga-widgets/GATimeSales';
import GATradeJournal from '@/components/ga-widgets/GATradeJournal';
import GATradingSessions from '@/components/ga-widgets/GATradingSessions';
import GAMarginCalc from '@/components/ga-widgets/GAMarginCalc';
import GAPipCalculator from '@/components/ga-widgets/GAPipCalculator';
import GAPerformanceDashboard from '@/components/ga-widgets/GAPerformanceDashboard';

const tabs: SubTab[] = [
  {
    key: 'tape',
    label: 'TIME & SALES',
    content: () => (
      <section>
        <SectionDivider label="TIME & SALES (TAPE READER)" />
        <WidgetDocWrapper widgetId="tape"><GATimeSales /></WidgetDocWrapper>
      </section>
    ),
  },
  {
    key: 'journal',
    label: 'TRADE JOURNAL',
    content: () => (
      <section>
        <SectionDivider label="TRADE JOURNAL" />
        <WidgetDocWrapper widgetId="journal"><GATradeJournal /></WidgetDocWrapper>
      </section>
    ),
  },
  {
    key: 'sessions',
    label: 'SESSIONS',
    content: () => (
      <section>
        <SectionDivider label="TRADING SESSIONS" />
        <WidgetDocWrapper widgetId="sessions"><GATradingSessions /></WidgetDocWrapper>
      </section>
    ),
  },
  {
    key: 'margin',
    label: 'MARGIN CALC',
    content: () => (
      <section>
        <SectionDivider label="MARGIN CALCULATOR" />
        <WidgetDocWrapper widgetId="margin-calc"><GAMarginCalc /></WidgetDocWrapper>
      </section>
    ),
  },
  {
    key: 'pip',
    label: 'PIP CALC',
    content: () => (
      <section>
        <SectionDivider label="PIP CALCULATOR" />
        <WidgetDocWrapper widgetId="pip-calc"><GAPipCalculator /></WidgetDocWrapper>
      </section>
    ),
  },
  {
    key: 'performance',
    label: 'PERFORMANCE',
    content: () => (
      <section>
        <SectionDivider label="PERFORMANCE DASHBOARD" />
        <WidgetDocWrapper widgetId="performance"><GAPerformanceDashboard /></WidgetDocWrapper>
      </section>
    ),
  },
];

const TradingContent = () => (
  <SubTabLayout banner="TRADING TOOLS" bannerSub="ORDER FLOW · JOURNALING · PROFESSIONAL ANALYTICS" tabs={tabs} />
);

export default TradingContent;
