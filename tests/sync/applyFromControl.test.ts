import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createEmptyData } from '../../src/domain/types';
import { isStageLocked, resetStageLock } from '../../src/stage/lock';
import { useAppStore } from '../../src/store/appStore';
import { applyFromControl } from '../../src/sync/ownerBridge';

beforeEach(() => {
  vi.useFakeTimers();
  localStorage.clear();
  resetStageLock();
  useAppStore.setState({
    ...useAppStore.getState(),
    ...createEmptyData(),
    rehearsal: { active: false, draws: [], stage: { phase: 'idle' } },
    storageError: null,
  } as never);
  const s = useAppStore.getState();
  s.importParticipants([{ name: 'Ana', email: 'ana@v.com' }, { name: 'Bob', email: 'bob@v.com' }], 'replace');
  s.addPrizes({ name: 'P1', quantity: 1 });
  s.addPrizes({ name: 'P2', quantity: 1 });
});
afterEach(() => vi.useRealTimers());

const phase = () => useAppStore.getState().stage.phase;

describe('actions coming from the Control window respect the stage lock', () => {
  it('a stage action from the Control locks the stage, so a clicker press right after cannot advance a second step', () => {
    applyFromControl('stageNext', []);
    expect(phase()).toBe('prizeReveal');
    expect(isStageLocked()).toBe(true);
  });

  it('stagePrimary from the Control is ignored while locked, and works (and locks) once free', () => {
    applyFromControl('stagePrimary', []);
    expect(phase()).toBe('prizeReveal');
    applyFromControl('stagePrimary', []); // clique duplo / clicker logo depois
    expect(phase()).toBe('prizeReveal');

    vi.advanceTimersByTime(3000);
    applyFromControl('stagePrimary', []);
    expect(phase()).toBe('drawing');
  });

  it('registrations (non-stage actions) do not lock the stage', () => {
    applyFromControl('addParticipant', [{ name: 'Caio', email: 'caio@v.com' }]);
    expect(useAppStore.getState().participants).toHaveLength(3);
    expect(isStageLocked()).toBe(false);
  });
});
