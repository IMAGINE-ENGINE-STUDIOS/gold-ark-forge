import { useEffect, useState, useCallback } from 'react';
import { RefreshCw, ExternalLink, FileText, Search } from 'lucide-react';

interface Filing {
  id: string;
  entity_name: string;
  file_date: string;
  form_type: string;
  file_url: string;
}

const GASECFilings = () => {
  const [filings, setFilings] = useState<Filing[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchFilings = useCallback(async () => {
    try {
      // SEC EDGAR full-text search API
      const end = new Date().toISOString().split('T')[0];
      const start = new Date(Date.now() - 90 * 86400000).toISOString().split('T')[0];
      const url = `https://efts.sec.gov/LATEST/search-index?q=%22gold%22+%22precious+metals%22&dateRange=custom&startdt=${start}&enddt=${end}&forms=10-K,10-Q,8-K,S-1&_source=file_date,entity_name,form_type,file_num`;

      const res = await fetch(url, {
        headers: { 'User-Agent': 'GoldArrow/1.0 admin@goldarrow.io' },
      });

      if (!res.ok) {
        // Fallback: use the simpler search endpoint
        const fallbackUrl = `https://efts.sec.gov/LATEST/search-index?q=%22gold+ETF%22&forms=10-K,10-Q`;
        const fallbackRes = await fetch(fallbackUrl, {
          headers: { 'User-Agent': 'GoldArrow/1.0 admin@goldarrow.io' },
        });

        if (!fallbackRes.ok) {
          setFilings([]);
          return;
        }
        const fallbackData = await fallbackRes.json();
        processResults(fallbackData);
        return;
      }

      const data = await res.json();
      processResults(data);
    } catch (e) {
      console.error('SEC EDGAR fetch error:', e);
      setFilings([]);
    } finally {
      setLoading(false);
      setLastRefresh(new Date());
    }
  }, []);

  const processResults = (data: any) => {
    const hits = data.hits?.hits ?? data.hits ?? [];
    const results: Filing[] = hits.slice(0, 10).map((h: any, i: number) => {
      const src = h._source ?? h;
      return {
        id: h._id ?? `filing-${i}`,
        entity_name: src.entity_name ?? src.display_names?.[0] ?? 'Unknown Entity',
        file_date: src.file_date ?? src.period_of_report ?? '—',
        form_type: src.form_type ?? src.file_type ?? '—',
        file_url: src.file_url
          ? `https://www.sec.gov${src.file_url}`
          : `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&company=gold&type=${src.form_type}&dateb=&owner=include&count=10`,
      };
    });
    setFilings(results);
  };

  useEffect(() => {
    fetchFilings();
    const interval = setInterval(fetchFilings, 300_000); // 5 min
    return () => clearInterval(interval);
  }, [fetchFilings]);

  if (loading) {
    return (
      <div className="rounded-sm border border-gold/20 bg-navy-light/50 p-8 animate-pulse">
        <div className="h-6 w-48 bg-gold/10 rounded mb-4" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-gold/5 rounded" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-sm border border-gold/20 bg-navy-light/50 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gold/10 bg-navy-dark/50">
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-gold" />
          <span className="font-display text-sm tracking-[0.15em] text-gold-light">SEC EDGAR FILINGS</span>
          <span className="text-[10px] text-marble/30 font-mono ml-2">gold & precious metals</span>
        </div>
        <button onClick={fetchFilings} className="text-marble/40 hover:text-gold transition-colors">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {filings.length === 0 ? (
        <div className="p-8 text-center">
          <Search className="w-8 h-8 text-marble/20 mx-auto mb-3" />
          <p className="text-marble/40 text-sm">No recent filings found</p>
          <p className="text-marble/20 text-xs mt-1">SEC EDGAR may be rate-limiting requests</p>
        </div>
      ) : (
        <div className="divide-y divide-gold/5">
          {filings.map((f) => (
            <div key={f.id} className="px-6 py-3 flex items-center justify-between hover:bg-gold/5 transition-colors">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-marble truncate">{f.entity_name}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[10px] font-display tracking-wider text-gold/60 bg-gold/10 px-2 py-0.5 rounded">
                    {f.form_type}
                  </span>
                  <span className="text-[10px] text-marble/30 font-mono">{f.file_date}</span>
                </div>
              </div>
              <a
                href={f.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gold/50 hover:text-gold transition-colors ml-4"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          ))}
        </div>
      )}

      <div className="px-6 py-3 border-t border-gold/10 flex items-center justify-between">
        <a
          href="https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&company=gold&type=10-K&dateb=&owner=include&count=40&search_text=&action=getcompany"
          target="_blank"
          rel="noopener noreferrer"
          className="text-gold/50 hover:text-gold text-xs flex items-center gap-2 transition-colors"
        >
          <ExternalLink className="w-3 h-3" />
          Browse all on SEC EDGAR
        </a>
        <p className="text-[10px] text-marble/20">{lastRefresh.toLocaleTimeString()}</p>
      </div>
    </div>
  );
};

export default GASECFilings;
