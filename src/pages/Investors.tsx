import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Lock, Folder, FolderPlus, Upload, Trash2, Download, FileText, ChevronRight,
  Search, ShieldCheck, Activity, ArrowLeft, Loader2, X, Presentation, Mail,
} from 'lucide-react';
import { toast } from 'sonner';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { supabase } from '@/integrations/supabase/client';

interface FolderRow { id: string; path: string; name: string; parent_path: string; description: string | null }
interface DocRow {
  id: string; title: string; description: string | null; folder_path: string;
  file_path: string; file_size: number | null; mime_type: string | null; created_at: string;
}
interface ActivityRow { id: string; action: string; target: string; created_at: string }

const PASS_KEY = 'ga_dataroom_pass';

const fmtSize = (b: number | null) => {
  if (!b) return '—';
  const u = ['B', 'KB', 'MB', 'GB'];
  let i = 0, n = b;
  while (n >= 1024 && i < u.length - 1) { n /= 1024; i++; }
  return `${n.toFixed(n < 10 && i > 0 ? 1 : 0)} ${u[i]}`;
};

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });

const HIGHLIGHTS = [
  { label: 'Asset Class', value: 'Physical Bullion' },
  { label: 'Settlement', value: 'Bitcoin Anchored' },
  { label: 'Custody Model', value: 'Non-Custodial' },
  { label: 'Verification', value: 'Merkle Proofs' },
];

