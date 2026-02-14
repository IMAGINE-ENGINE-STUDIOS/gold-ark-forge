import { useEffect, useState, useCallback } from 'react';
import { ExternalLink, FileText, Search } from 'lucide-react';
import WidgetShell from './WidgetShell';

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

  const fetchFilings = useCallback(async () => {
    try {
      const end = new Date().toISOString().split('T')[0];
      const start = new Date(Date.now() - 90 * 86400000).toISOString().split('T')[0];
      const url = `https://efts.sec.gov/LATEST/search-index?q=%22gold%22+%22precious+metals%22&dateRange=custom&startdt=${start}&enddt=${end}&forms=10-K,10-Q,8-K,S-1&_source=file_date,entity_name,form_type,file_num`;

      const res = await fetch(url, {
        headers: { 'User-Agent': 'GoldArrow/1.0 admin@goldarrow.io' },
      });

      if (!res.ok) {
        const fallbackUrl = `https://efts.sec.gov/LATEST/search-index?q=%22gold+ETF%22&forms=10-K,10-Q`;
        const fallbackRes = await fetch(fallbackUrl, {
          headers: { 'User-Agent': 'GoldArrow/1.0 admin@goldarrow.io' },
        });

        if (!fallbackRes.ok) { setFilings([]); return; }
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
    const interval = setInterval(fetchFilings, 300_000);
    return () => clearInterval(interval);
  }, [fetchFilings]);

  const formTypeColors: Record<string, string> = {
    '10-K': 'text-gold bg-gold/10',
    '10-Q': 'text-blue-400 bg-blue-400/10',
    '8-K': 'text-emerald-400 bg-emerald-400/10',
    'S-1': 'text-purple-400 bg-purple-400/10',
  };

  return (
    <WidgetShell icon={FileText} title="SEC EDGAR FILINGS" source="gold & precious metals" onRefresh={fetchFilings}>
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-14 bg-navy-light/20 rounded skeleton-shimmer" style={{ animationDelay: `${i * 0.1}s` }} />
          ))}
        </div>
      ) : filings.length === 0 ? (
        <div className="py-12 text-center">
          <Search className="w-8 h-8 text-marble/15 mx-auto mb-3" />
          <p className="text-marble/35 text-sm font-display tracking-wider">No recent filings found</p>
          <p className="text-marble/20 text-xs mt-1">SEC EDGAR may be rate-limiting requests</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-1">
            {filings.map((f, i) => (
              <div
                key={f.id}
                className="flex items-center justify-between px-3 py-3 rounded hover:bg-gold/[0.03] transition-all duration-300 group"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-marble truncate group-hover:text-gold-light transition-colors duration-300">{f.entity_name}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className={`text-[10px] font-display tracking-wider px-2 py-0.5 rounded ${formTypeColors[f.form_type] || 'text-gold/60 bg-gold/10'}`}>
                      {f.form_type}
                    </span>
                    <span className="text-[10px] text-marble/25 font-mono">{f.file_date}</span>
                  </div>
                </div>
                <a
                  href={f.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gold/30 hover:text-gold transition-colors duration-300 ml-4"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-gold/10 flex items-center justify-between">
            <a
              href="https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&company=gold&type=10-K&dateb=&owner=include&count=40&search_text=&action=getcompany"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gold/40 hover:text-gold text-xs flex items-center gap-2 transition-colors duration-300"
            >
              <ExternalLink className="w-3 h-3" />
              Browse all on SEC EDGAR
            </a>
          </div>
        </div>
      )}
    </WidgetShell>
  );
};

export default GASECFilings;
