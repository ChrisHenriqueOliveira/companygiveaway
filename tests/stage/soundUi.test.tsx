import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EventTab } from '../../src/backstage/EventTab';
import { DEFAULT_SETTINGS, createEmptyData } from '../../src/domain/types';
import { resetActionsProvider } from '../../src/store/actions';
import { useAppStore } from '../../src/store/appStore';
import { stageKeyAction } from '../../src/stage/hotkeys';
import { resetStageLock } from '../../src/stage/lock';
import { StageApp } from '../../src/stage/StageApp';
import { DrawingScreen } from '../../src/stage/screens/DrawingScreen';

const playTick = vi.fn();
const playWin = vi.fn();
const playPop = vi.fn();
const playConfetti = vi.fn();
const stopRattle = vi.fn();
const startRattle = vi.fn((..._a: unknown[]) => stopRattle);
vi.mock('../../src/audio/reelSound', () => ({
  playTick: (...a: unknown[]) => playTick(...a),
  playWin: (...a: unknown[]) => playWin(...a),
  playPop: (...a: unknown[]) => playPop(...a),
  playConfetti: (...a: unknown[]) => playConfetti(...a),
  startRattle: (...a: unknown[]) => startRattle(...a),
  unlockAudio: () => undefined,
  __resetAudioForTests: () => undefined,
}));
vi.mock('../../src/stage/confetti', () => ({ burst: () => undefined, cannons: () => () => undefined, softRain: () => () => undefined }));
vi.mock('motion/react', async (importOriginal) => ({
  ...(await importOriginal<typeof import('motion/react')>()),
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

function reset() {
  localStorage.clear();
  resetActionsProvider();
  resetStageLock();
  useAppStore.setState({
    ...useAppStore.getState(),
    ...createEmptyData(),
    rehearsal: { active: false, draws: [], stage: { phase: 'idle' } },
    storageError: null,
  } as never);
  const s = useAppStore.getState();
  s.updateSettings({ giftSeconds: 2, suspenseSeconds: 3 });
  s.importParticipants([{ name: 'Ana', email: 'ana@v.com' }, { name: 'Bob', email: 'bob@v.com' }], 'replace');
  s.addPrizes({ name: 'Fone', quantity: 1 });
}

beforeEach(() => {
  playTick.mockClear();
  playWin.mockClear();
  playPop.mockClear();
  playConfetti.mockClear();
  stopRattle.mockClear();
  startRattle.mockClear();
  vi.useFakeTimers();
  reset();
});
afterEach(() => vi.useRealTimers());

describe('sound setting', () => {
  it('is on by default and can be toggled from settings', () => {
    expect(DEFAULT_SETTINGS.soundEnabled).toBe(true);
    useAppStore.getState().updateSettings({ soundEnabled: false });
    expect(useAppStore.getState().settings.soundEnabled).toBe(false);
    useAppStore.getState().updateSettings({ soundEnabled: true });
    expect(useAppStore.getState().settings.soundEnabled).toBe(true);
  });

  it('old saved data without the setting loads with sound on', async () => {
    const { migrate } = await import('../../src/store/persistence');
    const legacy = { ...createEmptyData(), settings: { eventName: 'X', suspenseSeconds: 5, giftSeconds: 3 } };
    expect(migrate(legacy).settings.soundEnabled).toBe(true);
  });

  it('Event tab has a switch for it', () => {
    render(<EventTab />);
    const sw = screen.getByRole('switch', { name: /som/i });
    expect(sw).toHaveAttribute('aria-checked', 'true');
    fireEvent.click(sw);
    expect(useAppStore.getState().settings.soundEnabled).toBe(false);
  });
});

describe('stage sound button and key', () => {
  it('has a super simple speaker icon next to the monitor that mutes and unmutes', () => {
    render(<StageApp />);
    const mute = screen.getByRole('button', { name: /desativar som/i });
    fireEvent.click(mute);
    expect(useAppStore.getState().settings.soundEnabled).toBe(false);
    const unmute = screen.getByRole('button', { name: /ativar som/i });
    fireEvent.click(unmute);
    expect(useAppStore.getState().settings.soundEnabled).toBe(true);
  });

  it('M toggles the sound (and is not a clicker key)', () => {
    expect(stageKeyAction({ key: 'm', ctrlKey: false, metaKey: false }, { typing: false, modalOpen: false })).toBe('mute');
    expect(stageKeyAction({ key: 'M', ctrlKey: false, metaKey: false }, { typing: true, modalOpen: false })).toBeNull();
    render(<StageApp />);
    fireEvent.keyDown(window, { key: 'm' });
    expect(useAppStore.getState().settings.soundEnabled).toBe(false);
    fireEvent.keyDown(window, { key: 'm' });
    expect(useAppStore.getState().settings.soundEnabled).toBe(true);
  });
});

describe('celebration sound when the reel locks on the winner', () => {
  function startDraw() {
    const s = useAppStore.getState();
    s.stageNext();
    s.stageStartDraw();
  }

  it('plays once when the reel selects the winner (same moment as the confetti)', () => {
    startDraw();
    render(<DrawingScreen />);
    expect(playWin).not.toHaveBeenCalled();
    act(() => void vi.advanceTimersByTime(2900));
    expect(playWin).not.toHaveBeenCalled();
    act(() => void vi.advanceTimersByTime(200));
    expect(playWin).toHaveBeenCalledTimes(1);
  });

  it('is silent when sound is off', () => {
    useAppStore.getState().updateSettings({ soundEnabled: false });
    startDraw();
    render(<DrawingScreen />);
    act(() => void vi.advanceTimersByTime(4000));
    expect(playWin).not.toHaveBeenCalled();
  });

  it('the reel itself never makes the gift or reveal sounds, and idle is silent', () => {
    render(<StageApp />);
    act(() => void vi.advanceTimersByTime(3000));
    expect(playTick).not.toHaveBeenCalled();
    expect(playWin).not.toHaveBeenCalled();
    expect(playPop).not.toHaveBeenCalled();
    expect(playConfetti).not.toHaveBeenCalled();
    expect(startRattle).not.toHaveBeenCalled();
  });
});

describe('gift sounds: rattle while it shakes, pop when it opens', () => {
  it('starts the rattle with the shaking time, then stops it and pops exactly when the lid flies', () => {
    render(<StageApp />);
    fireEvent.keyDown(window, { key: ' ' }); // próximo prêmio -> presente balançando
    expect(startRattle).toHaveBeenCalledTimes(1);
    expect(startRattle.mock.calls[0][0]).toBe(2000); // giftSeconds = 2
    expect(playPop).not.toHaveBeenCalled();

    act(() => void vi.advanceTimersByTime(1900));
    expect(stopRattle).not.toHaveBeenCalled();
    expect(playPop).not.toHaveBeenCalled();

    act(() => void vi.advanceTimersByTime(200)); // a tampa estoura
    expect(stopRattle).toHaveBeenCalledTimes(1);
    expect(playPop).toHaveBeenCalledTimes(1);
  });

  it('stops the rattle if the gift is cancelled before it opens', () => {
    render(<StageApp />);
    fireEvent.keyDown(window, { key: ' ' });
    act(() => useAppStore.getState().stageBackToIdle());
    expect(stopRattle).toHaveBeenCalledTimes(1);
    expect(playPop).not.toHaveBeenCalled();
  });

  it('is silent when sound is off (the rattle is asked, but its on/off check says no; no pop)', () => {
    useAppStore.getState().updateSettings({ soundEnabled: false });
    render(<StageApp />);
    fireEvent.keyDown(window, { key: ' ' });
    const isOn = startRattle.mock.calls[0]?.[1] as (() => boolean) | undefined;
    expect(isOn?.()).toBe(false);
    act(() => void vi.advanceTimersByTime(2100));
    expect(playPop).not.toHaveBeenCalled();
  });
});

describe('winner reveal ("Temos um sortudo!") plays the confetti sound with the visual confetti', () => {
  function toWinnerReveal() {
    const s = useAppStore.getState();
    s.stageNext();
    s.stageStartDraw();
    s.stageFinishDrawing();
  }

  it('plays once, when the cannons start (the name appears)', () => {
    toWinnerReveal();
    render(<StageApp />);
    act(() => void vi.advanceTimersByTime(2000));
    expect(playConfetti).not.toHaveBeenCalled();
    act(() => void vi.advanceTimersByTime(500)); // 2,3 s: nome + canhões
    expect(playConfetti).toHaveBeenCalledTimes(1);
  });

  it('is silent when sound is off', () => {
    useAppStore.getState().updateSettings({ soundEnabled: false });
    toWinnerReveal();
    render(<StageApp />);
    act(() => void vi.advanceTimersByTime(5000));
    expect(playConfetti).not.toHaveBeenCalled();
  });
});
