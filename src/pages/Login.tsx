import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Link, useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { LogIn, UserPlus, ArrowLeft } from 'lucide-react';

const Login = () => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'register') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast({
          title: '✅ Account Created',
          description: 'Check your email to verify your account before signing in.',
        });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast({ title: '✅ Signed In', description: 'Welcome back to Gold Arrow.' });
        navigate('/trading-bridge');
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Something went wrong',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Back to home */}
        <Link to="/" className="inline-flex items-center gap-1 text-gold/60 hover:text-gold text-sm font-display tracking-wider mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> GOLD ARROW
        </Link>

        <div className="bg-navy-dark border border-gold/20 rounded-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="font-display text-2xl tracking-[0.1em] text-gold mb-2">
              {mode === 'login' ? 'SIGN IN' : 'CREATE ACCOUNT'}
            </h1>
            <p className="text-marble/40 text-sm">
              {mode === 'login'
                ? 'Access your paper trading portfolio'
                : 'Start trading with $100k in virtual funds'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-[10px] font-display tracking-wider text-marble/40 mb-1 block">EMAIL</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="bg-navy border-gold/20 text-marble font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] font-display tracking-wider text-marble/40 mb-1 block">PASSWORD</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="bg-navy border-gold/20 text-marble font-mono"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gold hover:bg-gold-light text-navy font-display tracking-wider"
            >
              {loading ? 'Please wait...' : (
                <>
                  {mode === 'login' ? <LogIn className="w-4 h-4 mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />}
                  {mode === 'login' ? 'SIGN IN' : 'CREATE ACCOUNT'}
                </>
              )}
            </Button>
          </form>

          {/* Toggle mode */}
          <div className="mt-6 text-center">
            <button
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
              className="text-gold/60 hover:text-gold text-sm transition-colors"
            >
              {mode === 'login' ? "Don't have an account? Register" : 'Already have an account? Sign In'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
