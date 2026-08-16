import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload, Undo2, Redo2, Save, Download, Crop, RotateCw, Maximize, Sun, Contrast,
  Droplet, Aperture, Droplets, Sparkles, Palette, Type, Brush, Smile, Scissors,
  Eraser, Zap, Layers, Wand2, Image as ImageIcon, RotateCcw, FlipHorizontal,
  FlipVertical, Check, X, Loader2, Home,
} from 'lucide-react';
import Logo from '@/components/Logo';
import ThemeToggle from '@/components/ThemeToggle';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/toast';
import { supabase, type Project } from '@/lib/supabase';
import EditorCanvas, { type CanvasHandle } from '@/editor/EditorCanvas';
import { useEditorState, useProjectPersistence } from '@/editor/useEditorState';
import {
  FILTERS, DEFAULT_ADJUSTMENTS, defaultEditorState, buildFilterCSS,
  type EditorState, type FilterId, type TextLayer, type StickerLayer,
} from '@/editor/types';

type ToolId =
  | 'crop' | 'rotate' | 'resize' | 'brightness' | 'contrast' | 'saturation'
  | 'exposure' | 'blur' | 'sharpen' | 'filters' | 'text' | 'brush' | 'stickers'
  | 'ai';

const TOOLS: { id: ToolId; icon: typeof Crop; label: string }[] = [
  { id: 'crop', icon: Crop, label: 'Crop' },
  { id: 'rotate', icon: RotateCw, label: 'Rotate' },
  { id: 'resize', icon: Maximize, label: 'Resize' },
  { id: 'brightness', icon: Sun, label: 'Brightness' },
  { id: 'contrast', icon: Contrast, label: 'Contrast' },
  { id: 'saturation', icon: Droplet, label: 'Saturation' },
  { id: 'exposure', icon: Aperture, label: 'Exposure' },
  { id: 'blur', icon: Droplets, label: 'Blur' },
  { id: 'sharpen', icon: Sparkles, label: 'Sharpen' },
  { id: 'filters', icon: Palette, label: 'Filters' },
  { id: 'text', icon: Type, label: 'Text' },
  { id: 'brush', icon: Brush, label: 'Brush' },
  { id: 'stickers', icon: Smile, label: 'Stickers' },
  { id: 'ai', icon: Wand2, label: 'AI Tools' },
];

const STICKERS = ['😀', '😍', '🔥', '⭐', '❤️', '👍', '🎉', '🌈', '✨', '💯', '🚀', '🎨', '📸', '💎', '🌟', '😎'];

const FONTS = ['Inter', 'Space Grotesk', 'Georgia', 'Courier New', 'Impact', 'Comic Sans MS'];

