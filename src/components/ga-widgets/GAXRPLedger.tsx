import { useEffect, useState, useRef } from 'react';
import { RefreshCw, Radio, ExternalLink, Layers, Clock } from 'lucide-react';

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
      // Subscribe to ledger stream
      ws.send(JSON.stringify({
        id: 1,
        command: 'subscribe',
        streams: ['ledger'],
      }));
      // Also get current state
      ws.send(JSON.stringify({
        id: 2,
        command: 'ledger',
        ledger_index: 'validated',
        transactions: false,
      }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        // Stream update
        if (data.type === 'ledgerClosed') {
          setLedger({
            ledger_index: data.ledger_index,
            ledger_hash: data.ledger_hash,
            close_time: data.ledger_time + 946684800, // Ripple epoch offset
            txn_count: data.txn_count,
            reserve_base: data.reserve_base / 1e6,
          });
          setLoading(false);
        }

        // Initial response
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

    ws.onclose = () => {
      setConnected(false);
      // Reconnect after 5s
      setTimeout(connect, 5000);
    };

    ws.onerror = () => {
      ws.close();
    };
  };

  useEffect(() => {
    connect();
    return () => {
      wsRef.current?.close();
    };
  }, []);

  const timeSince = ledger ? Math.floor(Date.now() / 1000 - ledger.close_time) : null;

  if (loading) {
    return (
      <div className="rounded-sm border border-gold/20 bg-navy-light/50 p-8 animate-pulse">
        <div className="h-6 w-48 bg-gold/10 rounded mb-4" />
        <div className="grid grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-gold/5 rounded" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-sm border border-gold/20 bg-navy-light/50 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gold/10 bg-navy-dark/50">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
            <span className="text-[8px] font-bold text-white">X</span>
          </div>
          <span className="font-display text-sm tracking-[0.15em] text-gold-light">XRP LEDGER</span>
          <div className="flex items-center gap-1.5 ml-2">
            <Radio className={`w-3 h-3 ${connected ? 'text-emerald-400 animate-pulse' : 'text-red-400'}`} />
            <span className="text-[10px] text-marble/30 font-mono">{connected ? 'LIVE' : 'OFFLINE'}</span>
          </div>
        </div>
      </div>

      <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-navy-dark/40 rounded p-4 border border-gold/10">
          <div className="flex items-center gap-2 mb-2">
            <Layers className="w-3.5 h-3.5 text-gold/60" />
            <span className="text-[10px] font-display tracking-[0.2em] text-marble/40">LEDGER INDEX</span>
          </div>
          <p className="font-display text-xl text-gold-light">{ledger?.ledger_index?.toLocaleString()}</p>
          <p className="text-[10px] text-marble/30 mt-1">{ledger?.txn_count} txns</p>
        </div>

        <div className="bg-navy-dark/40 rounded p-4 border border-gold/10">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-3.5 h-3.5 text-gold/60" />
            <span className="text-[10px] font-display tracking-[0.2em] text-marble/40">LAST CLOSE</span>
          </div>
          <p className="font-display text-xl text-marble">{timeSince !== null ? `${timeSince}s ago` : '—'}</p>
          <p className="text-[10px] text-marble/30 mt-1">~3-5s target</p>
        </div>

        <div className="bg-navy-dark/40 rounded p-4 border border-gold/10">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-display tracking-[0.2em] text-marble/40">RESERVE</span>
          </div>
          <p className="font-display text-xl text-marble">{ledger?.reserve_base} XRP</p>
          <p className="text-[10px] text-marble/30 mt-1">base reserve</p>
        </div>

        <div className="bg-navy-dark/40 rounded p-4 border border-gold/10 flex flex-col justify-between">
          <span className="text-[10px] font-display tracking-[0.2em] text-marble/40">EXPLORER</span>
          <a
            href={`https://livenet.xrpl.org/ledgers/${ledger?.ledger_index}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-gold/70 hover:text-gold text-xs mt-2 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            View on XRPL Explorer
          </a>
          <p className="text-[10px] text-marble/20 mt-1 font-mono truncate">{ledger?.ledger_hash?.slice(0, 16)}…</p>
        </div>
      </div>
    </div>
  );
};

export default GAXRPLedger;
