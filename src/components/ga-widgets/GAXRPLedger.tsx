import { useEffect, useState, useRef } from 'react';
import { ExternalLink, Layers, Clock } from 'lucide-react';
import WidgetShell from './WidgetShell';
import AnimatedNumber from './AnimatedNumber';
import LivePulse from './LivePulse';

interface LedgerData {
  ledger_index: number;
  ledger_hash: string;
  close_time: number;
  txn_count: number;
  reserve_base: number;
}

const GAXRPLedger = () => {
  const [ledger, setLedger] = useState<LedgerData | null>(null);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const wsRef = useRef<WebSocket | null>(null);

  const connect = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    const ws = new WebSocket('wss://xrplcluster.com');
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      ws.send(JSON.stringify({ id: 1, command: 'subscribe', streams: ['ledger'] }));
      ws.send(JSON.stringify({ id: 2, command: 'ledger', ledger_index: 'validated', transactions: false }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'ledgerClosed') {
          setLedger({
            ledger_index: data.ledger_index,
            ledger_hash: data.ledger_hash,
            close_time: data.ledger_time + 946684800,
            txn_count: data.txn_count,
            reserve_base: data.reserve_base / 1e6,
          });
          setLoading(false);
        }
        if (data.id === 2 && data.result?.ledger) {
          const l = data.result.ledger;
          setLedger({
            ledger_index: parseInt(l.ledger_index),
            ledger_hash: l.ledger_hash,
            close_time: parseInt(l.close_time) + 946684800,
            txn_count: l.transactions?.length ?? 0,
            reserve_base: 10,
          });
          setLoading(false);
        }
      } catch (e) {
        console.error('XRPL parse error:', e);
      }
    };

    ws.onclose = () => { setConnected(false); setTimeout(connect, 5000); };
    ws.onerror = () => { ws.close(); };
  };

  useEffect(() => {
    connect();
    return () => { wsRef.current?.close(); };
  }, []);

  const timeSince = ledger ? Math.floor(Date.now() / 1000 - ledger.close_time) : null;

  return (
    <WidgetShell
      icon={() => (
        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
          <span className="text-[8px] font-bold text-white">X</span>
        </div>
      )}
      title="XRP LEDGER"
      badge={undefined}
    >
      {loading ? (
        <div className="grid grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-navy-light/30 rounded skeleton-shimmer" style={{ animationDelay: `${i * 0.1}s` }} />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <LivePulse connected={connected} label={connected ? 'WEBSOCKET LIVE' : 'RECONNECTING'} />
            <span className="text-[10px] text-marble/20 font-mono">{ledger?.txn_count} txns</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-navy-dark/40 rounded p-4 border border-gold/10 hover:border-gold/25 transition-all duration-300">
              <div className="flex items-center gap-2 mb-2">
                <Layers className="w-3.5 h-3.5 text-gold/50" />
                <span className="text-[10px] font-display tracking-[0.2em] text-marble/40">LEDGER</span>
              </div>
              <AnimatedNumber value={ledger?.ledger_index ?? 0} className="font-display text-xl text-gold-light" />
            </div>

            <div className="bg-navy-dark/40 rounded p-4 border border-gold/10 hover:border-gold/25 transition-all duration-300">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-3.5 h-3.5 text-gold/50" />
                <span className="text-[10px] font-display tracking-[0.2em] text-marble/40">LAST CLOSE</span>
              </div>
              <p className="font-display text-xl text-marble">{timeSince !== null ? `${timeSince}s ago` : '—'}</p>
              <p className="text-[10px] text-marble/30 mt-1">~3-5s target</p>
            </div>

            <div className="bg-navy-dark/40 rounded p-4 border border-gold/10 hover:border-gold/25 transition-all duration-300">
              <span className="text-[10px] font-display tracking-[0.2em] text-marble/40">RESERVE</span>
              <p className="font-display text-xl text-marble mt-2">{ledger?.reserve_base} XRP</p>
              <p className="text-[10px] text-marble/30 mt-1">base reserve</p>
            </div>

            <div className="bg-navy-dark/40 rounded p-4 border border-gold/10 hover:border-gold/25 transition-all duration-300 flex flex-col justify-between">
              <span className="text-[10px] font-display tracking-[0.2em] text-marble/40">EXPLORER</span>
              <a
                href={`https://livenet.xrpl.org/ledgers/${ledger?.ledger_index}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-gold/50 hover:text-gold text-xs mt-2 transition-colors duration-300"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                XRPL Explorer
              </a>
              <p className="text-[10px] text-marble/20 mt-1 font-mono truncate">{ledger?.ledger_hash?.slice(0, 16)}…</p>
            </div>
          </div>
        </div>
      )}
    </WidgetShell>
  );
};

export default GAXRPLedger;
