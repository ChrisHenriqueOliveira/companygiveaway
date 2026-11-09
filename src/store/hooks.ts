import { useMemo } from 'react';
import type { AppData, DrawView } from '../domain/types';
import { selectCanUndo, selectView, useAppStore } from './appStore';
import { estimateUsage } from './persistence';

/** Visão do motor (real, ou real+ensaio), memorizada para não recalcular a cada render. */
export function useView(): DrawView {
  const s = useAppStore();
  return useMemo(() => selectView(s), [s.queue, s.prizes, s.participants, s.excluded, s.draws, s.stage, s.rehearsal]);
}

export function useCanUndo(): boolean {
  const s = useAppStore();
  return useMemo(() => selectCanUndo(s), [s.draws, s.stage, s.rehearsal]);
}

export function useUsage(): { chars: number; ratio: number } {
  const prizes = useAppStore((s) => s.prizes);
  const images = useAppStore((s) => s.images);
  const queue = useAppStore((s) => s.queue);
  const participants = useAppStore((s) => s.participants);
  const excluded = useAppStore((s) => s.excluded);
  const draws = useAppStore((s) => s.draws);
  const settings = useAppStore((s) => s.settings);
  const stage = useAppStore((s) => s.stage);
  return useMemo(() => {
    const data: AppData = { version: 1, prizes, images, queue, participants, excluded, draws, settings, stage };
    return estimateUsage(data);
  }, [prizes, images, queue, participants, excluded, draws, settings, stage]);
}
