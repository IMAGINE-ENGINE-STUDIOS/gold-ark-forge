import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useAdminRole } from '@/hooks/useAdminRole';
import { useWallet } from '@/contexts/WalletContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Lock, Shield, Plus, Trash2, Save, Coins, Building2, FileText, Hash } from 'lucide-react';

interface SwapAsset {
  id: string;
  symbol_key: string;
  ticker: string;
  label: string;
  category: string;
  sub_category: string | null;
  company_name: string;
  company_legal_name: string | null;
  company_website: string | null;
  company_logo_url: string | null;
  company_description: string | null;
  company_country: string | null;
  company_industry: string | null;
  company_founded_year: number | null;
  company_ceo: string | null;
  company_headquarters: string | null;
  company_employees: number | null;
  company_email: string | null;
  company_phone: string | null;
  asset_type: string;
  base_currency: string;
  initial_price: number;
  total_supply: number | null;
  circulating_supply: number | null;
  market_cap: number | null;
  isin: string | null;
  cusip: string | null;
  contract_address: string | null;
  blockchain: string | null;
  jurisdiction: string | null;
  regulatory_status: string | null;
  whitepaper_url: string | null;
  prospectus_url: string | null;
  status: string;
  is_listed: boolean;
  created_at: string;
}

const EMPTY_FORM = {
  symbol_key: '',
  ticker: '',
  label: '',
  category: 'equity',
  sub_category: '',
  company_name: '',
  company_legal_name: '',
  company_website: '',
  company_logo_url: '',
  company_description: '',
  company_country: '',
  company_industry: '',
  company_founded_year: '' as string | number,
  company_ceo: '',
  company_headquarters: '',
  company_employees: '' as string | number,
  company_email: '',
  company_phone: '',
  asset_type: 'equity',
  base_currency: 'USD',
  initial_price: 0,
  total_supply: '' as string | number,
  circulating_supply: '' as string | number,
  market_cap: '' as string | number,
  isin: '',
  cusip: '',
  contract_address: '',
  blockchain: '',
  jurisdiction: '',
  regulatory_status: '',
  whitepaper_url: '',
  prospectus_url: '',
  status: 'draft',
  is_listed: false,
};

const CATEGORIES = ['metals', 'crypto', 'equity', 'energy', 'forex', 'bonds', 'commodities', 'realestate', 'custom'];
const ASSET_TYPES = ['equity', 'token', 'commodity', 'fund', 'note', 'derivative', 'other'];

