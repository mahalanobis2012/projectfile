export type Adjustments = {
  brightness: number;
  contrast: number;
  saturation: number;
  exposure: number;
  blur: number;
  sharpen: number;
  hue: number;
  sepia: number;
  grayscale: number;
  invert: number;
};

export type FilterId =
  | 'none'
  | 'vivid'
  | 'vintage'
  | 'noir'
  | 'cool'
  | 'warm'
  | 'fade'
  | 'dramatic'
  | 'pastel';

export type Filter = {
  id: FilterId;
  name: string;
  // partial adjustments applied on top
  adjustments: Partial<Adjustments>;
};

export const FILTERS: Filter[] = [
  { id: 'none', name: 'Original', adjustments: {} },
  { id: 'vivid', name: 'Vivid', adjustments: { saturation: 160, contrast: 120 } },
  { id: 'vintage', name: 'Vintage', adjustments: { sepia: 50, contrast: 90, saturation: 80 } },
  { id: 'noir', name: 'Noir', adjustments: { grayscale: 100, contrast: 130 } },
  { id: 'cool', name: 'Cool', adjustments: { hue: 200, saturation: 110 } },
  { id: 'warm', name: 'Warm', adjustments: { hue: 20, saturation: 130, brightness: 105 } },
  { id: 'fade', name: 'Fade', adjustments: { contrast: 80, saturation: 70, brightness: 110 } },
  { id: 'dramatic', name: 'Dramatic', adjustments: { contrast: 150, saturation: 90, brightness: 95 } },
  { id: 'pastel', name: 'Pastel', adjustments: { saturation: 70, brightness: 110, contrast: 90 } },
];

export const DEFAULT_ADJUSTMENTS: Adjustments = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  exposure: 0,
  blur: 0,
  sharpen: 0,
  hue: 0,
  sepia: 0,
  grayscale: 0,
  invert: 0,
};

export type TextLayer = {
  id: string;
  text: string;
  x: number; // percentage 0-100
  y: number;
  size: number;
  color: string;
  font: string;
  bold: boolean;
  italic: boolean;
};

export type StickerLayer = {
  id: string;
  emoji: string;
  x: number;
  y: number;
  size: number;
};

export type Stroke = {
  points: { x: number; y: number }[];
  color: string;
  size: number;
};

export type EditorState = {
  adjustments: Adjustments;
  filter: FilterId;
  rotation: number;
  flipH: boolean;
  flipV: boolean;
  crop: { x: number; y: number; w: number; h: number } | null;
  textLayers: TextLayer[];
  stickerLayers: StickerLayer[];
  strokes: Stroke[];
  bgRemoved: boolean;
  blurBg: boolean;
  enhanced: boolean;
};

export function defaultEditorState(): EditorState {
  return {
    adjustments: { ...DEFAULT_ADJUSTMENTS },
    filter: 'none',
    rotation: 0,
    flipH: false,
    flipV: false,
    crop: null,
    textLayers: [],
    stickerLayers: [],
    strokes: [],
    bgRemoved: false,
    blurBg: false,
    enhanced: false,
  };
}

export function buildFilterCSS(state: EditorState): string {
  const base = state.adjustments;
  const filterAdj = FILTERS.find((f) => f.id === state.filter)?.adjustments ?? {};
  const a = { ...base, ...filterAdj };
  const parts: string[] = [];
  parts.push(`brightness(${a.brightness}%)`);
  parts.push(`contrast(${a.contrast}%)`);
  parts.push(`saturate(${a.saturation}%)`);
  if (a.exposure !== 0) parts.push(`brightness(${1 + a.exposure / 100})`);
  if (a.blur > 0) parts.push(`blur(${a.blur}px)`);
  if (a.sharpen > 0) {
    // approximate sharpen via contrast + saturate (CSS has no sharpen)
    parts.push(`contrast(${100 + a.sharpen}%)`);
  }
  if (a.hue !== 0) parts.push(`hue-rotate(${a.hue}deg)`);
  if (a.sepia > 0) parts.push(`sepia(${a.sepia}%)`);
  if (a.grayscale > 0) parts.push(`grayscale(${a.grayscale}%)`);
  if (a.invert > 0) parts.push(`invert(${a.invert}%)`);
  return parts.join(' ');
}

export function transformCSS(state: EditorState): string {
  const parts: string[] = [];
  parts.push(`rotate(${state.rotation}deg)`);
  parts.push(`scaleX(${state.flipH ? -1 : 1})`);
  parts.push(`scaleY(${state.flipV ? -1 : 1})`);
  return parts.join(' ');
}
