// Custom code blocks — the "any code becomes a box" layer of Pipeline v2.
// User code runs inside a throwaway Web Worker (no DOM, no network handles kept
// open, hard timeout) and returns a plain JSON result the blueprint threads on.

export interface CustomBlock {
  id: string;
  name: string;
  description: string;
  language: 'javascript';
  code: string;
  tint: string;
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = 'ga_pipeline_blocks_v2';

export const loadBlocks = (): CustomBlock[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CustomBlock[]) : [];
  } catch { return []; }
};

export const saveBlocks = (blocks: CustomBlock[]) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(blocks)); } catch { /* ignore */ }
};

export const STARTER_CODE = `// Any program can become a pipeline box.
// You get \`input\` (live context) and must return a JSON-serialisable result.
//
// input = {
//   ticker, label, price, series: number[], change,
//   account: { equity, totalPnl, startingBalance },
//   screen: [{ ticker, label, score }],   // last SCREEN node output
//   analysis: { id, value, verdict, detail } | null,
//   params: { ...your block params }
// }

const s = input.series;
const fast = s.slice(-5).reduce((a, b) => a + b, 0) / Math.max(1, s.slice(-5).length);
const slow = s.slice(-20).reduce((a, b) => a + b, 0) / Math.max(1, s.slice(-20).length);

return {
  signal: fast > slow ? 'bullish' : 'bearish',
  value: Number((((fast - slow) / slow) * 100).toFixed(4)),
  message: \`fast/slow spread on \${input.label}\`,
};
`;

export interface BlockRunResult {
  ok: boolean;
  output?: any;
  error?: string;
  ms: number;
  logs: string[];
}

const WORKER_SHELL = `
self.onmessage = async (e) => {
  const { code, input } = e.data;
  const logs = [];
  const console = {
    log: (...a) => logs.push(a.map(String).join(' ')),
    warn: (...a) => logs.push('WARN ' + a.map(String).join(' ')),
    error: (...a) => logs.push('ERROR ' + a.map(String).join(' ')),
  };
  try {
    const fn = new Function('input', 'console', '"use strict";return (async () => {' + code + '})();');
    const output = await fn(input, console);
    self.postMessage({ ok: true, output: JSON.parse(JSON.stringify(output ?? null)), logs });
  } catch (err) {
    self.postMessage({ ok: false, error: String((err && err.message) || err), logs });
  }
};
`;

/** Execute block code in an isolated worker with a hard timeout. */
export const runBlockCode = (code: string, input: any, timeoutMs = 4000): Promise<BlockRunResult> =>
  new Promise((resolve) => {
    const started = performance.now();
    let worker: Worker | null = null;
    let url = '';
    const done = (r: Omit<BlockRunResult, 'ms'>) => {
      clearTimeout(timer);
      try { worker?.terminate(); } catch { /* ignore */ }
      if (url) URL.revokeObjectURL(url);
      resolve({ ...r, ms: Math.round(performance.now() - started) });
    };
    const timer = setTimeout(() => done({ ok: false, error: `Timed out after ${timeoutMs}ms`, logs: [] }), timeoutMs);
    try {
      url = URL.createObjectURL(new Blob([WORKER_SHELL], { type: 'text/javascript' }));
      worker = new Worker(url);
      worker.onmessage = (e: MessageEvent) => done({ ok: !!e.data?.ok, output: e.data?.output, error: e.data?.error, logs: e.data?.logs ?? [] });
      worker.onerror = (e) => done({ ok: false, error: e.message || 'Worker error', logs: [] });
      worker.postMessage({ code, input });
    } catch (err: any) {
      done({ ok: false, error: String(err?.message ?? err), logs: [] });
    }
  });