const SwapAssetAdmin = () => {
  const { isConnected } = useWallet();
  const { data: isAdmin, isLoading: roleLoading } = useAdminRole();
  const navigate = useNavigate();

  const [assets, setAssets] = useState<SwapAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<typeof EMPTY_FORM>(EMPTY_FORM);

  useEffect(() => {
    if (!roleLoading && !isAdmin && isConnected) navigate('/vault');
  }, [roleLoading, isAdmin, isConnected, navigate]);

  const loadAssets = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('swap_custom_assets')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) toast.error(error.message);
    else setAssets((data || []) as SwapAsset[]);
    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) loadAssets();
  }, [isAdmin]);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
  };

  const editAsset = (a: SwapAsset) => {
    setEditingId(a.id);
    setForm({
      symbol_key: a.symbol_key,
      ticker: a.ticker,
      label: a.label,
      category: a.category,
      sub_category: a.sub_category ?? '',
      company_name: a.company_name,
      company_legal_name: a.company_legal_name ?? '',
      company_website: a.company_website ?? '',
      company_logo_url: a.company_logo_url ?? '',
      company_description: a.company_description ?? '',
      company_country: a.company_country ?? '',
      company_industry: a.company_industry ?? '',
      company_founded_year: a.company_founded_year ?? '',
      company_ceo: a.company_ceo ?? '',
      company_headquarters: a.company_headquarters ?? '',
      company_employees: a.company_employees ?? '',
      company_email: a.company_email ?? '',
      company_phone: a.company_phone ?? '',
      asset_type: a.asset_type,
      base_currency: a.base_currency,
      initial_price: Number(a.initial_price) || 0,
      total_supply: a.total_supply ?? '',
      circulating_supply: a.circulating_supply ?? '',
      market_cap: a.market_cap ?? '',
      isin: a.isin ?? '',
      cusip: a.cusip ?? '',
      contract_address: a.contract_address ?? '',
      blockchain: a.blockchain ?? '',
      jurisdiction: a.jurisdiction ?? '',
      regulatory_status: a.regulatory_status ?? '',
      whitepaper_url: a.whitepaper_url ?? '',
      prospectus_url: a.prospectus_url ?? '',
      status: a.status,
      is_listed: a.is_listed,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const numOrNull = (v: string | number) => {
    if (v === '' || v === null || v === undefined) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };

  const handleSave = async () => {
    if (!form.symbol_key.trim() || !form.ticker.trim() || !form.label.trim() || !form.company_name.trim()) {
      toast.error('Symbol key, ticker, label, and company name are required.');
      return;
    }
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    const payload = {
      symbol_key: form.symbol_key.trim().toLowerCase(),
      ticker: form.ticker.trim().toUpperCase(),
      label: form.label.trim(),
      category: form.category,
      sub_category: form.sub_category || null,
      company_name: form.company_name.trim(),
      company_legal_name: form.company_legal_name || null,
      company_website: form.company_website || null,
      company_logo_url: form.company_logo_url || null,
      company_description: form.company_description || null,
      company_country: form.company_country || null,
      company_industry: form.company_industry || null,
      company_founded_year: numOrNull(form.company_founded_year),
      company_ceo: form.company_ceo || null,
      company_headquarters: form.company_headquarters || null,
      company_employees: numOrNull(form.company_employees),
      company_email: form.company_email || null,
      company_phone: form.company_phone || null,
      asset_type: form.asset_type,
      base_currency: form.base_currency,
      initial_price: Number(form.initial_price) || 0,
      total_supply: numOrNull(form.total_supply),
      circulating_supply: numOrNull(form.circulating_supply),
      market_cap: numOrNull(form.market_cap),
      isin: form.isin || null,
      cusip: form.cusip || null,
      contract_address: form.contract_address || null,
      blockchain: form.blockchain || null,
      jurisdiction: form.jurisdiction || null,
      regulatory_status: form.regulatory_status || null,
      whitepaper_url: form.whitepaper_url || null,
      prospectus_url: form.prospectus_url || null,
      status: form.status,
      is_listed: form.is_listed,
      created_by: user?.id ?? null,
    };

    const { error } = editingId
      ? await supabase.from('swap_custom_assets').update(payload).eq('id', editingId)
      : await supabase.from('swap_custom_assets').insert(payload);

    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(editingId ? 'Asset updated' : 'Asset created');
    resetForm();
    loadAssets();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this asset? This cannot be undone.')) return;
    const { error } = await supabase.from('swap_custom_assets').delete().eq('id', id);
    if (error) return toast.error(error.message);
    toast.success('Asset deleted');
    loadAssets();
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-navy">
        <Header />
        <main className="container mx-auto px-4 py-24 text-center">
          <div className="w-24 h-24 mx-auto mb-8 rounded-full bg-gold/10 flex items-center justify-center">
            <Lock className="text-gold w-12 h-12" />
          </div>
          <h1 className="font-display text-3xl text-gold mb-4">Admin Access Required</h1>
          <p className="text-marble/60">Connect your wallet to manage SWAP assets.</p>
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
          <Skeleton className="h-64 w-full bg-gold/10" />
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
          <Shield className="text-red-400 w-12 h-12 mx-auto mb-4" />
          <h1 className="font-display text-3xl text-red-400">Access Denied</h1>
        </main>
        <Footer />
      </div>
    );
  }

  const Section = ({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) => (
    <div className="border border-gold/20 bg-navy-light/30 p-5 mb-4">
      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gold/15">
        <Icon className="w-4 h-4 text-gold" />
        <h3 className="font-display text-sm tracking-[0.2em] text-gold uppercase">{title}</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{children}</div>
    </div>
  );

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="space-y-1">
      <Label className="text-[10px] tracking-[0.15em] uppercase text-marble/60">{label}</Label>
      {children}
    </div>
  );

  const inputCls = 'bg-navy border-gold/20 text-marble text-xs h-9';

  return (
    <div className="min-h-screen bg-navy">
      <Header />
      <main>
        <div className="bg-gradient-to-r from-navy-dark via-navy to-navy-dark border-b-2 border-gold/30 py-8">
          <div className="container mx-auto px-4 flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gold/10 flex items-center justify-center">
              <Coins className="text-gold w-7 h-7" />
            </div>
            <div>
              <h1 className="font-display text-3xl text-gold tracking-wide">SWAP ASSET FORGE</h1>
              <p className="text-gold/60 font-display text-sm tracking-[0.15em] uppercase">
                Create and manage tradable assets
              </p>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
          {/* FORM */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg text-gold tracking-[0.2em] uppercase">
                {editingId ? 'Edit Asset' : 'New Asset'}
              </h2>
              {editingId && (
                <Button variant="outline" size="sm" onClick={resetForm} className="border-gold/30 text-gold text-xs">
                  <Plus className="w-3 h-3 mr-1" /> New
                </Button>
              )}
            </div>

            <Section icon={Hash} title="Identity">
              <Field label="Symbol Key (unique)">
                <Input className={inputCls} value={form.symbol_key} onChange={(e) => setForm({ ...form, symbol_key: e.target.value })} placeholder="acme-corp" />
              </Field>
              <Field label="Ticker">
                <Input className={inputCls} value={form.ticker} onChange={(e) => setForm({ ...form, ticker: e.target.value })} placeholder="ACME" />
              </Field>
              <Field label="Display Label">
                <Input className={inputCls} value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="ACME / USD" />
              </Field>
              <Field label="Category">
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-navy border-gold/30 text-marble">
                    {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Sub-Category"><Input className={inputCls} value={form.sub_category} onChange={(e) => setForm({ ...form, sub_category: e.target.value })} /></Field>
              <Field label="Asset Type">
                <Select value={form.asset_type} onValueChange={(v) => setForm({ ...form, asset_type: v })}>
                  <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-navy border-gold/30 text-marble">
                    {ASSET_TYPES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
            </Section>

            <Section icon={Building2} title="Company / Issuer">
              <Field label="Company Name *"><Input className={inputCls} value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} /></Field>
              <Field label="Legal Name"><Input className={inputCls} value={form.company_legal_name} onChange={(e) => setForm({ ...form, company_legal_name: e.target.value })} /></Field>
              <Field label="Website"><Input className={inputCls} value={form.company_website} onChange={(e) => setForm({ ...form, company_website: e.target.value })} placeholder="https://..." /></Field>
              <Field label="Logo URL"><Input className={inputCls} value={form.company_logo_url} onChange={(e) => setForm({ ...form, company_logo_url: e.target.value })} /></Field>
              <Field label="Country"><Input className={inputCls} value={form.company_country} onChange={(e) => setForm({ ...form, company_country: e.target.value })} /></Field>
              <Field label="Industry"><Input className={inputCls} value={form.company_industry} onChange={(e) => setForm({ ...form, company_industry: e.target.value })} /></Field>
              <Field label="Founded Year"><Input type="number" className={inputCls} value={form.company_founded_year} onChange={(e) => setForm({ ...form, company_founded_year: e.target.value })} /></Field>
              <Field label="CEO"><Input className={inputCls} value={form.company_ceo} onChange={(e) => setForm({ ...form, company_ceo: e.target.value })} /></Field>
              <Field label="Headquarters"><Input className={inputCls} value={form.company_headquarters} onChange={(e) => setForm({ ...form, company_headquarters: e.target.value })} /></Field>
              <Field label="Employees"><Input type="number" className={inputCls} value={form.company_employees} onChange={(e) => setForm({ ...form, company_employees: e.target.value })} /></Field>
              <Field label="Email"><Input className={inputCls} value={form.company_email} onChange={(e) => setForm({ ...form, company_email: e.target.value })} /></Field>
              <Field label="Phone"><Input className={inputCls} value={form.company_phone} onChange={(e) => setForm({ ...form, company_phone: e.target.value })} /></Field>
              <div className="md:col-span-2">
                <Field label="Description">
                  <Textarea className="bg-navy border-gold/20 text-marble text-xs min-h-[80px]" value={form.company_description} onChange={(e) => setForm({ ...form, company_description: e.target.value })} />
                </Field>
              </div>
            </Section>

            <Section icon={Coins} title="Asset Specifications">
              <Field label="Base Currency"><Input className={inputCls} value={form.base_currency} onChange={(e) => setForm({ ...form, base_currency: e.target.value })} /></Field>
              <Field label="Initial Price"><Input type="number" step="0.0001" className={inputCls} value={form.initial_price} onChange={(e) => setForm({ ...form, initial_price: parseFloat(e.target.value) || 0 })} /></Field>
              <Field label="Total Supply"><Input type="number" className={inputCls} value={form.total_supply} onChange={(e) => setForm({ ...form, total_supply: e.target.value })} /></Field>
              <Field label="Circulating Supply"><Input type="number" className={inputCls} value={form.circulating_supply} onChange={(e) => setForm({ ...form, circulating_supply: e.target.value })} /></Field>
              <Field label="Market Cap"><Input type="number" className={inputCls} value={form.market_cap} onChange={(e) => setForm({ ...form, market_cap: e.target.value })} /></Field>
              <Field label="ISIN"><Input className={inputCls} value={form.isin} onChange={(e) => setForm({ ...form, isin: e.target.value })} /></Field>
              <Field label="CUSIP"><Input className={inputCls} value={form.cusip} onChange={(e) => setForm({ ...form, cusip: e.target.value })} /></Field>
              <Field label="Blockchain"><Input className={inputCls} value={form.blockchain} onChange={(e) => setForm({ ...form, blockchain: e.target.value })} placeholder="ethereum, solana, ..." /></Field>
              <div className="md:col-span-2">
                <Field label="Contract Address"><Input className={inputCls} value={form.contract_address} onChange={(e) => setForm({ ...form, contract_address: e.target.value })} /></Field>
              </div>
            </Section>

            <Section icon={FileText} title="Compliance & Documents">
              <Field label="Jurisdiction"><Input className={inputCls} value={form.jurisdiction} onChange={(e) => setForm({ ...form, jurisdiction: e.target.value })} /></Field>
              <Field label="Regulatory Status"><Input className={inputCls} value={form.regulatory_status} onChange={(e) => setForm({ ...form, regulatory_status: e.target.value })} /></Field>
              <Field label="Whitepaper URL"><Input className={inputCls} value={form.whitepaper_url} onChange={(e) => setForm({ ...form, whitepaper_url: e.target.value })} /></Field>
              <Field label="Prospectus URL"><Input className={inputCls} value={form.prospectus_url} onChange={(e) => setForm({ ...form, prospectus_url: e.target.value })} /></Field>
              <Field label="Status">
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-navy border-gold/30 text-marble">
                    <SelectItem value="draft">draft</SelectItem>
                    <SelectItem value="review">review</SelectItem>
                    <SelectItem value="active">active</SelectItem>
                    <SelectItem value="suspended">suspended</SelectItem>
                    <SelectItem value="delisted">delisted</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <div className="flex items-center gap-3 pt-5">
                <Switch checked={form.is_listed} onCheckedChange={(v) => setForm({ ...form, is_listed: v })} />
                <Label className="text-xs text-marble/80">Listed on SWAP (publicly visible)</Label>
              </div>
            </Section>

            <div className="flex gap-3 mt-6">
              <Button onClick={handleSave} disabled={saving} className="bg-gold hover:bg-gold/90 text-navy font-display tracking-[0.15em]">
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving…' : editingId ? 'Update Asset' : 'Create Asset'}
              </Button>
              {editingId && (
                <Button variant="outline" onClick={resetForm} className="border-gold/30 text-marble">Cancel</Button>
              )}
            </div>
          </div>

          {/* LIST */}
          <aside>
            <h2 className="font-display text-lg text-gold tracking-[0.2em] uppercase mb-4">Registry</h2>
            <div className="border border-gold/20 bg-navy-light/30 max-h-[80vh] overflow-y-auto">
              {loading ? (
                <div className="p-4 space-y-2">
                  <Skeleton className="h-12 w-full bg-gold/10" />
                  <Skeleton className="h-12 w-full bg-gold/10" />
                </div>
              ) : assets.length === 0 ? (
                <p className="p-6 text-xs text-marble/40 text-center">No custom assets yet.</p>
              ) : (
                assets.map((a) => (
                  <div key={a.id} className="p-3 border-b border-gold/10 hover:bg-gold/5 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <button onClick={() => editAsset(a)} className="text-left flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-display text-sm text-gold">{a.ticker}</span>
                          <span className="text-[10px] text-marble/40 uppercase">{a.category}</span>
                          {a.is_listed ? (
                            <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded">LIVE</span>
                          ) : (
                            <span className="text-[9px] bg-marble/10 text-marble/50 px-1.5 py-0.5 rounded">{a.status}</span>
                          )}
                        </div>
                        <div className="text-[11px] text-marble/70 mt-0.5">{a.label}</div>
                        <div className="text-[10px] text-marble/40">{a.company_name}</div>
                      </button>
                      <button onClick={() => handleDelete(a.id)} className="text-red-400/60 hover:text-red-400 p-1">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SwapAssetAdmin;