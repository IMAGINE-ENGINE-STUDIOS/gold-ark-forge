import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  Upload, FilePlus2, Trash2, Link2, Download, Loader2, Lock, FileText, Search,
} from 'lucide-react';

interface DataroomDoc {
  id: string;
  title: string;
  file_path: string;
  file_size: number | null;
  mime_type: string | null;
  uploaded_by: string | null;
  created_at: string;
}

const BUCKET = 'documents';
const CATEGORY = 'dataroom';
const GATE_PASSWORD = 'HitTheTarget';
const GATE_KEY = 'dataroom-gate-ok';

const formatBytes = (b: number | null) => {
  if (!b) return '—';
  const u = ['B', 'KB', 'MB', 'GB'];
  let i = 0; let n = b;
  while (n >= 1024 && i < u.length - 1) { n /= 1024; i++; }
  return `${n.toFixed(1)} ${u[i]}`;
};

const Dataroom = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const [docs, setDocs] = useState<DataroomDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [filter, setFilter] = useState('');
  const [newFileName, setNewFileName] = useState('');
  const [newFileContent, setNewFileContent] = useState('');
  const [creating, setCreating] = useState(false);

  const [gateOk, setGateOk] = useState(() =>
    typeof window !== 'undefined' && sessionStorage.getItem(GATE_KEY) === '1',
  );
  const [gateInput, setGateInput] = useState('');
  const [gateError, setGateError] = useState(false);

  const submitGate = (e: React.FormEvent) => {
    e.preventDefault();
    if (gateInput === GATE_PASSWORD) {
      sessionStorage.setItem(GATE_KEY, '1');
      setGateOk(true);
      setGateError(false);
    } else {
      setGateError(true);
    }
  };

  const allowed = useMemo(
    () => !!user?.email && user.email.toLowerCase().endsWith('@goldarrow.io'),
    [user],
  );

  useEffect(() => {
    if (!authLoading && !user) navigate('/login');
  }, [authLoading, user, navigate]);

  const refresh = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('documents')
      .select('id,title,file_path,file_size,mime_type,uploaded_by,created_at')
      .eq('category', CATEGORY)
      .order('created_at', { ascending: false });
    if (error) {
      toast.error(error.message);
    } else {
      setDocs(data ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!allowed) return;
    refresh();
    const channel = supabase
      .channel('dataroom-docs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'documents', filter: `category=eq.${CATEGORY}` }, () => refresh())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowed]);

  const uploadFile = async (file: File, title?: string) => {
    if (!user) return;
    const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `${CATEGORY}/${Date.now()}_${cleanName}`;
    const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, {
      contentType: file.type || 'application/octet-stream',
      upsert: false,
    });
    if (upErr) throw upErr;
    const { error: insErr } = await supabase.from('documents').insert({
      title: (title || file.name).slice(0, 200),
      category: CATEGORY,
      visibility: 'admin',
      file_path: path,
      file_size: file.size,
      mime_type: file.type || null,
      uploaded_by: user.id,
    });
    if (insErr) throw insErr;
  };

  const handleUploadInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);
    try {
      for (const f of Array.from(files)) await uploadFile(f);
      toast.success(`Uploaded ${files.length} file${files.length > 1 ? 's' : ''}`);
      refresh();
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleCreate = async () => {
    if (!newFileName.trim()) { toast.error('File name required'); return; }
    setCreating(true);
    try {
      const name = newFileName.trim().endsWith('.txt') ? newFileName.trim() : `${newFileName.trim()}.txt`;
      const blob = new Blob([newFileContent], { type: 'text/plain' });
      const file = new File([blob], name, { type: 'text/plain' });
      await uploadFile(file, name);
      toast.success('File created');
      setNewFileName(''); setNewFileContent('');
      refresh();
    } catch (err: any) {
      toast.error(err.message || 'Create failed');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (doc: DataroomDoc) => {
    if (!confirm(`Delete "${doc.title}"?`)) return;
    const { error: stErr } = await supabase.storage.from(BUCKET).remove([doc.file_path]);
    if (stErr) { toast.error(stErr.message); return; }
    const { error } = await supabase.from('documents').delete().eq('id', doc.id);
    if (error) { toast.error(error.message); return; }
    toast.success('Deleted');
    refresh();
  };

  const handleShare = async (doc: DataroomDoc) => {
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(doc.file_path, 60 * 60 * 24 * 7);
    if (error || !data?.signedUrl) { toast.error(error?.message || 'Could not create link'); return; }
    try {
      await navigator.clipboard.writeText(data.signedUrl);
      toast.success('Share link copied (valid 7 days)');
    } catch {
      window.prompt('Copy share link:', data.signedUrl);
    }
  };

  const handleDownload = async (doc: DataroomDoc) => {
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(doc.file_path, 60 * 5);
    if (error || !data?.signedUrl) { toast.error(error?.message || 'Could not get file'); return; }
    window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
  };

  const filtered = docs.filter(d => d.title.toLowerCase().includes(filter.toLowerCase()));

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-24">
          <Skeleton className="h-8 w-64 bg-primary/10 mb-4" />
          <Skeleton className="h-64 w-full bg-primary/10" />
        </main>
        <Footer />
      </div>
    );
  }
  if (!user) return null;

  if (!allowed) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-24 text-center">
          <div className="w-24 h-24 mx-auto mb-8 rounded-full bg-destructive/10 flex items-center justify-center">
            <Lock className="text-destructive w-12 h-12" />
          </div>
          <h1 className="font-display text-3xl text-destructive mb-4">Dataroom Restricted</h1>
          <p className="text-muted-foreground">Access is limited to <span className="text-primary font-mono">@goldarrow.io</span> accounts.</p>
          <p className="text-xs text-muted-foreground/60 mt-2">Signed in as {user.email}</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <div className="bg-gradient-to-r from-background via-card to-background border-b-2 border-primary/30 py-8">
          <div className="container mx-auto px-4 flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
              <FileText className="text-primary w-7 h-7" />
            </div>
            <div className="flex-1">
              <h1 className="font-display text-3xl text-primary tracking-wide">DATAROOM</h1>
              <p className="text-primary/60 font-display text-sm tracking-[0.15em] uppercase">Gold Arrow Internal · {user.email}</p>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8 space-y-8">
          {/* Upload + Create row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-6 border border-primary/20 bg-card/40 rounded-lg space-y-4">
              <div className="flex items-center gap-3">
                <Upload className="text-primary w-5 h-5" />
                <h2 className="font-display text-lg text-primary tracking-wide">UPLOAD DOCUMENTS</h2>
              </div>
              <Input
                ref={fileRef}
                type="file"
                multiple
                onChange={handleUploadInput}
                disabled={uploading}
              />
              {uploading && (
                <div className="flex items-center gap-2 text-sm text-primary/70">
                  <Loader2 className="w-4 h-4 animate-spin" /> Uploading…
                </div>
              )}
              <p className="text-xs text-muted-foreground">Drag-select multiple files. Any type supported.</p>
            </div>

            <div className="p-6 border border-primary/20 bg-card/40 rounded-lg space-y-3">
              <div className="flex items-center gap-3">
                <FilePlus2 className="text-primary w-5 h-5" />
                <h2 className="font-display text-lg text-primary tracking-wide">CREATE TEXT FILE</h2>
              </div>
              <Input
                placeholder="filename.txt"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                maxLength={120}
              />
              <textarea
                value={newFileContent}
                onChange={(e) => setNewFileContent(e.target.value)}
                placeholder="File contents…"
                rows={4}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
              />
              <Button onClick={handleCreate} disabled={creating} className="bg-primary text-primary-foreground hover:bg-primary/90">
                {creating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FilePlus2 className="w-4 h-4 mr-2" />}
                Create file
              </Button>
            </div>
          </div>

          {/* List */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  placeholder="Search documents…"
                  className="pl-9"
                />
              </div>
              <span className="text-xs text-muted-foreground font-mono">{filtered.length} / {docs.length}</span>
            </div>

            {loading ? (
              <Skeleton className="h-32 w-full bg-primary/10" />
            ) : filtered.length === 0 ? (
              <div className="text-muted-foreground p-10 text-center border border-dashed border-primary/20 rounded-lg">
                {docs.length === 0 ? 'No documents yet. Upload or create your first file.' : 'No matches.'}
              </div>
            ) : (
              filtered.map((doc) => (
                <div key={doc.id} className="flex items-center gap-4 p-4 border border-primary/15 bg-card/30 rounded-lg hover:border-primary/30 transition-colors">
                  <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display text-foreground truncate">{doc.title}</h3>
                    <p className="text-xs text-muted-foreground/70 mt-1">
                      {formatBytes(doc.file_size)} · {doc.mime_type || 'file'} · {new Date(doc.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button size="sm" variant="outline" onClick={() => handleShare(doc)} title="Copy share link">
                      <Link2 className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDownload(doc)} title="Download">
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDelete(doc)} className="text-destructive border-destructive/30 hover:bg-destructive/10" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Dataroom;