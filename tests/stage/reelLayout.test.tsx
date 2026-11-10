import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Mascot, type Mood } from '../../src/mascot/Presentinho';
import { ViceriMark } from '../../src/brand/ViceriMark';
import { createEmptyData } from '../../src/domain/types';
import { useAppStore } from '../../src/store/appStore';
import { DrawingScreen } from '../../src/stage/screens/DrawingScreen';

vi.mock('../../src/stage/confetti', () => ({ burst: () => undefined, cannons: () => () => undefined, softRain: () => () => undefined }));

beforeEach(() => {
  useAppStore.setState({
    ...useAppStore.getState(),
    ...createEmptyData(),
    rehearsal: { active: false, draws: [], stage: { phase: 'idle' } },
    storageError: null,
  } as never);
  const s = useAppStore.getState();
  s.importParticipants([{ name: 'Ana', email: 'ana@v.com' }, { name: 'Bob', email: 'bob@v.com' }], 'replace');
  s.addPrizes({ name: 'Fone', quantity: 1 });
  s.stageNext();
  s.stageStartDraw();
});

describe('DrawingScreen (rolo)', () => {
  it('shows no "Sorteando…" / "Achamos!" caption on the stage', () => {
    render(<DrawingScreen />);
    expect(screen.queryByText(/sorteando…|achamos/i)).not.toBeInTheDocument();
  });

  it('keeps the reel in the middle column of a symmetric 3-column grid, so it is centered on the screen', () => {
    const { container } = render(<DrawingScreen />);
    const reel = screen.getByLabelText('Sorteando');
    const grid = container.querySelector('.grid') as HTMLElement;
    expect(grid.className).toContain('grid-cols-[1fr_auto_1fr]');
    expect(grid.children).toHaveLength(3);
    expect(grid.children[1].contains(reel)).toBe(true);
  });
});

describe('brand', () => {
  it('the mascot renders in every mood', () => {
    for (const mood of ['idle', 'excited', 'suspense', 'celebrate', 'sad'] as Mood[]) {
      const { unmount } = render(<Mascot mood={mood} size={120} />);
      expect(screen.getByRole('img', { name: /vi, o mascote da viceri/i })).toBeInTheDocument();
      unmount();
    }
  });

  it('the logo mark is the Viceri ring in the brand red by default', () => {
    const { container } = render(<ViceriMark size={40} />);
    const path = container.querySelector('path') as SVGPathElement;
    expect(path.getAttribute('fill')?.toLowerCase()).toBe('#fd4237');
    expect(path.getAttribute('fill-rule')).toBe('evenodd');
  });
});
