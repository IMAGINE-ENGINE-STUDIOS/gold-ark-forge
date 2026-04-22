import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useSuperAdminRole } from '@/hooks/useAdminRole';
import { useAuth } from '@/hooks/useAuth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { ShieldCheck, Lock, FileText, Users } from 'lucide-react';
import DocumentUploader from '@/components/super-admin/DocumentUploader';
import DocumentList from '@/components/super-admin/DocumentList';
import RoleManager from '@/components/super-admin/RoleManager';

const SuperAdmin = () => {
  const { user, loading: authLoading } = useAuth();
  const { data: isSuperAdmin, isLoading: roleLoading } = useSuperAdminRole();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) navigate('/login');
  }, [authLoading, user, navigate]);

  if (authLoading || roleLoading) {
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

  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-24 text-center">
          <div className="w-24 h-24 mx-auto mb-8 rounded-full bg-destructive/10 flex items-center justify-center">
            <Lock className="text-destructive w-12 h-12" />
          </div>
          <h1 className="font-display text-3xl text-destructive mb-4">Super Admin Access Required</h1>
          <p className="text-muted-foreground">Your account does not have super admin privileges.</p>
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
              <ShieldCheck className="text-primary w-7 h-7" />
            </div>
            <div>
              <h1 className="font-display text-3xl text-primary tracking-wide">SUPER ADMIN</h1>
              <p className="text-primary/60 font-display text-sm tracking-[0.15em] uppercase">Platform Control Center</p>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <Tabs defaultValue="documents">
            <TabsList className="bg-card/50 border border-primary/20 mb-6">
              <TabsTrigger value="documents" className="font-display data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                <FileText size={16} className="mr-2" />Documents
              </TabsTrigger>
              <TabsTrigger value="roles" className="font-display data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                <Users size={16} className="mr-2" />Roles & Users
              </TabsTrigger>
            </TabsList>

            <TabsContent value="documents" className="space-y-6">
              <DocumentUploader />
              <div className="p-6 border border-primary/20 bg-card/40 rounded-lg">
                <h2 className="font-display text-xl text-primary mb-4">All Documents</h2>
                <DocumentList />
              </div>
            </TabsContent>

            <TabsContent value="roles">
              <div className="p-6 border border-primary/20 bg-card/40 rounded-lg">
                <RoleManager />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SuperAdmin;