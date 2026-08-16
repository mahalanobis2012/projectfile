import { Link } from 'react-router-dom';
import { Wand2 } from 'lucide-react';

export default function Logo({ to = '/', size = 'md' }: { to?: string; size?: 'sm' | 'md' | 'lg' }) {
  const dims = {
    sm: { box: 'h-8 w-8', icon: 16, text: 'text-base' },
    md: { box: 'h-10 w-10', icon: 20, text: 'text-lg' },
    lg: { box: 'h-14 w-14', icon: 28, text: 'text-2xl' },
  }[size];

  return (
    <Link to={to} className="flex items-center gap-2.5 group">
      <div
        className={`${dims.box} relative grid place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 shadow-lg shadow-brand-500/30 transition-transform group-hover:scale-105`}
      >
        <Wand2 className="text-white" size={dims.icon} />
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-brand-400 to-accent-400 opacity-0 blur-md transition-opacity group-hover:opacity-60" />
      </div>
      <span className={`font-display font-bold tracking-tight text-slate-900 dark:text-white ${dims.text}`}>
        PhotoForge<span className="gradient-text"> AI</span>
      </span>
    </Link>
  );
}
