import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DocumentRow {
  id: string;
  title: string;
  description: string | null;
  category: string;
  file_path: string;
  file_size: number | null;
  mime_type: string | null;
  visibility: 'public' | 'admin';
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
}

export const useDocuments = () =>
  useQuery({
    queryKey: ['documents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as DocumentRow[];
    },
  });

interface UploadInput {
  file: File;
  title: string;
  description: string;
  category: string;
  visibility: 'public' | 'admin';
}

export const useUploadDocument = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: UploadInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const folder = input.visibility === 'public' ? 'public' : 'admin';
      const cleanName = input.file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const filePath = `${folder}/${Date.now()}_${cleanName}`;

      const { error: upErr } = await supabase.storage
        .from('documents')
        .upload(filePath, input.file, {
          contentType: input.file.type,
          upsert: false,
        });
      if (upErr) throw upErr;

      const { error: insErr } = await supabase.from('documents').insert({
        title: input.title,
        description: input.description || null,
        category: input.category,
        file_path: filePath,
        file_size: input.file.size,
        mime_type: input.file.type,
        visibility: input.visibility,
        uploaded_by: user.id,
      });
      if (insErr) throw insErr;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['documents'] }),
  });
};

export const useDeleteDocument = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (doc: DocumentRow) => {
      await supabase.storage.from('documents').remove([doc.file_path]);
      const { error } = await supabase.from('documents').delete().eq('id', doc.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['documents'] }),
  });
};

export const useRenameDocument = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, title }: { id: string; title: string }) => {
      const trimmed = title.trim();
      if (!trimmed) throw new Error('Title cannot be empty');
      const { error } = await supabase
        .from('documents')
        .update({ title: trimmed })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['documents'] }),
  });
};

export const getDocumentUrl = async (doc: DocumentRow): Promise<string | null> => {
  if (doc.visibility === 'public') {
    const { data } = supabase.storage.from('documents').getPublicUrl(doc.file_path);
    return data.publicUrl;
  }
  const { data, error } = await supabase.storage
    .from('documents')
    .createSignedUrl(doc.file_path, 60 * 60);
  if (error) return null;
  return data.signedUrl;
};