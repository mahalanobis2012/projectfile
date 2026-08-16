import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Upload, LogOut, Settings, Image as ImageIcon, Clock, Loader2, Trash2, Pencil } from 'lucide-react';
import Logo from '@/components/Logo';
import ThemeToggle from '@/components/ThemeToggle';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/toast';
import { supabase, type Project } from '@/lib/supabase';

export default function DashboardPage() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const uploadRef = useRef<HTMLInputElement>(null);

  const loadProjects = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('updated_at', { ascending: false });
    setLoading(false);
    if (error) {
      toast('Could not load projects', 'error');
      return;
    }
    setProjects(data ?? []);
  };

  useEffect(() => {
    loadProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleNewProject = () => {
    sessionStorage.removeItem('pf-upload');
    navigate('/editor');
  };

  const handleUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast('Please choose an image file', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      sessionStorage.setItem('pf-upload', reader.result as string);
      navigate('/editor');
    };
    reader.readAsDataURL(file);
  };

  const openProject = (p: Project) => {
    sessionStorage.setItem('pf-project', JSON.stringify(p));
    navigate('/editor');
  };

  const deleteProject = async (id: string) => {
    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (error) {
      toast('Could not delete project', 'error');
      return;
    }
    setProjects((p) => p.filter((x) => x.id !== id));
    toast('Project deleted', 'info');
  };

  const handleSignOut = async () => {
    await signOut();
    toast('Signed out', 'info');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-white">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-slate-200/60 bg-slate-50/80 backdrop-blur-xl dark:border-white/5 dark:bg-slate-950/70">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Logo to="/dashboard" />
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <div className="relative">
              <button
                onClick={() => setProfileOpen((o) => !o)}
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 py-1.5 pl-1.5 pr-3 transition-colors hover:bg-white/10"
              >
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-brand-500 to-accent-500 text-sm font-bold text-white">
                  {user?.email?.[0]?.toUpperCase() ?? 'U'}
                </div>
                <span className="hidden text-sm font-medium sm:block">{user?.email?.split('@')[0] ?? 'User'}</span>
              </button>
              {profileOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setProfileOpen(false)} />
                  <div className="absolute right-0 top-full z-20 mt-2 w-56 overflow-hidden rounded-xl border border-white/10 bg-slate-900 shadow-2xl backdrop-blur-xl">
                    <div className="border-b border-white/5 px-4 py-3">
                      <p className="text-sm font-medium">{user?.email}</p>
                      <p className="text-xs text-slate-400">Free plan</p>
                    </div>
                    <button onClick={() => { setProfileOpen(false); toast('Settings panel coming soon', 'info'); }} className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5">
                      <Settings className="h-4 w-4" /> Settings
                    </button>
                    <button onClick={handleSignOut} className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-rose-400 hover:bg-rose-500/10">
                      <LogOut className="h-4 w-4" /> Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-10">
        {/* Welcome */}
        <div className="mb-8 animate-fade-up">
          <h1 className="font-display text-3xl font-bold sm:text-4xl">
            Welcome back, <span className="gradient-text">{user?.email?.split('@')[0] ?? 'Creator'}</span>
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">Pick up where you left off or start something new.</p>
        </div>

        {/* Quick actions */}
        <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <button onClick={handleNewProject} className="group card flex items-center gap-4 border-brand-400/20 bg-gradient-to-br from-brand-500/10 to-transparent transition-all hover:border-brand-400/40 hover:from-brand-500/20">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-lg shadow-brand-500/30 transition-transform group-hover:scale-110">
              <Plus className="h-6 w-6" />
            </div>
            <div className="text-left">
              <div className="font-display text-lg font-semibold">New Project</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Start with a blank canvas</div>
            </div>
          </button>
          <button onClick={() => uploadRef.current?.click()} className="group card flex items-center gap-4 transition-all hover:border-accent-400/30 hover:bg-white/[0.06]">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-accent-500 to-accent-600 text-white shadow-lg shadow-accent-500/30 transition-transform group-hover:scale-110">
              <Upload className="h-6 w-6" />
            </div>
            <div className="text-left">
              <div className="font-display text-lg font-semibold">Upload Photo</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Edit an existing image</div>
            </div>
          </button>
          <input ref={uploadRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])} />
          <div className="card flex items-center gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-white/5 text-slate-300">
              <ImageIcon className="h-6 w-6" />
            </div>
            <div>
              <div className="font-display text-lg font-semibold">{projects.length}</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Saved projects</div>
            </div>
          </div>
        </div>

        {/* Recent projects */}
        <div className="mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5 text-slate-400" />
          <h2 className="font-display text-xl font-semibold">Recent projects</h2>
        </div>

        {loading ? (
          <div className="grid place-items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-brand-400" />
          </div>
        ) : projects.length === 0 ? (
          <div className="card flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-white/5 text-slate-400">
              <ImageIcon className="h-8 w-8" />
            </div>
            <h3 className="font-display text-lg font-semibold">No projects yet</h3>
            <p className="mt-1 max-w-xs text-sm text-slate-600 dark:text-slate-400">Create a new project or upload a photo to get started.</p>
            <button onClick={handleNewProject} className="btn-primary mt-6">
              <Plus className="h-5 w-5" /> New Project
            </button>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {projects.map((p, i) => (
              <div
                key={p.id}
                className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition-all hover:border-brand-400/30 hover:bg-white/[0.06] animate-fade-up"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <button onClick={() => openProject(p)} className="block w-full">
                  <div className="aspect-video w-full overflow-hidden bg-slate-900">
                    {p.thumbnail ? (
                      <img src={p.thumbnail} alt={p.name} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                    ) : (
                      <div className="grid h-full place-items-center text-slate-600">
                        <ImageIcon className="h-8 w-8" />
                      </div>
                    )}
                  </div>
                </button>
                <div className="flex items-center justify-between p-4">
                  <div className="min-w-0">
                    <div className="truncate font-medium">{p.name}</div>
                    <div className="text-xs text-slate-500">{new Date(p.updated_at).toLocaleDateString()}</div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openProject(p)} className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => deleteProject(p.id)} className="rounded-lg p-2 text-slate-400 hover:bg-rose-500/10 hover:text-rose-400">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
