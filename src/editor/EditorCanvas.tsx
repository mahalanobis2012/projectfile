import { forwardRef, useImperativeHandle, useRef, type MouseEvent } from 'react';
import { buildFilterCSS, transformCSS, type EditorState } from './types';

export type CanvasHandle = {
  exportImage: (format: 'png' | 'jpg') => Promise<string>;
};

type Props = {
  imageSrc: string | null;
  state: EditorState;
  onCanvasClick?: (e: { xPct: number; yPct: number }) => void;
  selectedTextId?: string | null;
  onTextDrag?: (id: string, xPct: number, yPct: number) => void;
};

const EditorCanvas = forwardRef<CanvasHandle, Props>(function EditorCanvas(
  { imageSrc, state, onCanvasClick, onTextDrag },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const dragRef = useRef<string | null>(null);

  useImperativeHandle(ref, () => ({
    exportImage: async (format: 'png' | 'jpg') => {
      if (!imgRef.current || !imageSrc) throw new Error('No image');
      const img = imgRef.current;
      const canvas = document.createElement('canvas');
      const naturalW = img.naturalWidth;
      const naturalH = img.naturalHeight;
      canvas.width = naturalW;
      canvas.height = naturalH;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas not supported');

      // Apply CSS filter to canvas
      ctx.filter = buildFilterCSS(state);
      ctx.save();
      ctx.translate(naturalW / 2, naturalH / 2);
      ctx.rotate((state.rotation * Math.PI) / 180);
      ctx.scale(state.flipH ? -1 : 1, state.flipV ? -1 : 1);
      ctx.drawImage(img, -naturalW / 2, -naturalH / 2, naturalW, naturalH);
      ctx.restore();
      ctx.filter = 'none';

      // Draw strokes
      if (state.strokes.length > 0) {
        state.strokes.forEach((stroke) => {
          if (stroke.points.length < 2) return;
          ctx.strokeStyle = stroke.color;
          ctx.lineWidth = stroke.size * (naturalW / 800);
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.beginPath();
          stroke.points.forEach((p, i) => {
            const x = (p.x / 100) * naturalW;
            const y = (p.y / 100) * naturalH;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          });
          ctx.stroke();
        });
      }

      // Draw text layers
      state.textLayers.forEach((t) => {
        const fontSize = (t.size / 100) * naturalH * 0.1;
        ctx.font = `${t.italic ? 'italic ' : ''}${t.bold ? 'bold ' : ''}${fontSize}px ${t.font}`;
        ctx.fillStyle = t.color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const x = (t.x / 100) * naturalW;
        const y = (t.y / 100) * naturalH;
        ctx.fillText(t.text, x, y);
      });

      // Draw stickers
      state.stickerLayers.forEach((s) => {
        const fontSize = (s.size / 100) * naturalH * 0.15;
        ctx.font = `${fontSize}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const x = (s.x / 100) * naturalW;
        const y = (s.y / 100) * naturalH;
        ctx.fillText(s.emoji, x, y);
      });

      const mime = format === 'png' ? 'image/png' : 'image/jpeg';
      return canvas.toDataURL(mime, 0.92);
    },
  }));

  const handleClick = (e: MouseEvent<HTMLDivElement>) => {
    if (!onCanvasClick || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const xPct = ((e.clientX - rect.left) / rect.width) * 100;
    const yPct = ((e.clientY - rect.top) / rect.height) * 100;
    onCanvasClick({ xPct, yPct });
  };

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!dragRef.current || !onTextDrag || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const xPct = ((e.clientX - rect.left) / rect.width) * 100;
    const yPct = ((e.clientY - rect.top) / rect.height) * 100;
    onTextDrag(dragRef.current, xPct, yPct);
  };

  const stopDrag = () => { dragRef.current = null; };

  if (!imageSrc) return null;

  return (
    <div
      ref={containerRef}
      className="relative inline-block max-w-full max-h-full select-none"
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onMouseUp={stopDrag}
      onMouseLeave={stopDrag}
    >
      <img
        ref={imgRef}
        src={imageSrc}
        alt="Editing"
        crossOrigin="anonymous"
        className="max-w-full max-h-[65vh] object-contain"
        style={{ filter: buildFilterCSS(state), transform: transformCSS(state) }}
        draggable={false}
      />
      {/* Strokes overlay (visual only; baked into export) */}
      <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {state.strokes.map((stroke, i) => (
          stroke.points.length >= 2 ? (
            <polyline
              key={i}
              points={stroke.points.map((p) => `${p.x},${p.y}`).join(' ')}
              fill="none"
              stroke={stroke.color}
              strokeWidth={stroke.size / 4}
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          ) : null
        ))}
      </svg>
      {/* Text layers */}
      {state.textLayers.map((t) => (
        <div
          key={t.id}
          onMouseDown={(e) => { e.stopPropagation(); dragRef.current = t.id; }}
          className="absolute cursor-move whitespace-nowrap"
          style={{
            left: `${t.x}%`,
            top: `${t.y}%`,
            transform: 'translate(-50%, -50%)',
            fontSize: `${t.size * 0.4}px`,
            color: t.color,
            fontFamily: t.font,
            fontWeight: t.bold ? 700 : 400,
            fontStyle: t.italic ? 'italic' : 'normal',
            textShadow: '0 1px 4px rgba(0,0,0,0.3)',
          }}
        >
          {t.text || 'Text'}
        </div>
      ))}
      {/* Sticker layers */}
      {state.stickerLayers.map((s) => (
        <div
          key={s.id}
          onMouseDown={(e) => { e.stopPropagation(); dragRef.current = s.id; }}
          className="absolute cursor-move"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            transform: 'translate(-50%, -50%)',
            fontSize: `${s.size * 0.5}px`,
          }}
        >
          {s.emoji}
        </div>
      ))}
    </div>
  );
});

export default EditorCanvas;
