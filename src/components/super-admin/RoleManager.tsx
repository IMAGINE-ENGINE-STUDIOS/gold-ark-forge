import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, ShieldCheck, User as UserIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';

type AppRole = 'user' | 'admin' | 'super_admin';

interface RoleRow {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

const useAllRoles = () =>
  useQuery({
    queryKey: ['all-roles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('id, user_id, role, created_at')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as RoleRow[];
    },
  });

const RoleManager = () => {
  const { data: roles, isLoading } = useAllRoles();
  const qc = useQueryClient();
  const [pendingUserId, setPendingUserId] = useState('');
  const [pendingRole, setPendingRole] = useState<AppRole>('admin');

  const grant = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { error } = await supabase.from('user_roles').insert({ user_id: userId, role });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['all-roles'] });
      toast.success('Role granted');
    },
    onError: (e: any) => toast.error(e.message || 'Failed to grant role'),
  });

  const revoke = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('user_roles').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['all-roles'] });
      toast.success('Role revoked');
    },
    onError: (e: any) => toast.error(e.message || 'Failed to revoke role'),
  });

  const grouped = (roles ?? []).reduce<Record<string, RoleRow[]>>((acc, r) => {
    (acc[r.user_id] ||= []).push(r); return acc;
  }, {});

  const handleGrant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingUserId.trim()) { toast.error('User ID required'); return; }
    grant.mutate({ userId: pendingUserId.trim(), role: pendingRole });
    setPendingUserId('');
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleGrant} className="p-5 border border-primary/20 bg-card/40 rounded-lg space-y-3">
        <h3 className="font-display text-primary">Grant Role</h3>
        <p className="text-xs text-muted-foreground">Paste a user's UUID (from their profile) and assign a role.</p>
        <div className="flex gap-2 flex-wrap">
          <input
            value={pendingUserId}
            onChange={(e) => setPendingUserId(e.target.value)}
            placeholder="User UUID"
            className="flex-1 min-w-[260px] px-3 py-2 bg-background border border-input rounded-md text-sm"
          />
          <Select value={pendingRole} onValueChange={(v) => setPendingRole(v as AppRole)}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="super_admin">Super Admin</SelectItem>
            </SelectContent>
          </Select>
          <Button type="submit" disabled={grant.isPending} className="bg-primary text-primary-foreground hover:bg-primary/90">
            {grant.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Grant'}
          </Button>
        </div>
      </form>

      <div>
        <h3 className="font-display text-primary mb-3">Existing Role Assignments</h3>
        {isLoading ? (
          <div className="text-muted-foreground">Loading…</div>
        ) : !roles?.length ? (
          <div className="text-muted-foreground p-6 text-center border border-dashed border-primary/20 rounded-lg">No role assignments.</div>
        ) : (
          <div className="space-y-3">
            {Object.entries(grouped).map(([userId, userRoles]) => (
              <div key={userId} className="p-4 border border-primary/15 bg-card/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <UserIcon className="w-4 h-4 text-muted-foreground" />
                  <code className="text-xs text-muted-foreground break-all">{userId}</code>
                </div>
                <div className="flex flex-wrap gap-2">
                  {userRoles.map((r) => (
                    <Badge key={r.id} variant="outline" className="border-primary/30 text-primary/90 flex items-center gap-2 py-1 pr-1">
                      {r.role === 'super_admin' ? <ShieldCheck className="w-3 h-3" /> : r.role === 'admin' ? <Shield className="w-3 h-3" /> : <UserIcon className="w-3 h-3" />}
                      <span className="capitalize">{r.role.replace('_', ' ')}</span>
                      <button
                        onClick={() => { if (confirm(`Revoke ${r.role} for this user?`)) revoke.mutate(r.id); }}
                        className="ml-1 px-1.5 text-destructive hover:bg-destructive/10 rounded"
                        type="button"
                      >×</button>
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RoleManager;