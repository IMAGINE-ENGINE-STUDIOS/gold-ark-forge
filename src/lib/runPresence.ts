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

/* The record is mirrored to localStorage and a window event. Reason:
   if the production bundle ever loads this module twice (split chunks),
   the two copies still stay in sync through the mirror — the Swap's
   presence strip must never depend on bundle layout. */
const MIRROR_KEY = 'ga_run_presence_v1';
const MIRROR_EVENT = 'ga-run-presence';
const persist = () => {
  try {
    if (current) localStorage.setItem(MIRROR_KEY, JSON.stringify(current));
    else localStorage.removeItem(MIRROR_KEY);
    window.dispatchEvent(new Event(MIRROR_EVENT));
  } catch { /* storage unavailable — in-memory store still works */ }
};
const hydrate = () => {
  try {
    const raw = localStorage.getItem(MIRROR_KEY);
    const parsed = raw ? (JSON.parse(raw) as RunPresence) : null;
    const next = parsed && typeof parsed.startedAt === 'number' && Date.now() - parsed.startedAt < 6 * 60 * 60 * 1000 ? parsed : null;
    if (JSON.stringify(next) !== JSON.stringify(current)) { current = next; notify(); }
  } catch { /* ignore */ }
};

export const runPresence = {
  get: (): RunPresence | null => current,
  set: (p: RunPresence) => { current = p; persist(); notify(); },
  tick: (ticks: number) => {
    if (current && ticks !== current.ticks) { current = { ...current, ticks }; persist(); notify(); }
  },
  clear: () => { if (current) { current = null; persist(); notify(); } },
  subscribe: (fn: () => void) => {
    listeners.add(fn);
    hydrate();
    const onMirror = () => hydrate();
    window.addEventListener(MIRROR_EVENT, onMirror);
    window.addEventListener('storage', onMirror);
    return () => {
      listeners.delete(fn);
      window.removeEventListener(MIRROR_EVENT, onMirror);
      window.removeEventListener('storage', onMirror);
    };
  },
};