const Investors = () => {
  const [pass, setPass] = useState<string | null>(() => sessionStorage.getItem(PASS_KEY));
  const [entry, setEntry] = useState('');
  const [unlocking, setUnlocking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [folders, setFolders] = useState<FolderRow[]>([]);
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [activity, setActivity] = useState<ActivityRow[]>([]);
  const [cwd, setCwd] = useState('/');
  const [query, setQuery] = useState('');
  const [newFolder, setNewFolder] = useState('');
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const call = useCallback(async (action: string, payload: Record<string, unknown> = {}, code?: string) => {
    const { data, error } = await supabase.functions.invoke('investor-dataroom', {
      body: { action, pass: code ?? pass, ...payload },
    });
    if (error) {
      const detail = await (error as any)?.context?.text?.().catch(() => null);
      let msg = 'Request failed';
      try { msg = detail ? JSON.parse(detail).error ?? msg : msg; } catch { /* ignore */ }
      throw new Error(msg);
    }
    if (data?.error) throw new Error(data.error);
    return data;
  }, [pass]);

  const refresh = useCallback(async (code?: string) => {
    setLoading(true);
    try {
      const data = await call('list', {}, code);
      setFolders(data.folders ?? []);
      setDocs(data.documents ?? []);
      setActivity(data.activity ?? []);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [call]);

  useEffect(() => { if (pass) refresh(); }, [pass, refresh]);

  const unlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setUnlocking(true);
    try {
      await call('verify', {}, entry);
      sessionStorage.setItem(PASS_KEY, entry);
      setPass(entry);
      toast.success('Data room unlocked');
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setUnlocking(false);
    }
  };

  const lock = () => {
    sessionStorage.removeItem(PASS_KEY);
    setPass(null);
    setEntry('');
  };

  const childFolders = useMemo(
    () => folders.filter((f) => f.parent_path === cwd),
    [folders, cwd],
  );

  const visibleDocs = useMemo(() => {
    const q = query.trim().toLowerCase();
    return docs.filter((d) =>
      (q ? d.title.toLowerCase().includes(q) : d.folder_path === cwd));
  }, [docs, cwd, query]);

  const crumbs = useMemo(() => {
    if (cwd === '/') return [] as FolderRow[];
    const parts = cwd.split('/').filter(Boolean);
    return parts.map((_, i) => {
      const p = '/' + parts.slice(0, i + 1).join('/');
      return folders.find((f) => f.path === p);
    }).filter(Boolean) as FolderRow[];
  }, [cwd, folders]);

  const countIn = (path: string) => docs.filter((d) => d.folder_path.startsWith(path)).length;

  const createFolder = async () => {
    if (!newFolder.trim()) return;
    try {
      await call('create_folder', { name: newFolder.trim(), parent_path: cwd });
      setNewFolder('');
      setShowNewFolder(false);
      toast.success('Folder created');
      refresh();
    } catch (e) { toast.error((e as Error).message); }
  };

  const removeFolder = async (f: FolderRow) => {
    if (!confirm(`Delete "${f.name}" and all documents inside?`)) return;
    try {
      await call('delete_folder', { path: f.path });
      toast.success('Folder deleted');
      refresh();
    } catch (e) { toast.error((e as Error).message); }
  };

  const uploadFiles = async (files: FileList | File[]) => {
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const meta = await call('upload_url', { filename: file.name });
        const res = await fetch(meta.signedUrl, {
          method: 'PUT',
          headers: { 'Content-Type': file.type || 'application/octet-stream' },
          body: file,
        });
        if (!res.ok) throw new Error(`Upload failed for ${file.name}`);
        await call('confirm_upload', {
          title: file.name,
          folder_path: cwd,
          file_path: meta.path,
          file_size: file.size,
          mime_type: file.type,
        });
      }
      toast.success('Upload complete');
      refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const openDoc = async (d: DocRow) => {
    try {
      const { url } = await call('download_url', { id: d.id });
      window.open(url, '_blank', 'noopener');
    } catch (e) { toast.error((e as Error).message); }
  };

  const deleteDoc = async (d: DocRow) => {
    if (!confirm(`Permanently delete "${d.title}"?`)) return;
    try {
      await call('delete_document', { id: d.id });
      toast.success('Document deleted');
      refresh();
    } catch (e) { toast.error((e as Error).message); }
  };

  if (!pass) {
    return (
      <div className="min-h-screen bg-navy-dark flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4 py-20">
          <div className="w-full max-w-md glass-panel p-8 relative">
            <div className="ornate-corner ornate-corner-tl" />
            <div className="ornate-corner ornate-corner-br" />
            <div className="flex flex-col items-center text-center gap-3">
              <div className="h-14 w-14 rounded-full border border-gold/40 flex items-center justify-center">
                <Lock className="h-6 w-6 text-gold" />
              </div>
              <h1 className="text-2xl text-gold tracking-widest">INVESTOR DATA ROOM</h1>
              <div className="divider-ornate w-full" />
              <p className="text-xs text-silver/70 leading-relaxed">
                Confidential. Access restricted to invited investors and advisors of Gold Arrow.
              </p>
            </div>
            <form onSubmit={unlock} className="mt-8 space-y-4">
              <input
                type="password"
                value={entry}
                onChange={(e) => setEntry(e.target.value)}
                placeholder="Access code"
                autoFocus
                className="w-full bg-navy/60 border border-gold/20 rounded px-4 py-3 text-sm text-marble placeholder:text-silver/40 focus:outline-none focus:border-gold/60"
              />
              <button
                type="submit"
                disabled={unlocking || !entry}
                className="w-full btn-primary-gold rounded py-3 text-xs disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {unlocking ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                ENTER DATA ROOM
              </button>
            </form>
            <p className="mt-6 text-[10px] text-center text-silver/40 tracking-wide">
              All access is logged. Documents are served via expiring signed links.
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy-dark flex flex-col">
      <Header />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-10">
        {/* Masthead */}
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-gold/15 pb-6">
          <div>
            <p className="text-[10px] tracking-[0.3em] text-gold/60">CONFIDENTIAL</p>
            <h1 className="text-3xl text-gradient-gold tracking-wider mt-1">INVESTOR DATA ROOM</h1>
            <p className="text-xs text-silver/60 mt-2 max-w-xl">
              Curated diligence materials for Gold Arrow — tokenized bullion certification,
              Bitcoin-anchored settlement and non-custodial market infrastructure.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/deck" className="btn-secondary-navy rounded px-4 py-2 text-[10px] flex items-center gap-2">
              <Presentation className="h-3.5 w-3.5" /> INVESTOR DECK
            </Link>
            <a href="mailto:investors@goldarrow.io" className="btn-secondary-navy rounded px-4 py-2 text-[10px] flex items-center gap-2">
              <Mail className="h-3.5 w-3.5" /> CONTACT IR
            </a>
            <button onClick={lock} className="border border-gold/20 rounded px-4 py-2 text-[10px] text-silver/70 hover:text-gold hover:border-gold/50 transition">
              LOCK
            </button>
          </div>
        </div>

        {/* Highlights */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
          {HIGHLIGHTS.map((h) => (
            <div key={h.label} className="glass-card p-4 widget-glow">
              <p className="text-[9px] tracking-[0.2em] text-silver/50">{h.label.toUpperCase()}</p>
              <p className="text-sm text-gold mt-1">{h.value}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-[1fr_280px] gap-6 mt-8">
          <section>
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <div className="relative flex-1 min-w-[180px]">
                <Search className="h-3.5 w-3.5 text-silver/40 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search all documents..."
                  className="w-full bg-navy/60 border border-gold/15 rounded pl-9 pr-3 py-2 text-xs text-marble placeholder:text-silver/40 focus:outline-none focus:border-gold/50"
                />
              </div>
              <button
                onClick={() => setShowNewFolder((s) => !s)}
                className="border border-gold/25 rounded px-3 py-2 text-[10px] text-gold hover:bg-gold/10 transition flex items-center gap-2"
              >
                <FolderPlus className="h-3.5 w-3.5" /> NEW FOLDER
              </button>
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="btn-primary-gold rounded px-4 py-2 text-[10px] flex items-center gap-2 disabled:opacity-50"
              >
                {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                UPLOAD
              </button>
              <input
                ref={fileRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => { if (e.target.files?.length) uploadFiles(e.target.files); e.target.value = ''; }}
              />
            </div>

            {showNewFolder && (
              <div className="glass-card p-3 mb-4 flex items-center gap-2">
                <input
                  value={newFolder}
                  onChange={(e) => setNewFolder(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && createFolder()}
                  placeholder="Folder name"
                  autoFocus
                  className="flex-1 bg-navy/60 border border-gold/15 rounded px-3 py-2 text-xs text-marble focus:outline-none focus:border-gold/50"
                />
                <button onClick={createFolder} className="btn-primary-gold rounded px-3 py-2 text-[10px]">CREATE</button>
                <button onClick={() => setShowNewFolder(false)} className="text-silver/50 hover:text-gold"><X className="h-4 w-4" /></button>
              </div>
            )}

            {/* Breadcrumbs */}
            <div className="flex items-center gap-1 text-[11px] text-silver/60 mb-3">
              <button onClick={() => setCwd('/')} className={cwd === '/' ? 'text-gold' : 'hover:text-gold'}>DATA ROOM</button>
              {crumbs.map((c) => (
                <span key={c.path} className="flex items-center gap-1">
                  <ChevronRight className="h-3 w-3 text-gold/40" />
                  <button onClick={() => setCwd(c.path)} className={cwd === c.path ? 'text-gold' : 'hover:text-gold'}>
                    {c.name.toUpperCase()}
                  </button>
                </span>
              ))}
              {cwd !== '/' && (
                <button
                  onClick={() => setCwd(folders.find((f) => f.path === cwd)?.parent_path ?? '/')}
                  className="ml-3 flex items-center gap-1 text-gold/70 hover:text-gold"
                >
                  <ArrowLeft className="h-3 w-3" /> BACK
                </button>
              )}
            </div>

            {/* Folders */}
            {!query && (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {childFolders.map((f) => (
                  <div key={f.id} className="glass-card p-4 widget-glow group relative">
                    <button onClick={() => setCwd(f.path)} className="text-left w-full">
                      <Folder className="h-5 w-5 text-gold/80" />
                      <p className="text-sm text-marble mt-3">{f.name}</p>
                      <p className="text-[10px] text-silver/50 mt-1 line-clamp-1">{f.description ?? 'Folder'}</p>
                      <p className="text-[10px] text-gold/60 mt-2">{countIn(f.path)} documents</p>
                    </button>
                    <button
                      onClick={() => removeFolder(f)}
                      className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 text-silver/40 hover:text-destructive transition"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Documents */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files?.length) uploadFiles(e.dataTransfer.files); }}
              className={`mt-5 glass-panel p-4 transition ${dragOver ? 'border-gold/60 bg-gold/5' : ''}`}
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] tracking-[0.25em] text-gold/70">
                  {query ? 'SEARCH RESULTS' : 'DOCUMENTS'}
                </p>
                {loading && <Loader2 className="h-3.5 w-3.5 text-gold animate-spin" />}
              </div>

              {visibleDocs.length === 0 ? (
                <div className="py-12 text-center">
                  <Upload className="h-6 w-6 text-gold/30 mx-auto" />
                  <p className="text-xs text-silver/50 mt-3">
                    {query ? 'No documents match your search.' : 'Drop files here or use the upload button.'}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gold/10">
                  {visibleDocs.map((d) => (
                    <div key={d.id} className="flex items-center gap-3 py-3 group">
                      <FileText className="h-4 w-4 text-gold/70 shrink-0" />
                      <button onClick={() => openDoc(d)} className="flex-1 text-left min-w-0">
                        <p className="text-xs text-marble truncate group-hover:text-gold transition">{d.title}</p>
                        <p className="text-[10px] text-silver/45">
                          {fmtSize(d.file_size)} · {fmtDate(d.created_at)}
                          {query && d.folder_path !== '/' ? ` · ${d.folder_path}` : ''}
                        </p>
                      </button>
                      <button onClick={() => openDoc(d)} className="text-silver/50 hover:text-gold transition">
                        <Download className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => deleteDoc(d)} className="text-silver/40 hover:text-destructive transition">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Side rail */}
          <aside className="space-y-4">
            <div className="glass-card p-4">
              <p className="text-[10px] tracking-[0.25em] text-gold/70 mb-3">ROOM SUMMARY</p>
              <div className="space-y-2 text-[11px]">
                <div className="flex justify-between"><span className="text-silver/50">Folders</span><span className="text-marble">{folders.length}</span></div>
                <div className="flex justify-between"><span className="text-silver/50">Documents</span><span className="text-marble">{docs.length}</span></div>
                <div className="flex justify-between">
                  <span className="text-silver/50">Total size</span>
                  <span className="text-marble">{fmtSize(docs.reduce((s, d) => s + (d.file_size ?? 0), 0))}</span>
                </div>
              </div>
            </div>

            <div className="glass-card p-4">
              <p className="text-[10px] tracking-[0.25em] text-gold/70 mb-3 flex items-center gap-2">
                <Activity className="h-3 w-3" /> ACTIVITY LOG
              </p>
              {activity.length === 0 ? (
                <p className="text-[10px] text-silver/40">No activity yet.</p>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto watchlist-scroll pr-1">
                  {activity.map((a) => (
                    <div key={a.id} className="text-[10px] border-l border-gold/25 pl-2">
                      <p className="text-marble/80 truncate">{a.target}</p>
                      <p className="text-silver/40">{a.action.replace(/_/g, ' ')} · {fmtDate(a.created_at)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="glass-card p-4">
              <p className="text-[10px] tracking-[0.25em] text-gold/70 mb-2 flex items-center gap-2">
                <ShieldCheck className="h-3 w-3" /> SECURITY
              </p>
              <p className="text-[10px] text-silver/55 leading-relaxed">
                Files are stored in a private vault bucket. Downloads use signed links that expire
                after 5 minutes. Every view, upload and deletion is recorded in the activity log.
              </p>
            </div>
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Investors;
