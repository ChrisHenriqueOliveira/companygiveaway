import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { EventTab } from '../../src/backstage/EventTab';
import { createEmptyData } from '../../src/domain/types';
import { resetActionsProvider } from '../../src/store/actions';
import { useAppStore } from '../../src/store/appStore';

beforeEach(() => {
  localStorage.clear();
  resetActionsProvider();
  useAppStore.setState({
    ...useAppStore.getState(),
    ...createEmptyData(),
    rehearsal: { active: false, draws: [], stage: { phase: 'idle' } },
    storageError: null,
  } as never);
});

describe('EventTab durations', () => {
  it('has one slider for the gift opening and another for the reel, each saved on its own', () => {
    render(<EventTab />);
    const gift = screen.getByRole('slider', { name: /abertura do presente/i });
    const reel = screen.getByRole('slider', { name: /duração do sorteio/i });
    expect(gift).not.toBe(reel);

    fireEvent.change(gift, { target: { value: '10' } });
    expect(useAppStore.getState().settings.giftSeconds).toBe(10);
    expect(useAppStore.getState().settings.suspenseSeconds).toBe(7);

    fireEvent.change(reel, { target: { value: '12' } });
    expect(useAppStore.getState().settings.suspenseSeconds).toBe(12);
    expect(useAppStore.getState().settings.giftSeconds).toBe(10);
  });
});
