import { describe, it, expect } from 'vitest';
import { BUILT_IN_STRATEGIES } from '@/lib/strategyLibrary';
import { TIME_MACHINE_STRATEGIES } from '@/lib/timeMachineStrategies';
import { TM_UNIVERSE, runTournament, type Bars } from '@/lib/timeMachine';
import { writeFileSync } from 'node:fs';

const RUN = process.env.RUN_TM === '1';
const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZuZWNlZ3lianVsdHJqamp3cnIiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTc4ODgxNjU4NSwiZXhwIjoyMTA0MTcyNTg1fQ.LAjusTWiLNihOj6hisAwSuAhCdBSIGyUnc3itgNU9UA';

describe.skipIf(!RUN)('TIME MACHINE tournament', () => {
  it('runs all strategies over the week, 10 sessions each', async () => {
    const r = await fetch('https://vnecegybjluntrjhjwrr.supabase.co/functions/v1/market-history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: ANON, Authorization: `Bearer ${ANON}` },
      body: JSON.stringify({ symbols: TM_UNIVERSE, interval: '5m', range: '5d', points: 480 }),
    });
    const j = await r.json();
    const bars = (j.series ?? {}) as Bars;
    expect(Object.keys(bars).length).toBeGreaterThanOrEqual(8);
    const entries = [
      ...BUILT_IN_STRATEGIES.map((e) => ({ id: e.id, name: e.name, build: e.build })),
      ...TIME_MACHINE_STRATEGIES.map((e) => ({ id: e.id, name: e.name, build: e.build })),
    ];
    const scores = await runTournament(entries, bars);
    writeFileSync(process.env.TM_OUT ?? '/tmp/tm-results.json', JSON.stringify(scores, null, 2));
    for (const s of scores) {
      console.log(`${s.name} | trades ${s.trades} | win% ${s.winRatePct.toFixed(0)} | realised $${s.realised.toFixed(2)} | ret ${s.returnOnBudgetPct.toFixed(2)}% | sessions won ${s.sessionsWon}/10 | errors ${s.errors}`);
    }
    expect(scores.length).toBe(entries.length);
    expect(scores.every((s) => s.sessions.length === 10)).toBe(true);
  }, 1200000);
});
