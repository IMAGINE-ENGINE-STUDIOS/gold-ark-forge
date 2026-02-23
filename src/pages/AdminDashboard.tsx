import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useAdminRole } from '@/hooks/useAdminRole';
import { useWallet } from '@/contexts/WalletContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Shield, Lock, LayoutDashboard, FileText, BarChart3, Key, Building2, MapPin, FileCheck } from 'lucide-react';
import AdminOverview from '@/components/admin/AdminOverview';
import AdminRegistries from '@/components/admin/AdminRegistries';
import AdminPerformance from '@/components/admin/AdminPerformance';
import AdminAPIKeys from '@/components/admin/AdminAPIKeys';
import PartnerList from '@/components/admin/PartnerList';
import SiteList from '@/components/admin/SiteList';
import CertificateActions from '@/components/admin/CertificateActions';

const AdminDashboard = () => {
  const { isConnected } = useWallet();
  const { data: isAdmin, isLoading: roleLoading } = useAdminRole();
  const navigate = useNavigate();

  useEffect(() => {
    if (!roleLoading && !isAdmin && isConnected) {
      navigate('/vault');
    }
  }, [roleLoading, isAdmin, isConnected, navigate]);

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-navy">
        <Header />
        <main className="container mx-auto px-4 py-24 text-center">
          <div className="w-24 h-24 mx-auto mb-8 rounded-full bg-gold/10 flex items-center justify-center">
            <Lock className="text-gold w-12 h-12" />
          </div>
          <h1 className="font-display text-3xl text-gold mb-4">Admin Access Required</h1>
          <p className="text-marble/60 mb-8">Connect your wallet to access the Admin Dashboard.</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (roleLoading) {
    return (
      <div className="min-h-screen bg-navy">
        <Header />
        <main className="container mx-auto px-4 py-24">
          <div className="space-y-4 max-w-xl mx-auto">
            <Skeleton className="h-8 w-64 bg-gold/10" />
            <Skeleton className="h-64 w-full bg-gold/10" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-navy">
        <Header />
        <main className="container mx-auto px-4 py-24 text-center">
          <div className="w-24 h-24 mx-auto mb-8 rounded-full bg-red-500/10 flex items-center justify-center">
            <Shield className="text-red-400 w-12 h-12" />
          </div>
          <h1 className="font-display text-3xl text-red-400 mb-4">Access Denied</h1>
          <p className="text-marble/60">Your account does not have admin privileges.</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy">
      <Header />
      <main>
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-navy-dark via-navy to-navy-dark border-b-2 border-gold/30 py-8">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-gold/10 flex items-center justify-center">
                <LayoutDashboard className="text-gold w-7 h-7" />
              </div>
              <div>
                <h1 className="font-display text-3xl text-gold tracking-wide">ADMIN DASHBOARD</h1>
                <p className="text-gold/60 font-display text-sm tracking-[0.15em] uppercase">Platform Command Center</p>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <Tabs defaultValue="overview">
            <TabsList className="bg-navy-light/50 border border-gold/20 mb-8 flex-wrap h-auto gap-1 p-1">
              <TabsTrigger value="overview" className="font-display text-xs data-[state=active]:bg-gold/20 data-[state=active]:text-gold text-marble/60">
                <LayoutDashboard size={14} className="mr-1.5" /> Overview
              </TabsTrigger>
              <TabsTrigger value="registries" className="font-display text-xs data-[state=active]:bg-gold/20 data-[state=active]:text-gold text-marble/60">
                <FileText size={14} className="mr-1.5" /> Registries
              </TabsTrigger>
              <TabsTrigger value="performance" className="font-display text-xs data-[state=active]:bg-gold/20 data-[state=active]:text-gold text-marble/60">
                <BarChart3 size={14} className="mr-1.5" /> Performance
              </TabsTrigger>
              <TabsTrigger value="api-keys" className="font-display text-xs data-[state=active]:bg-gold/20 data-[state=active]:text-gold text-marble/60">
                <Key size={14} className="mr-1.5" /> API Keys
              </TabsTrigger>
              <TabsTrigger value="partners" className="font-display text-xs data-[state=active]:bg-gold/20 data-[state=active]:text-gold text-marble/60">
                <Building2 size={14} className="mr-1.5" /> Partners
              </TabsTrigger>
              <TabsTrigger value="sites" className="font-display text-xs data-[state=active]:bg-gold/20 data-[state=active]:text-gold text-marble/60">
                <MapPin size={14} className="mr-1.5" /> Sites
              </TabsTrigger>
              <TabsTrigger value="certificates" className="font-display text-xs data-[state=active]:bg-gold/20 data-[state=active]:text-gold text-marble/60">
                <FileCheck size={14} className="mr-1.5" /> Certificates
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview"><AdminOverview /></TabsContent>
            <TabsContent value="registries"><AdminRegistries /></TabsContent>
            <TabsContent value="performance"><AdminPerformance /></TabsContent>
            <TabsContent value="api-keys"><AdminAPIKeys /></TabsContent>

            <TabsContent value="partners">
              <div className="bg-navy-light/30 border border-gold/20 p-6"><PartnerList /></div>
            </TabsContent>
            <TabsContent value="sites">
              <div className="bg-navy-light/30 border border-gold/20 p-6"><SiteList /></div>
            </TabsContent>
            <TabsContent value="certificates">
              <div className="bg-navy-light/30 border border-gold/20 p-6"><CertificateActions /></div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AdminDashboard;
