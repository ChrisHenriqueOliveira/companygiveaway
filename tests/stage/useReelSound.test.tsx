import { renderHook } from '@testing-library/react';
import { motionValue } from 'motion/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const playTick = vi.fn();
const playWin = vi.fn();
const whooshSet = vi.fn();
const whooshStop = vi.fn();
const startWhoosh = vi.fn(() => ({ set: whooshSet, stop: whooshStop }));
vi.mock('../../src/audio/reelSound', () => ({
  playTick: (...a: unknown[]) => playTick(...a),
  playWin: (...a: unknown[]) => playWin(...a),
  startWhoosh: () => startWhoosh(),
  unlockAudio: () => undefined,
  __resetAudioForTests: () => undefined,
}));

import { useReelSound } from '../../src/audio/useReelSound';

beforeEach(() => {
  playTick.mockClear();
  playWin.mockClear();
  whooshSet.mockClear();
  whooshStop.mockClear();
  startWhoosh.mockClear();
});

describe('whoosh of the spinning reel', () => {
  it('follows the speed, and fades out (stops) when the reel goes away', () => {
    const pos = motionValue(0);
    const vel = motionValue(0);
    const { unmount } = renderHook(() => useReelSound(pos, vel, true));
    vel.set(12);
    pos.set(0.2);
    expect(startWhoosh).toHaveBeenCalledTimes(1);
    expect(whooshSet).toHaveBeenLastCalledWith(12);
    vel.set(-3);
    expect(whooshSet).toHaveBeenLastCalledWith(3);
    unmount();
    expect(whooshStop).toHaveBeenCalledTimes(1);
  });

  it('makes no whoosh when sound is off', () => {
    const pos = motionValue(0);
    const vel = motionValue(5);
    renderHook(() => useReelSound(pos, vel, false));
    pos.set(1);
    vel.set(9);
    expect(startWhoosh).not.toHaveBeenCalled();
  });
});

describe('useReelSound (sincronizado com a posição do rolo)', () => {
  it('ticks once per name that reaches the center, following the position — whatever the speed', () => {
    const pos = motionValue(2);
    const vel = motionValue(0);
    renderHook(() => useReelSound(pos, vel, true));

    pos.set(2.3);
    expect(playTick).not.toHaveBeenCalled();
    pos.set(2.6);
    expect(playTick).toHaveBeenCalledTimes(1);

    // muda o ritmo: avança 4 linhas de uma vez e depois quase para
    vel.set(30);
    pos.set(6.7);
    expect(playTick).toHaveBeenCalledTimes(2);
    vel.set(0.5);
    pos.set(6.8);
    pos.set(7.6);
    expect(playTick).toHaveBeenCalledTimes(3);
  });

  it('passes the current speed (rows/s, absolute) so pitch and volume follow the animation', () => {
    const pos = motionValue(0);
    const vel = motionValue(-18);
    renderHook(() => useReelSound(pos, vel, true));
    pos.set(1);
    expect(playTick).toHaveBeenLastCalledWith(18);
  });

  it('is silent when sound is off, and starts ticking as soon as it is turned on', () => {
    const pos = motionValue(0);
    const vel = motionValue(5);
    const { rerender } = renderHook(({ on }) => useReelSound(pos, vel, on), { initialProps: { on: false } });
    pos.set(1);
    pos.set(2);
    expect(playTick).not.toHaveBeenCalled();

    rerender({ on: true });
    pos.set(3);
    expect(playTick).toHaveBeenCalledTimes(1);
  });

  it('stops listening when the reel goes away', () => {
    const pos = motionValue(0);
    const vel = motionValue(5);
    const { unmount } = renderHook(() => useReelSound(pos, vel, true));
    unmount();
    pos.set(5);
    expect(playTick).not.toHaveBeenCalled();
  });
});
