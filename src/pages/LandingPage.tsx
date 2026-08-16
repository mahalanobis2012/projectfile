import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Wand2,
  Crop,
  RotateCw,
  Sun,
  Contrast,
  Palette,
  Type,
  Brush,
  Eraser,
  Scissors,
  Layers,
  Download,
  ArrowRight,
  Zap,
  Image as ImageIcon,
  Check,
} from 'lucide-react';
import { useRef } from 'react';
import Logo from '@/components/Logo';
import ThemeToggle from '@/components/ThemeToggle';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/toast';

const FEATURES = [
  { icon: Crop, title: 'Crop & Resize', desc: 'Frame your shot with precision crop, rotate, and resize controls.' },
  { icon: Sun, title: 'Adjust Light', desc: 'Brightness, contrast, exposure and saturation — full tonal control.' },
  { icon: Palette, title: 'Filters & Effects', desc: 'One-tap cinematic filters, blur, sharpen and artistic looks.' },
  { icon: Type, title: 'Text & Stickers', desc: 'Add headlines, captions and playful stickers to any image.' },
  { icon: Brush, title: 'Draw & Paint', desc: 'A fluid brush tool for annotations, doodles and creative edits.' },
  { icon: Scissors, title: 'AI Background Removal', desc: 'Instantly cut out subjects with a single click — no green screen.' },
];

