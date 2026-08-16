import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Loader2, User, Wand2 } from 'lucide-react';
import Logo from '@/components/Logo';
import ThemeToggle from '@/components/ThemeToggle';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/toast';

export default function SignupPage() {
  const { signUp, signIn } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast('Password must be at least 6 characters', 'error');
      return;
    }
    setLoading(true);
    const { error } = await signUp(email, password);
    if (error) {
      setLoading(false);
      toast(error, 'error');
      return;
    }
    // Auto sign-in since email confirmation is off
    const signInRes = await signIn(email, password);
    setLoading(false);
    if (signInRes.error) {
      toast('Account created! Please log in.', 'success');
      navigate('/login');
    } else {
      toast('Welcome to PhotoForge AI!', 'success');
      navigate('/dashboard');
    }
  };

  return (
    <div className="relative grid min-h-screen lg:grid-cols-2">
      {/* Left form panel */}
      <div className="relative flex items-center justify-center bg-slate-50 px-6 py-12 dark:bg-slate-950">
        <div className="absolute left-6 top-6"><ThemeToggle /></div>
        <div className="w-full max-w-sm animate-fade-up">
          <div className="mb-8 lg:hidden"><Logo /></div>
          <h1 className="font-display text-3xl font-bold text-slate-900 dark:text-white">Create your account</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">Start editing in seconds — it's free.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-11 pr-4 text-slate-900 outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-white/10 dark:bg-white/5 dark:text-white"
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-11 pr-4 text-slate-900 outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-white/10 dark:bg-white/5 dark:text-white"
                />
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-60">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Create Account <ArrowRight className="h-5 w-5" /></>}
            </button>
          </form>

          <div className="my-6 flex items-center gap-3 text-xs text-slate-400">
            <div className="h-px flex-1 bg-slate-200 dark:bg-white/10" /> OR <div className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
          </div>
          <button
            onClick={() => toast('Google sign-in requires a paid plan. Use email/password for now.', 'info')}
            className="btn-ghost w-full"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Continue with Google
          </button>

          <p className="mt-8 text-center text-sm text-slate-600 dark:text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-brand-600 hover:underline dark:text-brand-400">Log in</Link>
          </p>
        </div>
      </div>

      {/* Right brand panel */}
      <div className="relative hidden overflow-hidden bg-slate-950 lg:block">
        <div className="absolute inset-0">
          <div className="absolute -top-20 right-10 h-96 w-96 rounded-full bg-accent-500/30 blur-[120px] animate-pulse-glow" />
          <div className="absolute bottom-10 left-0 h-96 w-96 rounded-full bg-brand-500/30 blur-[120px] animate-pulse-glow" />
        </div>
        <div className="relative flex h-full flex-col justify-between p-12">
          <div className="flex justify-end"><Logo /></div>
          <div className="animate-fade-up">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-accent-400">
              <Wand2 className="h-4 w-4" /> Join the community
            </div>
            <h2 className="font-display text-4xl font-bold leading-tight text-white">
              Your creative<br />superpower.
            </h2>
            <p className="mt-4 max-w-sm text-slate-400">
              Create an account to save projects, access AI tools, and pick up right where you left off.
            </p>
          </div>
          <div className="flex gap-8 text-sm text-slate-400">
            <div className="flex items-center gap-2"><User className="h-5 w-5 text-brand-400" /> Free forever</div>
            <div className="flex items-center gap-2"><Wand2 className="h-5 w-5 text-accent-400" /> No credit card</div>
          </div>
        </div>
      </div>
    </div>
  );
}
