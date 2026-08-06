import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

const BUCKET = 'documents'

const sanitize = (s: string) => s.replace(/[^a-zA-Z0-9._\- ]/g, '_').slice(0, 160).trim()
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60)

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const password = Deno.env.get('DATAROOM_PASSWORD')
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const body = await req.json().catch(() => ({})) as Record<string, any>
    const { action, pass } = body

    if (!action) return json({ error: 'Missing action' }, 400)
    if (!password) return json({ error: 'Data room password not configured' }, 500)
    if (typeof pass !== 'string' || pass !== password) {
      return json({ error: 'Invalid access code' }, 401)
    }

    const log = async (a: string, target: string) => {
      await supabase.from('investor_activity').insert({ action: a, target, actor: 'data-room' })
    }

    switch (action) {
      case 'verify':
        return json({ ok: true })

      case 'list': {
        const [folders, docs, activity] = await Promise.all([
          supabase.from('investor_folders').select('*').order('name'),
          supabase
            .from('documents')
            .select('id,title,description,folder_path,file_path,file_size,mime_type,created_at')
            .eq('category', 'dataroom')
            .order('created_at', { ascending: false }),
          supabase.from('investor_activity').select('*').order('created_at', { ascending: false }).limit(25),
        ])
        if (folders.error) return json({ error: folders.error.message }, 500)
        if (docs.error) return json({ error: docs.error.message }, 500)
        return json({
          folders: folders.data ?? [],
          documents: docs.data ?? [],
          activity: activity.data ?? [],
        })
      }

      case 'create_folder': {
        const name = sanitize(String(body.name ?? ''))
        const parent = String(body.parent_path ?? '/')
        if (!name) return json({ error: 'Folder name required' }, 400)
        const path = `${parent === '/' ? '' : parent}/${slug(name)}`
        const { error } = await supabase
          .from('investor_folders')
          .insert({ name, path, parent_path: parent, description: body.description ?? null })
        if (error) return json({ error: error.message }, 500)
        await log('folder_created', path)
        return json({ ok: true, path })
      }

      case 'delete_folder': {
        const path = String(body.path ?? '')
        if (!path || path === '/') return json({ error: 'Invalid folder' }, 400)
        const { data: docs } = await supabase
          .from('documents')
          .select('id,file_path')
          .eq('category', 'dataroom')
          .like('folder_path', `${path}%`)
        if (docs?.length) {
          await supabase.storage.from(BUCKET).remove(docs.map((d) => d.file_path))
          await supabase.from('documents').delete().in('id', docs.map((d) => d.id))
        }
        const { error } = await supabase
          .from('investor_folders')
          .delete()
          .or(`path.eq.${path},parent_path.eq.${path}`)
        if (error) return json({ error: error.message }, 500)
        await log('folder_deleted', path)
        return json({ ok: true })
      }

      case 'upload_url': {
        const filename = sanitize(String(body.filename ?? ''))
        if (!filename) return json({ error: 'Filename required' }, 400)
        const objectPath = `dataroom/${Date.now()}_${filename}`
        const { data, error } = await supabase.storage.from(BUCKET).createSignedUploadUrl(objectPath)
        if (error) return json({ error: error.message }, 500)
        return json({ signedUrl: data.signedUrl, token: data.token, path: objectPath })
      }

      case 'confirm_upload': {
        const title = sanitize(String(body.title ?? 'Untitled'))
        const { error } = await supabase.from('documents').insert({
          title,
          description: body.description ?? null,
          category: 'dataroom',
          visibility: 'admin',
          folder_path: String(body.folder_path ?? '/'),
          file_path: String(body.file_path ?? ''),
          file_size: body.file_size ?? null,
          mime_type: body.mime_type ?? null,
        })
        if (error) return json({ error: error.message }, 500)
        await log('document_uploaded', title)
        return json({ ok: true })
      }

      case 'download_url': {
        const { data: doc } = await supabase
          .from('documents')
          .select('file_path,title')
          .eq('id', String(body.id ?? ''))
          .maybeSingle()
        if (!doc) return json({ error: 'Document not found' }, 404)
        const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(doc.file_path, 300)
        if (error) return json({ error: error.message }, 500)
        await log('document_viewed', doc.title)
        return json({ url: data.signedUrl })
      }

      case 'delete_document': {
        const { data: doc } = await supabase
          .from('documents')
          .select('file_path,title')
          .eq('id', String(body.id ?? ''))
          .maybeSingle()
        if (!doc) return json({ error: 'Document not found' }, 404)
        await supabase.storage.from(BUCKET).remove([doc.file_path])
        const { error } = await supabase.from('documents').delete().eq('id', String(body.id))
        if (error) return json({ error: error.message }, 500)
        await log('document_deleted', doc.title)
        return json({ ok: true })
      }

      case 'move_document': {
        const { error } = await supabase
          .from('documents')
          .update({ folder_path: String(body.folder_path ?? '/') })
          .eq('id', String(body.id ?? ''))
        if (error) return json({ error: error.message }, 500)
        return json({ ok: true })
      }

      default:
        return json({ error: `Unknown action: ${action}` }, 400)
    }
  } catch (e) {
    return json({ error: (e as Error).message }, 500)
  }
})