export default function EditorPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const canvasRef = useRef<CanvasHandle>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const canvasWrapRef = useRef<HTMLDivElement>(null);

  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<ToolId>('brightness');
  const [showBefore, setShowBefore] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [projectName, setProjectName] = useState('Untitled Project');
  const [editingName, setEditingName] = useState(false);
  const [loadedProject, setLoadedProject] = useState<Project | null>(null);
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const [brushColor, setBrushColor] = useState('#ff4d4d');
  const [brushSize, setBrushSize] = useState(6);
  const [resizing, setResizing] = useState({ w: 1080, h: 1080 });
  const [cropMode, setCropMode] = useState(false);
  const [aiProcessing, setAiProcessing] = useState<string | null>(null);

  const editor = useEditorState();
  const { save, saving, currentId } = useProjectPersistence(editor.state, imageSrc, loadedProject?.id ?? null);

  // Load uploaded image or existing project on mount
  useEffect(() => {
    const projData = sessionStorage.getItem('pf-project');
    if (projData) {
      try {
        const p = JSON.parse(projData) as Project;
        setLoadedProject(p);
        setProjectName(p.name);
        if (p.image_url) setImageSrc(p.image_url);
        if (p.settings) {
          editor.setState(p.settings as unknown as EditorState);
        }
        sessionStorage.removeItem('pf-project');
        return;
      } catch { /* ignore */ }
    }
    const upload = sessionStorage.getItem('pf-upload');
    if (upload) {
      setImageSrc(upload);
      sessionStorage.removeItem('pf-upload');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast('Please choose an image file', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result as string);
      editor.commit(() => defaultEditorState());
      toast('Image loaded', 'success');
    };
    reader.readAsDataURL(file);
  };

  const handleDownload = async (format: 'png' | 'jpg') => {
    if (!canvasRef.current || !imageSrc) {
      toast('Upload an image first', 'error');
      return;
    }
    try {
      const dataUrl = await canvasRef.current.exportImage(format);
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `${projectName.replace(/\s+/g, '-').toLowerCase()}.${format}`;
      link.click();
      toast(`Downloaded as ${format.toUpperCase()}`, 'success');
    } catch {
      toast('Could not export image', 'error');
    }
    setDownloadOpen(false);
  };

  const handleSave = async () => {
    await save(projectName);
  };

  // Text tool
  const addText = () => {
    const id = crypto.randomUUID();
    const layer: TextLayer = {
      id, text: 'Your text', x: 50, y: 50, size: 48, color: '#ffffff',
      font: 'Inter', bold: true, italic: false,
    };
    editor.commit((s) => ({ ...s, textLayers: [...s.textLayers, layer] }));
    setSelectedTextId(id);
  };

  const updateText = (id: string, patch: Partial<TextLayer>) => {
    editor.update((s) => ({
      ...s,
      textLayers: s.textLayers.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    }));
  };

  const deleteText = (id: string) => {
    editor.commit((s) => ({ ...s, textLayers: s.textLayers.filter((t) => t.id !== id) }));
    setSelectedTextId(null);
  };

  const onTextDrag = (id: string, xPct: number, yPct: number) => {
    editor.update((s) => ({
      ...s,
      textLayers: s.textLayers.map((t) => (t.id === id ? { ...t, x: xPct, y: yPct } : t)),
    }));
  };

  // Stickers
  const addSticker = (emoji: string) => {
    const id = crypto.randomUUID();
    const layer: StickerLayer = { id, emoji, x: 50, y: 50, size: 60 };
    editor.commit((s) => ({ ...s, stickerLayers: [...s.stickerLayers, layer] }));
  };

  // Brush
  const drawingRef = useRef(false);
  const handleCanvasClick = ({ xPct, yPct }: { xPct: number; yPct: number }) => {
    if (activeTool !== 'brush') return;
    drawingRef.current = true;
    editor.update((s) => ({
      ...s,
      strokes: [...s.strokes, { points: [{ x: xPct, y: yPct }], color: brushColor, size: brushSize }],
    }));
  };

  const handleCanvasMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!drawingRef.current || activeTool !== 'brush' || !canvasWrapRef.current) return;
    const rect = canvasWrapRef.current.getBoundingClientRect();
    const xPct = ((e.clientX - rect.left) / rect.width) * 100;
    const yPct = ((e.clientY - rect.top) / rect.height) * 100;
    editor.update((s) => {
      const strokes = [...s.strokes];
      const last = strokes[strokes.length - 1];
      if (last) strokes[strokes.length - 1] = { ...last, points: [...last.points, { x: xPct, y: yPct }] };
      return { ...s, strokes };
    });
  };

  const stopDrawing = () => {
    if (drawingRef.current) {
      drawingRef.current = false;
      editor.commitCurrent();
    }
  };

  // AI tools (demo)
  const runAiTool = async (tool: string) => {
    setAiProcessing(tool);
    await new Promise((r) => setTimeout(r, 1400));
    setAiProcessing(null);
    if (tool === 'Remove Background') {
      editor.commit((s) => ({ ...s, bgRemoved: !s.bgRemoved }));
      toast(editor.state.bgRemoved ? 'Background restored' : 'Background removed', 'success');
    } else if (tool === 'Auto Enhance' || tool === 'Enhance Image') {
      editor.commit((s) => ({
        ...s,
        enhanced: !s.enhanced,
        adjustments: {
          ...s.adjustments,
          brightness: s.enhanced ? 100 : 115,
          contrast: s.enhanced ? 100 : 120,
          saturation: s.enhanced ? 100 : 125,
          sharpen: s.enhanced ? 0 : 30,
        },
      }));
      toast(editor.state.enhanced ? 'Enhancement reverted' : 'Image enhanced', 'success');
    } else if (tool === 'Blur Background') {
      editor.commit((s) => ({ ...s, blurBg: !s.blurBg, adjustments: { ...s.adjustments, blur: s.blurBg ? 0 : 3 } }));
      toast(editor.state.blurBg ? 'Background blur reverted' : 'Background blurred', 'success');
    } else if (tool === 'Remove Object') {
      toast('Click on the object you want to remove', 'info');
    } else if (tool === 'AI Filters') {
      setActiveTool('filters');
      toast('Browse AI-applied filters in the Filters tab', 'info');
    } else if (tool === 'Smart Crop') {
      editor.commit((s) => ({ ...s, crop: { x: 10, y: 10, w: 80, h: 80 } }));
      toast('Smart crop applied', 'success');
    }
  };

  const selectedText = editor.state.textLayers.find((t) => t.id === selectedTextId);

  return (
    <div className="flex h-screen flex-col bg-slate-100 dark:bg-slate-950">
      {/* Top bar */}
      <header className="z-30 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-2.5 dark:border-white/5 dark:bg-slate-900">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')} className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5" aria-label="Home">
            <Home className="h-5 w-5" />
          </button>
          <div className="hidden md:block"><Logo size="sm" to="/dashboard" /></div>
          <div className="ml-2 flex items-center gap-2">
            {editingName ? (
              <div className="flex items-center gap-1">
                <input
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm text-slate-900 outline-none dark:border-white/10 dark:bg-white/5 dark:text-white"
                  autoFocus
                />
                <button onClick={() => setEditingName(false)} className="grid h-7 w-7 place-items-center rounded text-emerald-500 hover:bg-emerald-500/10"><Check className="h-4 w-4" /></button>
              </div>
            ) : (
              <button onClick={() => setEditingName(true)} className="text-sm font-medium text-slate-700 hover:text-slate-900 dark:text-slate-200 dark:hover:text-white">
                {projectName}
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button onClick={() => fileRef.current?.click()} className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/5">
            <Upload className="h-4 w-4" /> <span className="hidden sm:inline">Upload</span>
          </button>
          <button onClick={editor.undo} disabled={!editor.canUndo} className="grid h-9 w-9 place-items-center rounded-lg text-slate-700 hover:bg-slate-100 disabled:opacity-30 dark:text-slate-200 dark:hover:bg-white/5" aria-label="Undo">
            <Undo2 className="h-4 w-4" />
          </button>
          <button onClick={editor.redo} disabled={!editor.canRedo} className="grid h-9 w-9 place-items-center rounded-lg text-slate-700 hover:bg-slate-100 disabled:opacity-30 dark:text-slate-200 dark:hover:bg-white/5" aria-label="Redo">
            <Redo2 className="h-4 w-4" />
          </button>
          <button onClick={editor.reset} className="grid h-9 w-9 place-items-center rounded-lg text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/5" aria-label="Reset">
            <RotateCcw className="h-4 w-4" />
          </button>
          <button
            onMouseDown={() => setShowBefore(true)}
            onMouseUp={() => setShowBefore(false)}
            onMouseLeave={() => setShowBefore(false)}
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/5"
          >
            <ImageIcon className="h-4 w-4" /> <span className="hidden sm:inline">Hold: Before</span>
          </button>
          <div className="mx-1 h-6 w-px bg-slate-200 dark:bg-white/10" />
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 disabled:opacity-50 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} <span className="hidden sm:inline">Save</span>
          </button>
          <div className="relative">
            <button onClick={() => setDownloadOpen((o) => !o)} className="btn-primary !px-3 !py-2 text-sm">
              <Download className="h-4 w-4" /> <span className="hidden sm:inline">Download</span>
            </button>
            {downloadOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setDownloadOpen(false)} />
                <div className="absolute right-0 top-full z-20 mt-2 w-40 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-white/10 dark:bg-slate-800">
                  <button onClick={() => handleDownload('png')} className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/5">
                    <Check className="h-4 w-4 text-emerald-500" /> PNG
                  </button>
                  <button onClick={() => handleDownload('jpg')} className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/5">
                    <Check className="h-4 w-4 text-emerald-500" /> JPG
                  </button>
                </div>
              </>
            )}
          </div>
          <ThemeToggle />
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar - tools */}
        <aside className="z-20 flex w-16 flex-col items-center gap-1 overflow-y-auto border-r border-slate-200 bg-white py-3 dark:border-white/5 dark:bg-slate-900 lg:w-20">
          {TOOLS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTool(t.id)}
              className={`group relative flex w-14 flex-col items-center gap-1 rounded-xl py-2.5 transition-colors lg:w-16 ${
                activeTool === t.id
                  ? 'bg-brand-500/15 text-brand-600 dark:text-brand-400'
                  : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5'
              }`}
            >
              <t.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{t.label}</span>
              {activeTool === t.id && <div className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-brand-500" />}
            </button>
          ))}
        </aside>

        {/* Center canvas */}
        <main
          ref={canvasWrapRef}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={stopDrawing}
          className="relative flex flex-1 items-center justify-center overflow-hidden bg-slate-200 p-6 dark:bg-slate-900"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(148,163,184,0.15) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        >
          {!imageSrc ? (
            <div
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); }}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files?.[0];
                if (file) handleFile(file);
              }}
              className="flex w-full max-w-lg cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-300 bg-white/50 p-16 text-center transition-colors hover:border-brand-400 hover:bg-brand-50/50 dark:border-white/10 dark:bg-white/5 dark:hover:border-brand-400/50"
            >
              <div className="mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 text-white shadow-lg shadow-brand-500/30">
                <Upload className="h-8 w-8" />
              </div>
              <h3 className="font-display text-xl font-semibold text-slate-900 dark:text-white">Upload an image to start</h3>
              <p className="mt-2 text-sm text-slate-500">Click here or drag & drop a photo</p>
            </div>
          ) : showBefore ? (
            <img
              src={imageSrc}
              alt="Before"
              className="max-w-full max-h-[65vh] object-contain"
            />
          ) : (
            <EditorCanvas
              ref={canvasRef}
              imageSrc={imageSrc}
              state={editor.state}
              onCanvasClick={handleCanvasClick}
              onTextDrag={onTextDrag}
              selectedTextId={selectedTextId}
            />
          )}

          {/* AI processing overlay */}
          {aiProcessing && (
            <div className="absolute inset-0 z-30 grid place-items-center bg-slate-950/60 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-slate-900/80 px-8 py-6">
                <div className="relative">
                  <Loader2 className="h-10 w-10 animate-spin text-brand-400" />
                  <Wand2 className="absolute inset-0 m-auto h-5 w-5 text-brand-300" />
                </div>
                <p className="text-sm font-medium text-white">AI: {aiProcessing}…</p>
              </div>
            </div>
          )}
        </main>

        {/* Right sidebar - settings */}
        <aside className="z-20 flex w-72 flex-col overflow-y-auto border-l border-slate-200 bg-white dark:border-white/5 dark:bg-slate-900 lg:w-80">
          <SettingsPanel
            tool={activeTool}
            state={editor.state}
            update={editor.update}
            commit={editor.commit}
            commitCurrent={editor.commitCurrent}
            selectedText={selectedText}
            updateText={updateText}
            deleteText={deleteText}
            addText={addText}
            addSticker={addSticker}
            brushColor={brushColor}
            setBrushColor={setBrushColor}
            brushSize={brushSize}
            setBrushSize={setBrushSize}
            setResizing={setResizing}
            resizing={resizing}
            imageSrc={imageSrc}
            runAiTool={runAiTool}
            aiProcessing={aiProcessing}
            editor={editor}
          />
        </aside>
      </div>
    </div>
  );
}

