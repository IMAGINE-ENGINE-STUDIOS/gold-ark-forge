/* ─────────────────── Live run presence ───────────────────
   One module-level record of the pipeline run currently in flight, so
   every screen in the app (Swap above all) can show it and link back:
   the Pipeline and the Swap are one desk, not two apps. Pipeline V4
   (persistently mounted) writes it; anyone may read/subscribe.
   ─────────────────────────────────────────────────────────── */

export interface RunPresence {
  name: string;
  startedAt: number;
  ticks: number;
}

let current: RunPresence | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

export const runPresence = {
  get: (): RunPresence | null => current,
  set: (p: RunPresence) => { current = p; notify(); },
  tick: (ticks: number) => {
    if (current && ticks !== current.ticks) { current = { ...current, ticks }; notify(); }
  },
  clear: () => { if (current) { current = null; notify(); } },
  subscribe: (fn: () => void) => {
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  },
};