const AI_TOOLS = [
  { icon: Eraser, title: 'Remove Background' },
  { icon: Zap, title: 'Auto Enhance' },
  { icon: Scissors, title: 'Remove Object' },
  { icon: Layers, title: 'Blur Background' },
  { icon: Sparkles, title: 'AI Filters' },
  { icon: Crop, title: 'Smart Crop' },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const uploadRef = useRef<HTMLInputElement>(null);

  const handleStart = () => {
    if (user) navigate('/dashboard');
    else navigate('/login');
  };

  const handleUploadClick = () => {
    if (user) navigate('/editor');
    else navigate('/login');
  };

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast('Please choose an image file', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      sessionStorage.setItem('pf-upload', reader.result as string);
      navigate(user ? '/editor' : '/login');
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-white">
      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-brand-500/20 blur-[120px] animate-pulse-glow" />
        <div className="absolute top-1/3 right-10 h-96 w-96 rounded-full bg-accent-500/20 blur-[120px] animate-pulse-glow" />
      </div>

      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-slate-200/60 bg-slate-50/80 backdrop-blur-xl dark:border-white/5 dark:bg-slate-950/70">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Logo />
          <nav className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white">Features</a>
            <a href="#ai-tools" className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white">AI Tools</a>
            <a href="#how" className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white">How it works</a>
          </nav>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            {user ? (
              <button onClick={() => navigate('/dashboard')} className="btn-primary !py-2 !px-4 text-sm">Dashboard</button>
            ) : (
              <>
                <button onClick={() => navigate('/login')} className="hidden text-sm font-semibold text-slate-700 hover:text-slate-900 sm:block dark:text-slate-200 dark:hover:text-white">Log in</button>
                <button onClick={handleStart} className="btn-primary !py-2 !px-4 text-sm">Get started</button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative mx-auto max-w-7xl px-6 pt-20 pb-24 md:pt-28">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="animate-fade-up">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-4 py-1.5 text-sm font-medium text-brand-600 dark:text-brand-300">
              <Sparkles className="h-4 w-4" /> AI-powered photo editing
            </div>
            <h1 className="font-display text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
              Edit Photos.<br />Create <span className="gradient-text">Anything.</span>
            </h1>
            <p className="mt-6 max-w-md text-lg text-slate-600 dark:text-slate-300">
              A powerful AI-powered photo editor that's simple enough for everyone.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <button onClick={handleStart} className="btn-primary group">
                Start Editing <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </button>
              <button onClick={() => uploadRef.current?.click()} className="btn-ghost">
                <ImageIcon className="h-5 w-5" /> Upload Photo
              </button>
              <input
                ref={uploadRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
            </div>
            <div className="mt-10 flex items-center gap-6 text-sm text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" /> No design skills needed</div>
              <div className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" /> Free to start</div>
              <div className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" /> Works in browser</div>
            </div>
          </div>

          {/* Animated preview */}
          <div className="relative animate-fade-in [animation-delay:200ms]">
            <div className="relative mx-auto max-w-md">
              <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-tr from-brand-500/30 to-accent-500/30 blur-2xl" />
              <div className="relative grid grid-cols-2 gap-3">
                <div className="space-y-3">
                  <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-2xl">
                    <img
                      src="https://images.pexels.com/photos/3760817/pexels-photo-3760817.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
                      alt="Before"
                      className="h-56 w-full object-cover grayscale"
                    />
                    <div className="px-3 py-2 text-center text-xs font-semibold text-slate-400">BEFORE</div>
                  </div>
                  <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-2xl">
                    <img
                      src="https://images.pexels.com/photos/592077/pexels-photo-592077.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
                      alt="Sample"
                      className="h-40 w-full object-cover saturate-150"
                    />
                  </div>
                </div>
                <div className="space-y-3 pt-8">
                  <div className="overflow-hidden rounded-2xl border border-brand-400/30 bg-white/5 shadow-2xl shadow-brand-500/20">
                    <img
                      src="https://images.pexels.com/photos/3760817/pexels-photo-3760817.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
                      alt="After"
                      className="h-56 w-full object-cover saturate-150 brightness-110 contrast-110"
                    />
                    <div className="bg-brand-500/20 px-3 py-2 text-center text-xs font-semibold text-brand-300">AFTER</div>
                  </div>
                  <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-2xl">
                    <img
                      src="https://images.pexels.com/photos/9998656/pexels-photo-9998656.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
                      alt="Sample 2"
                      className="h-40 w-full object-cover"
                    />
                  </div>
                </div>
              </div>
              {/* Floating tool chip */}
              <div className="absolute -left-6 top-1/3 flex animate-float items-center gap-2 rounded-xl border border-white/10 bg-slate-900/80 px-3 py-2 shadow-xl backdrop-blur-xl">
                <Wand2 className="h-4 w-4 text-brand-400" />
                <span className="text-xs font-medium text-slate-200">AI Enhance</span>
              </div>
              <div className="absolute -right-4 bottom-12 flex animate-float items-center gap-2 rounded-xl border border-white/10 bg-slate-900/80 px-3 py-2 shadow-xl backdrop-blur-xl [animation-delay:1.5s]">
                <Scissors className="h-4 w-4 text-accent-400" />
                <span className="text-xs font-medium text-slate-200">BG Removed</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative mx-auto max-w-7xl px-6 py-20">
        <div className="mb-12 text-center">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">Everything you need to edit</h2>
          <p className="mt-3 text-slate-600 dark:text-slate-400">Professional tools wrapped in a delightfully simple interface.</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className="card group hover:border-brand-400/30 hover:bg-white/[0.06] transition-all animate-fade-up"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="mb-4 grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-brand-500/20 to-accent-500/20 text-brand-400 transition-transform group-hover:scale-110">
                <f.icon className="h-6 w-6" />
              </div>
              <h3 className="font-display text-lg font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* AI Tools */}
      <section id="ai-tools" className="relative mx-auto max-w-7xl px-6 py-20">
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-brand-500/10 via-transparent to-accent-500/10 p-10 md:p-16">
          <div className="mb-10 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-400/30 bg-brand-500/10 px-4 py-1.5 text-sm font-medium text-brand-500 dark:text-brand-300">
              <Sparkles className="h-4 w-4" /> AI Tools
            </div>
            <h2 className="font-display text-3xl font-bold sm:text-4xl">Let AI do the heavy lifting</h2>
            <p className="mt-3 text-slate-600 dark:text-slate-400">One-click magic for the tedious parts of editing.</p>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {AI_TOOLS.map((t) => (
              <div key={t.title} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 transition-all hover:border-brand-400/30 hover:bg-white/10">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-brand-500/15 text-brand-400">
                  <t.icon className="h-5 w-5" />
                </div>
                <span className="font-medium">{t.title}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="relative mx-auto max-w-7xl px-6 py-20">
        <div className="mb-12 text-center">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">How it works</h2>
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          {[
            { n: '1', icon: ImageIcon, t: 'Upload your photo', d: 'Drag & drop or pick an image from your device.' },
            { n: '2', icon: Wand2, t: 'Edit with AI tools', d: 'Adjust, filter, remove backgrounds and more.' },
            { n: '3', icon: Download, t: 'Download & share', d: 'Export as PNG or JPG in a single click.' },
          ].map((s) => (
            <div key={s.n} className="relative text-center">
              <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 text-white shadow-lg shadow-brand-500/30">
                <s.icon className="h-7 w-7" />
              </div>
              <div className="mb-2 text-sm font-bold text-brand-500">STEP {s.n}</div>
              <h3 className="font-display text-xl font-semibold">{s.t}</h3>
              <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative mx-auto max-w-7xl px-6 py-20">
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-r from-brand-600 to-accent-600 p-12 text-center text-white shadow-2xl">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">Ready to create something amazing?</h2>
          <p className="mx-auto mt-3 max-w-md text-white/80">Start editing now — your first project is just a click away.</p>
          <button onClick={handleStart} className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 font-semibold text-brand-700 shadow-xl transition-all hover:scale-105 active:scale-100">
            Start Editing <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200/60 dark:border-white/5">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row">
          <Logo size="sm" />
          <p className="text-sm text-slate-500">© 2026 PhotoForge AI. Crafted for creators.</p>
        </div>
      </footer>
    </div>
  );
}
