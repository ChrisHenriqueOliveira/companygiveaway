import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ControlApp } from '../../src/control/ControlApp';
import { createEmptyData } from '../../src/domain/types';
import { useAppStore } from '../../src/store/appStore';
import { STORAGE_ERROR_MESSAGE } from '../../src/store/persistence';

beforeEach(() => {
  useAppStore.setState({
    ...useAppStore.getState(),
    ...createEmptyData(),
    rehearsal: { active: false, draws: [], stage: { phase: 'idle' } },
    storageError: null,
  } as never);
});

afterEach(() => vi.restoreAllMocks());

describe('ControlApp', () => {
  it('shows save failures to the operator (they arrive in every state message)', () => {
    // O palco real falha ao gravar (cota); aqui a store persiste de verdade, então a cota precisa estourar de verdade.
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    useAppStore.setState({ storageError: STORAGE_ERROR_MESSAGE });
    render(<ControlApp />);
    expect(screen.getByText(STORAGE_ERROR_MESSAGE)).toBeInTheDocument();
  });

  it('shows no storage banner when everything is saved', () => {
    render(<ControlApp />);
    expect(screen.queryByText(STORAGE_ERROR_MESSAGE)).not.toBeInTheDocument();
  });
});
