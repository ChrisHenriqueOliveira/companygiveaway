import type { StagePhase } from '../domain/types';
import { selectActiveStage, type AppState } from '../store/appStore';

export type StageScreen = 'setup' | StagePhase;

/** Qual tela o palco mostra agora. "setup" enquanto não há o que sortear. */
export function deriveScreen(s: AppState): StageScreen {
  const hasPrizes = Object.keys(s.prizes).length > 0;
  if (s.participants.length === 0 || !hasPrizes) return 'setup';
  return selectActiveStage(s).phase;
}
