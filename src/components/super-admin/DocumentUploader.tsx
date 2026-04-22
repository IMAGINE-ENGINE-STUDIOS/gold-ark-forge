import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Loader2 } from 'lucide-react';
import { useUploadDocument } from '@/hooks/useDocuments';
import { toast } from 'sonner';

const CATEGORIES = ['general', 'legal', 'investor', 'marketing', 'technical', 'compliance'];

const DocumentUploader = () => {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('general');
  const [visibility, setVisibility] = useState<'public' | 'admin'>('admin');

  const upload = useUploadDocument();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title.trim()) {
      toast.error('Title and file are required');
      return;
    }
    try {
      await upload.mutateAsync({ file, title: title.trim(), description: description.trim(), category, visibility });
      toast.success('Document uploaded');
      setFile(null); setTitle(''); setDescription(''); setCategory('general'); setVisibility('admin');
      (document.getElementById('doc-file-input') as HTMLInputElement | null)?.value && ((document.getElementById('doc-file-input') as HTMLInputElement).value = '');
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 p-6 border border-primary/20 bg-card/40 rounded-lg">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Upload className="text-primary w-5 h-5" />
        </div>
        <h2 className="font-display text-xl text-primary tracking-wide">Upload New Document</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="doc-title">Title *</Label>
          <Input id="doc-title" value={title} maxLength={200} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Q1 2026 Investor Report" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="doc-category">Category</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger id="doc-category"><SelectValue /></SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="doc-desc">Description</Label>
        <Textarea id="doc-desc" value={description} maxLength={1000} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description" rows={3} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="doc-visibility">Visibility</Label>
          <Select value={visibility} onValueChange={(v) => setVisibility(v as 'public' | 'admin')}>
            <SelectTrigger id="doc-visibility"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="public">Public — anyone can view</SelectItem>
              <SelectItem value="admin">Admin only — internal</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="doc-file-input">File *</Label>
          <Input id="doc-file-input" type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} required />
        </div>
      </div>

      <Button type="submit" disabled={upload.isPending} className="bg-primary text-primary-foreground hover:bg-primary/90">
        {upload.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
        Upload Document
      </Button>
    </form>
  );
};

export default DocumentUploader;