/* ---------- Settings panel ---------- */

type SettingsProps = {
  tool: ToolId;
  state: EditorState;
  update: (u: (s: EditorState) => EditorState) => void;
  commit: (u: (s: EditorState) => EditorState) => void;
  commitCurrent: () => void;
  selectedText: TextLayer | undefined;
  updateText: (id: string, patch: Partial<TextLayer>) => void;
  deleteText: (id: string) => void;
  addText: () => void;
  addSticker: (e: string) => void;
  brushColor: string;
  setBrushColor: (c: string) => void;
  brushSize: number;
  setBrushSize: (n: number) => void;
  setResizing: (r: { w: number; h: number }) => void;
  resizing: { w: number; h: number };
  imageSrc: string | null;
  runAiTool: (t: string) => void;
  aiProcessing: string | null;
  editor: ReturnType<typeof useEditorState>;
};

function SettingsPanel(props: SettingsProps) {
  const { tool, state, update, commit, commitCurrent } = props;

  const setAdj = (key: keyof typeof state.adjustments, value: number) => {
    update((s) => ({ ...s, adjustments: { ...s.adjustments, [key]: value } }));
  };

  const Slider = ({ label, value, min, max, step = 1, onChange, onCommit }: {
    label: string; value: number; min: number; max: number; step?: number;
    onChange: (v: number) => void; onCommit?: () => void;
  }) => (
    <div className="mb-5">
      <div className="mb-2 flex items-center justify-between">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>
        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-white/5 dark:text-slate-400">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        onMouseUp={onCommit}
        onTouchEnd={onCommit}
        className="w-full"
      />
    </div>
  );

  return (
    <div className="flex flex-col">
      <div className="border-b border-slate-200 px-4 py-3 dark:border-white/5">
        <h3 className="font-display text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {TOOLS.find((t) => t.id === tool)?.label}
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {/* Adjustments */}
        {['brightness', 'contrast', 'saturation', 'exposure', 'blur', 'sharpen'].includes(tool) && (
          <>
            {tool === 'brightness' && <Slider label="Brightness" value={state.adjustments.brightness} min={0} max={200} onChange={(v) => setAdj('brightness', v)} onCommit={commitCurrent} />}
            {tool === 'contrast' && <Slider label="Contrast" value={state.adjustments.contrast} min={0} max={200} onChange={(v) => setAdj('contrast', v)} onCommit={commitCurrent} />}
            {tool === 'saturation' && <Slider label="Saturation" value={state.adjustments.saturation} min={0} max={200} onChange={(v) => setAdj('saturation', v)} onCommit={commitCurrent} />}
            {tool === 'exposure' && <Slider label="Exposure" value={state.adjustments.exposure} min={-100} max={100} onChange={(v) => setAdj('exposure', v)} onCommit={commitCurrent} />}
            {tool === 'blur' && <Slider label="Blur" value={state.adjustments.blur} min={0} max={20} step={0.5} onChange={(v) => setAdj('blur', v)} onCommit={commitCurrent} />}
            {tool === 'sharpen' && <Slider label="Sharpen" value={state.adjustments.sharpen} min={0} max={100} onChange={(v) => setAdj('sharpen', v)} onCommit={commitCurrent} />}
            <button
              onClick={() => commit((s) => ({ ...s, adjustments: { ...s.adjustments, [tool]: DEFAULT_ADJUSTMENTS[tool as keyof typeof DEFAULT_ADJUSTMENTS] } }))}
              className="btn-ghost w-full !py-2 text-sm"
            >
              <RotateCcw className="h-4 w-4" /> Reset {tool}
            </button>
          </>
        )}

        {/* Crop */}
        {tool === 'crop' && (
          <div className="space-y-4">
            <p className="text-sm text-slate-500">Choose an aspect ratio to crop your image.</p>
            {[
              { label: 'Free', w: null, h: null },
              { label: '1:1 Square', w: 1, h: 1 },
              { label: '4:3 Landscape', w: 4, h: 3 },
              { label: '3:4 Portrait', w: 3, h: 4 },
              { label: '16:9 Widescreen', w: 16, h: 9 },
              { label: '9:16 Story', w: 9, h: 16 },
            ].map((r) => (
              <button
                key={r.label}
                onClick={() => commit((s) => ({ ...s, crop: r.w ? { x: 0, y: 0, w: 100, h: 100 } : null }))}
                className="flex w-full items-center justify-between rounded-xl border border-slate-200 px-4 py-2.5 text-sm hover:border-brand-400 hover:bg-brand-50 dark:border-white/10 dark:hover:bg-white/5"
              >
                {r.label}
                <Crop className="h-4 w-4 text-slate-400" />
              </button>
            ))}
            <button onClick={() => commit((s) => ({ ...s, crop: null }))} className="btn-ghost w-full !py-2 text-sm">
              <X className="h-4 w-4" /> Clear crop
            </button>
          </div>
        )}

        {/* Rotate */}
        {tool === 'rotate' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => commit((s) => ({ ...s, rotation: (s.rotation - 90) % 360 }))} className="btn-ghost !py-2.5 text-sm">
                <RotateCcw className="h-4 w-4" /> -90°
              </button>
              <button onClick={() => commit((s) => ({ ...s, rotation: (s.rotation + 90) % 360 }))} className="btn-ghost !py-2.5 text-sm">
                <RotateCw className="h-4 w-4" /> +90°
              </button>
              <button onClick={() => commit((s) => ({ ...s, flipH: !s.flipH }))} className="btn-ghost !py-2.5 text-sm">
                <FlipHorizontal className="h-4 w-4" /> Flip H
              </button>
              <button onClick={() => commit((s) => ({ ...s, flipV: !s.flipV }))} className="btn-ghost !py-2.5 text-sm">
                <FlipVertical className="h-4 w-4" /> Flip V
              </button>
            </div>
            <Slider label="Fine rotation" value={state.rotation} min={-180} max={180} onChange={(v) => update((s) => ({ ...s, rotation: v }))} onCommit={commitCurrent} />
            <button onClick={() => commit((s) => ({ ...s, rotation: 0, flipH: false, flipV: false }))} className="btn-ghost w-full !py-2 text-sm">
              <RotateCcw className="h-4 w-4" /> Reset rotation
            </button>
          </div>
        )}

        {/* Resize */}
        {tool === 'resize' && (
          <div className="space-y-4">
            <p className="text-sm text-slate-500">Set export dimensions (pixels).</p>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Width</label>
                <input type="number" value={props.resizing.w} onChange={(e) => props.setResizing({ ...props.resizing, w: Number(e.target.value) })} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-brand-500 dark:border-white/10 dark:bg-white/5 dark:text-white" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Height</label>
                <input type="number" value={props.resizing.h} onChange={(e) => props.setResizing({ ...props.resizing, h: Number(e.target.value) })} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-brand-500 dark:border-white/10 dark:bg-white/5 dark:text-white" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { l: '1080²', w: 1080, h: 1080 },
                { l: '1920×1080', w: 1920, h: 1080 },
                { l: '1080×1920', w: 1080, h: 1920 },
              ].map((p) => (
                <button key={p.l} onClick={() => props.setResizing({ w: p.w, h: p.h })} className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs hover:border-brand-400 dark:border-white/10">
                  {p.l}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-400">Export dimensions apply when you download.</p>
          </div>
        )}

        {/* Filters */}
        {tool === 'filters' && (
          <div className="grid grid-cols-3 gap-2">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => commit((s) => ({ ...s, filter: f.id as FilterId }))}
                className={`overflow-hidden rounded-xl border-2 transition-all ${state.filter === f.id ? 'border-brand-500' : 'border-transparent hover:border-slate-300 dark:hover:border-white/20'}`}
              >
                {props.imageSrc && (
                  <img src={props.imageSrc} alt={f.name} className="h-16 w-full object-cover" style={{ filter: buildFilterCSS({ ...state, filter: f.id as FilterId }) }} />
                )}
                <div className="bg-slate-100 py-1 text-[10px] font-medium dark:bg-white/5">{f.name}</div>
              </button>
            ))}
          </div>
        )}

        {/* Text */}
        {tool === 'text' && (
          <div className="space-y-4">
            <button onClick={props.addText} className="btn-primary w-full !py-2.5 text-sm">
              <Type className="h-4 w-4" /> Add text layer
            </button>
            {props.selectedText ? (
              <div className="space-y-3 rounded-xl border border-slate-200 p-3 dark:border-white/10">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">Text</label>
                  <input value={props.selectedText.text} onChange={(e) => props.updateText(props.selectedText!.id, { text: e.target.value })} className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-white/10 dark:bg-white/5 dark:text-white" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">Font</label>
                  <select value={props.selectedText.font} onChange={(e) => props.updateText(props.selectedText!.id, { font: e.target.value })} className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-white/10 dark:bg-white/5 dark:text-white">
                    {FONTS.map((f) => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">Color</label>
                  <input type="color" value={props.selectedText.color} onChange={(e) => props.updateText(props.selectedText!.id, { color: e.target.value })} className="h-9 w-full rounded-lg border border-slate-300 dark:border-white/10" />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-slate-500">Size</label>
                  <input type="range" min={12} max={120} value={props.selectedText.size} onChange={(e) => props.updateText(props.selectedText!.id, { size: Number(e.target.value) })} className="w-32" />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => props.updateText(props.selectedText!.id, { bold: !props.selectedText!.bold })} className={`flex-1 rounded-lg border py-1.5 text-sm ${props.selectedText.bold ? 'border-brand-500 bg-brand-500/10 text-brand-600' : 'border-slate-200 dark:border-white/10'}`}>Bold</button>
                  <button onClick={() => props.updateText(props.selectedText!.id, { italic: !props.selectedText!.italic })} className={`flex-1 rounded-lg border py-1.5 text-sm ${props.selectedText.italic ? 'border-brand-500 bg-brand-500/10 text-brand-600' : 'border-slate-200 dark:border-white/10'}`}>Italic</button>
                </div>
                <button onClick={() => props.deleteText(props.selectedText!.id)} className="flex w-full items-center justify-center gap-1.5 rounded-lg py-1.5 text-sm text-rose-500 hover:bg-rose-500/10">
                  <X className="h-4 w-4" /> Delete layer
                </button>
              </div>
            ) : (
              <p className="text-sm text-slate-500">Add a text layer, then drag it on the canvas to position.</p>
            )}
          </div>
        )}

        {/* Brush */}
        {tool === 'brush' && (
          <div className="space-y-4">
            <p className="text-sm text-slate-500">Click and drag on the image to draw.</p>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Color</label>
              <div className="flex flex-wrap gap-2">
                {['#ff4d4d', '#ffd633', '#33ff77', '#33a0ff', '#cc33ff', '#ffffff', '#000000'].map((c) => (
                  <button key={c} onClick={() => props.setBrushColor(c)} className={`h-8 w-8 rounded-full border-2 ${props.brushColor === c ? 'border-brand-500 scale-110' : 'border-white/20'}`} style={{ background: c }} />
                ))}
                <input type="color" value={props.brushColor} onChange={(e) => props.setBrushColor(e.target.value)} className="h-8 w-8 rounded-full border-2 border-white/20" />
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Brush size: {props.brushSize}</label>
              <input type="range" min={1} max={30} value={props.brushSize} onChange={(e) => props.setBrushSize(Number(e.target.value))} className="w-full" />
            </div>
            <button onClick={() => commit((s) => ({ ...s, strokes: [] }))} className="btn-ghost w-full !py-2 text-sm">
              <Eraser className="h-4 w-4" /> Clear all strokes
            </button>
          </div>
        )}

        {/* Stickers */}
        {tool === 'stickers' && (
          <div>
            <p className="mb-3 text-sm text-slate-500">Tap a sticker to add it. Drag on the canvas to move.</p>
            <div className="grid grid-cols-4 gap-2">
              {STICKERS.map((e) => (
                <button key={e} onClick={() => props.addSticker(e)} className="grid h-12 w-full place-items-center rounded-xl border border-slate-200 text-2xl hover:border-brand-400 hover:bg-brand-50 dark:border-white/10 dark:hover:bg-white/5">
                  {e}
                </button>
              ))}
            </div>
            {state.stickerLayers.length > 0 && (
              <button onClick={() => commit((s) => ({ ...s, stickerLayers: [] }))} className="btn-ghost mt-4 w-full !py-2 text-sm">
                <X className="h-4 w-4" /> Clear stickers
              </button>
            )}
          </div>
        )}

        {/* AI Tools */}
        {tool === 'ai' && (
          <div className="space-y-3">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-brand-400/30 bg-brand-500/10 px-3 py-1 text-xs font-medium text-brand-600 dark:text-brand-300">
              <Sparkles className="h-3.5 w-3.5" /> AI-powered
            </div>
            {[
              { icon: Scissors, label: 'Remove Background', desc: 'Cut out the subject instantly' },
              { icon: Zap, label: 'Auto Enhance', desc: 'One-tap color & light boost' },
              { icon: Eraser, label: 'Remove Object', desc: 'Erase unwanted elements' },
              { icon: Layers, label: 'Blur Background', desc: 'Depth-of-field effect' },
              { icon: Wand2, label: 'AI Filters', desc: 'Smart cinematic looks' },
              { icon: Crop, label: 'Smart Crop', desc: 'AI-suggested framing' },
            ].map((t) => (
              <button
                key={t.label}
                onClick={() => props.runAiTool(t.label)}
                disabled={props.aiProcessing !== null}
                className="flex w-full items-center gap-3 rounded-xl border border-slate-200 p-3 text-left transition-all hover:border-brand-400 hover:bg-brand-50 disabled:opacity-50 dark:border-white/10 dark:hover:bg-white/5"
              >
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-brand-500/20 to-accent-500/20 text-brand-500 dark:text-brand-400">
                  {props.aiProcessing === t.label ? <Loader2 className="h-5 w-5 animate-spin" /> : <t.icon className="h-5 w-5" />}
                </div>
                <div>
                  <div className="text-sm font-semibold">{t.label}</div>
                  <div className="text-xs text-slate-500">{t.desc}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
