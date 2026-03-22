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
    key: 'flow',
    label: 'ORDER FLOW & JOURNAL',
    content: () => (
      <div className="space-y-12">
        <section>
          <SectionDivider label="TIME & SALES (TAPE READER)" />
          <WidgetDocWrapper widgetId="tape"><GATimeSales /></WidgetDocWrapper>
        </section>
        <section>
          <SectionDivider label="TRADE JOURNAL" />
          <WidgetDocWrapper widgetId="journal"><GATradeJournal /></WidgetDocWrapper>
        </section>
      </div>
    ),
  },
  {
    key: 'tools',
    label: 'CALCULATORS & SESSIONS',
    content: () => (
      <div className="space-y-12">
        <section>
          <SectionDivider label="TRADING SESSIONS" />
          <WidgetDocWrapper widgetId="sessions"><GATradingSessions /></WidgetDocWrapper>
        </section>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <section>
            <SectionDivider label="MARGIN CALCULATOR" />
            <WidgetDocWrapper widgetId="margin-calc"><GAMarginCalc /></WidgetDocWrapper>
          </section>
          <section>
            <SectionDivider label="PIP CALCULATOR" />
            <WidgetDocWrapper widgetId="pip-calc"><GAPipCalculator /></WidgetDocWrapper>
          </section>
        </div>
        <section>
          <SectionDivider label="PERFORMANCE DASHBOARD" />
          <WidgetDocWrapper widgetId="performance"><GAPerformanceDashboard /></WidgetDocWrapper>
        </section>
      </div>
    ),
  },
];

const TradingContent = () => (
  <SubTabLayout banner="TRADING TOOLS" bannerSub="ORDER FLOW · JOURNALING · PROFESSIONAL ANALYTICS" tabs={tabs} />
);

export default TradingContent;
