import { useAppStore, type AppActions } from './appStore';

export type ActionName = keyof AppActions;

export const ACTION_NAMES: readonly ActionName[] = [
  'addPrizes',
  'updatePrize',
  'removePrize',
  'reorderQueue',
  'shuffleQueue',
  'importParticipants',
  'addParticipant',
  'removeParticipant',
  'addExcluded',
  'removeExcluded',
  'updateSettings',
  'setRehearsal',
  'stageNext',
  'stageStartDraw',
  'stageFinishDrawing',
  'stageConfirm',
  'stageAbsent',
  'stageBackToIdle',
  'stageForcePrize',
  'undoLast',
  'removeDraw',
  'restoreBackup',
  'resetAll',
];

export function pickActions(s: AppActions): AppActions {
  return Object.fromEntries(ACTION_NAMES.map((n) => [n, s[n]])) as unknown as AppActions;
}

const localActions = () => pickActions(useAppStore.getState());
let provider: () => AppActions = localActions;

/** Palco: ações locais. Controle: proxy que envia comandos ao palco (Task 9). */
export function setActionsProvider(p: () => AppActions): void {
  provider = p;
}

export function resetActionsProvider(): void {
  provider = localActions;
}

export function useActions(): AppActions {
  return provider();
}
