import { useCallback, useEffect, useRef, useState } from 'react';
import { defaultEditorState, type EditorState } from './types';
import { supabase, type Project } from '@/lib/supabase';
import { useToast } from '@/lib/toast';

export function useEditorState() {
  const [state, setState] = useState<EditorState>(defaultEditorState());
  const [history, setHistory] = useState<EditorState[]>([defaultEditorState()]);
  const [index, setIndex] = useState(0);
  const skipHistoryRef = useRef(false);
  const { toast } = useToast();

  // Commit a new state and push to history
  const commit = useCallback((updater: (prev: EditorState) => EditorState) => {
    setState((prev) => {
      const next = updater(prev);
      if (skipHistoryRef.current) {
        skipHistoryRef.current = false;
        return next;
      }
      setHistory((h) => {
        const trimmed = h.slice(0, index + 1);
        return [...trimmed, next];
      });
      setIndex((i) => i + 1);
      return next;
    });
  }, [index]);

  // Update without recording history (live slider dragging)
  const update = useCallback((updater: (prev: EditorState) => EditorState) => {
    setState((prev) => updater(prev));
  }, []);

  // Commit current state to history (on slider release)
  const commitCurrent = useCallback(() => {
    setHistory((h) => {
      const trimmed = h.slice(0, index + 1);
      return [...trimmed, state];
    });
    setIndex((i) => i + 1);
  }, [state, index]);

  const undo = useCallback(() => {
    if (index > 0) {
      setIndex((i) => i - 1);
      setState(history[index - 1]);
    }
  }, [history, index]);

  const redo = useCallback(() => {
    if (index < history.length - 1) {
      setIndex((i) => i + 1);
      setState(history[index + 1]);
    }
  }, [history, index]);

  const reset = useCallback(() => {
    commit(() => defaultEditorState());
    toast('Reset to original', 'info');
  }, [commit, toast]);

  const canUndo = index > 0;
  const canRedo = index < history.length - 1;

  return { state, commit, update, commitCurrent, undo, redo, reset, canUndo, canRedo, setState };
}

export function useProjectPersistence(
  state: EditorState,
  imageSrc: string | null,
  projectId: string | null,
) {
  const [saving, setSaving] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(projectId);
  const { toast } = useToast();

  const save = useCallback(async (name?: string) => {
    if (!imageSrc) {
      toast('Upload an image first', 'error');
      return null;
    }
    setSaving(true);
    const thumb = await generateThumbnail(imageSrc, 400);
    const payload = {
      name: name ?? 'Untitled Project',
      image_url: imageSrc,
      thumbnail: thumb,
      settings: state as unknown as Record<string, unknown>,
    };
    let result: Project | null = null;
    if (currentId) {
      const { data, error } = await supabase.from('projects').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', currentId).select().maybeSingle();
      if (error) {
        setSaving(false);
        toast('Could not save project', 'error');
        return null;
      }
      result = data;
    } else {
      const { data, error } = await supabase.from('projects').insert(payload).select().maybeSingle();
      if (error) {
        setSaving(false);
        toast('Could not save project', 'error');
        return null;
      }
      result = data;
      setCurrentId(data.id);
    }
    setSaving(false);
    toast('Project saved', 'success');
    return result;
  }, [state, imageSrc, currentId, toast]);

  return { save, saving, currentId };
}

function generateThumbnail(src: string, maxW: number): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const scale = Math.min(1, maxW / img.width);
      const canvas = document.createElement('canvas');
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(src);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.7));
    };
    img.onerror = () => resolve(src);
    img.src = src;
  });
}
