import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { usePublicVerify } from '@/hooks/usePublicVerify';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Search, Clock, Anchor, Database, Loader2 } from 'lucide-react';

const Verify = () => {
  const [certId, setCertId] = useState('');
  const [activeTab, setActiveTab] = useState<'verify' | 'history' | 'anchor' | 'reserve'>('verify');
  const { data, error, loading, verify, history, anchorProof, reserveSnapshot } = usePublicVerify();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!certId.trim() && activeTab !== 'reserve') return;
    switch (activeTab) {
      case 'verify': verify(certId.trim()); break;
      case 'history': history(certId.trim()); break;
      case 'anchor': anchorProof({ cert_id: certId.trim() }); break;
      case 'reserve': reserveSnapshot(); break;
    }
  };

  const tabs = [
    { key: 'verify' as const, label: 'Verify', icon: Shield },
    { key: 'history' as const, label: 'History', icon: Clock },
    { key: 'anchor' as const, label: 'Anchor Proof', icon: Anchor },
    { key: 'reserve' as const, label: 'Reserve Snapshot', icon: Database },
  ];

  return (
    <div className="min-h-screen bg-navy">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <div className="h-1 w-24 mx-auto bg-gradient-to-r from-transparent via-gold to-transparent mb-6" />
          <h1 className="font-display text-4xl md:text-5xl text-gold-light mb-4">
            PUBLIC VERIFICATION
          </h1>
          <p className="text-marble/70 max-w-2xl mx-auto">
            Independently verify any certificate's authenticity, ownership history, and Bitcoin anchor proof.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-3 mb-8 justify-center">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-5 py-2.5 rounded-lg font-display text-sm tracking-wider transition-all flex items-center gap-2 ${
                activeTab === key
                  ? 'bg-gold text-navy'
                  : 'bg-navy-light/50 text-marble hover:bg-navy-light border border-gold/20'
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>

        {/* Search Form */}
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto mb-8">
          <div className="flex gap-3">
            {activeTab !== 'reserve' && (
              <Input
                value={certId}
                onChange={(e) => setCertId(e.target.value)}
                placeholder="Enter Certificate ID (UUID)"
                className="bg-navy-light/50 border-gold/20 text-marble placeholder:text-marble/40 font-mono"
              />
            )}
            <Button
              type="submit"
              disabled={loading || (!certId.trim() && activeTab !== 'reserve')}
              className="bg-gold text-navy hover:bg-gold-light font-display tracking-wider px-6 shrink-0"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />}
              <span className="ml-2">{activeTab === 'reserve' ? 'Fetch' : 'Verify'}</span>
            </Button>
          </div>
        </form>

        {/* Error */}
        {error && (
          <Card className="max-w-2xl mx-auto bg-red-900/20 border-red-500/30 mb-6">
            <CardContent className="p-4 text-red-300 text-sm">{error}</CardContent>
          </Card>
        )}

        {/* Results */}
        {data && (
          <Card className="max-w-3xl mx-auto bg-navy-light/30 border-gold/20">
            <CardHeader>
              <CardTitle className="font-display text-gold flex items-center gap-2">
                <Shield size={20} />
                {activeTab === 'verify' && 'Certificate Details'}
                {activeTab === 'history' && 'Event History'}
                {activeTab === 'anchor' && 'Bitcoin Anchor Proof'}
                {activeTab === 'reserve' && 'Reserve Snapshot'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activeTab === 'verify' && data.certificate && (
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-marble/60">Status</span>
                    <Badge variant="outline" className="text-green-400 border-green-400">{data.certificate.status}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-marble/60">Partner</span>
                    <span className="text-marble">{data.partner?.legal_name || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-marble/60">Issued At</span>
                    <span className="text-marble font-mono text-xs">{new Date(data.certificate.issued_at).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-marble/60">Signature Algorithm</span>
                    <span className="text-marble font-mono text-xs">{data.certificate.partner_sig_alg}</span>
                  </div>
                </div>
              )}

              {activeTab === 'history' && Array.isArray(data.events) && (
                <div className="space-y-3">
                  {data.events.map((evt: any, i: number) => (
                    <div key={i} className="border-b border-gold/10 pb-3 last:border-0">
                      <div className="flex justify-between items-center mb-1">
                        <Badge variant="outline" className="text-gold border-gold/40 text-xs">{evt.event_type}</Badge>
                        <span className="text-marble/50 text-xs font-mono">{new Date(evt.created_at).toLocaleString()}</span>
                      </div>
                      <p className="text-marble/70 text-xs font-mono break-all">ID: {evt.event_id}</p>
                    </div>
                  ))}
                  {data.events.length === 0 && <p className="text-marble/50 text-sm">No events found.</p>}
                </div>
              )}

              {activeTab === 'anchor' && data.proof && (
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-marble/60">Leaf Hash</span>
                    <span className="text-marble font-mono text-xs break-all max-w-[60%] text-right">{data.proof.leaf_hash}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-marble/60">Merkle Root</span>
                    <span className="text-marble font-mono text-xs break-all max-w-[60%] text-right">{data.proof.merkle_root}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-marble/60">Bitcoin TXID</span>
                    <span className="text-marble font-mono text-xs break-all max-w-[60%] text-right">{data.proof.commit_txid || 'Pending'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-marble/60">Anchor Status</span>
                    <Badge variant="outline" className="text-gold border-gold/40">{data.proof.status}</Badge>
                  </div>
                </div>
              )}

              {activeTab === 'reserve' && data.snapshot && (
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-marble/60">Snapshot ID</span>
                    <span className="text-marble font-mono text-xs">{data.snapshot.snapshot_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-marble/60">Gold (oz)</span>
                    <span className="text-gold font-semibold">{data.snapshot.total_gold_oz}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-marble/60">Silver (oz)</span>
                    <span className="text-silver font-semibold">{data.snapshot.total_silver_oz}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-marble/60">Platinum (oz)</span>
                    <span className="text-platinum font-semibold">{data.snapshot.total_platinum_oz}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-marble/60">Bar Count</span>
                    <span className="text-marble">{data.snapshot.bar_count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-marble/60">Merkle Root</span>
                    <span className="text-marble font-mono text-xs break-all max-w-[60%] text-right">{data.snapshot.merkle_root}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-marble/60">Bitcoin TXID</span>
                    <span className="text-marble font-mono text-xs break-all max-w-[60%] text-right">{data.snapshot.bitcoin_txid || 'Pending'}</span>
                  </div>
                </div>
              )}

              {!data.certificate && !data.events && !data.proof && !data.snapshot && (
                <pre className="text-marble/70 text-xs font-mono whitespace-pre-wrap overflow-auto max-h-96">
                  {JSON.stringify(data, null, 2)}
                </pre>
              )}
            </CardContent>
          </Card>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Verify;
