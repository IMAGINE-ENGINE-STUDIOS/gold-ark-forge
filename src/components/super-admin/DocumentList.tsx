import { useState } from 'react';
import { useDocuments, useDeleteDocument, useRenameDocument, getDocumentUrl, DocumentRow } from '@/hooks/useDocuments';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Trash2, Globe, Lock, Loader2, Pencil, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { useSuperAdminRole, useAdminRole } from '@/hooks/useAdminRole';

const formatBytes = (bytes: number | null) => {
  if (!bytes) return '—';
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0; let n = bytes;
  while (n >= 1024 && i < units.length - 1) { n /= 1024; i++; }
  return `${n.toFixed(1)} ${units[i]}`;
};

const DocumentList = () => {
  const { data: docs, isLoading } = useDocuments();
  const del = useDeleteDocument();
  const rename = useRenameDocument();
  const { data: isSuperAdmin } = useSuperAdminRole();
  const { data: isAdmin } = useAdminRole();
  const canRename = isAdmin || isSuperAdmin;
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const handleDownload = async (doc: DocumentRow) => {
    const url = await getDocumentUrl(doc);
    if (!url) { toast.error('Could not generate download link'); return; }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleDelete = async (doc: DocumentRow) => {
    if (!confirm(`Delete "${doc.title}"? This cannot be undone.`)) return;
    try {
      await del.mutateAsync(doc);
      toast.success('Document deleted');
    } catch (err: any) {
      toast.error(err.message || 'Delete failed');
    }
  };

  const startEdit = (doc: DocumentRow) => {
    setEditingId(doc.id);
    setEditValue(doc.title);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValue('');
  };

  const saveEdit = async (doc: DocumentRow) => {
    if (!editValue.trim() || editValue.trim() === doc.title) {
      cancelEdit();
      return;
    }
    try {
      await rename.mutateAsync({ id: doc.id, title: editValue });
      toast.success('Document renamed');
      cancelEdit();
    } catch (err: any) {
      toast.error(err.message || 'Rename failed');
    }
  };

  if (isLoading) return <div className="text-muted-foreground p-6">Loading documents…</div>;
  if (!docs?.length) return <div className="text-muted-foreground p-6 text-center border border-dashed border-primary/20 rounded-lg">No documents uploaded yet.</div>;

  return (
    <div className="space-y-3">
      {docs.map((doc) => (
        <div key={doc.id} className="flex items-center gap-4 p-4 border border-primary/15 bg-card/30 rounded-lg hover:border-primary/30 transition-colors">
          <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {editingId === doc.id ? (
                <div className="flex items-center gap-1 flex-1 min-w-0">
                  <Input
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    maxLength={200}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveEdit(doc);
                      if (e.key === 'Escape') cancelEdit();
                    }}
                    className="h-7 text-sm font-display"
                  />
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-primary" onClick={() => saveEdit(doc)} disabled={rename.isPending}>
                    {rename.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-muted-foreground" onClick={cancelEdit}>
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ) : (
                <h3 className="font-display text-foreground truncate">{doc.title}</h3>
              )}
              <Badge variant="outline" className="capitalize text-xs border-primary/30 text-primary/80">{doc.category}</Badge>
              <Badge variant={doc.visibility === 'public' ? 'default' : 'secondary'} className="text-xs">
                {doc.visibility === 'public' ? <><Globe className="w-3 h-3 mr-1" />Public</> : <><Lock className="w-3 h-3 mr-1" />Admin</>}
              </Badge>
            </div>
            {doc.description && <p className="text-sm text-muted-foreground truncate mt-1">{doc.description}</p>}
            <p className="text-xs text-muted-foreground/70 mt-1">{formatBytes(doc.file_size)} • {new Date(doc.created_at).toLocaleString()}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {canRename && editingId !== doc.id && (
              <Button size="sm" variant="outline" onClick={() => startEdit(doc)} title="Rename">
                <Pencil className="w-4 h-4" />
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={() => handleDownload(doc)}>
              <Download className="w-4 h-4" />
            </Button>
            {isSuperAdmin && (
              <Button size="sm" variant="outline" onClick={() => handleDelete(doc)} disabled={del.isPending} className="text-destructive border-destructive/30 hover:bg-destructive/10">
                {del.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default DocumentList;