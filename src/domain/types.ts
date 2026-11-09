export type ID = string;

export interface Prize {
  id: ID;
  name: string;
  imageId?: ID;
  groupId?: ID;
  groupIndex?: number;
  groupSize?: number;
  createdAt: number;
}

/** E-mail sempre normalizado (trim + minúsculas). */
export interface Person {
  id: ID;
  name: string;
  email: string;
}
export type Participant = Person;
export type Excluded = Person;

export type DrawStatus = 'pending' | 'confirmed' | 'absent';

export interface DrawRecord {
  id: ID;
  prizeId: ID;
  prizeName: string;
  participantId: ID;
  name: string;
  email: string;
  status: DrawStatus;
  at: number;
}

export type StagePhase = 'idle' | 'prizeReveal' | 'drawing' | 'winnerReveal' | 'noEligible' | 'finale';

export interface StageState {
  phase: StagePhase;
  prizeId?: ID;
  drawId?: ID;
}

export interface Settings {
  eventName: string;
  logoImageId?: ID;
  /** Quanto o presente balança antes de abrir (2–15 s). */
  giftSeconds: number;
  /** Duração do rolo do sorteio (3–15 s). */
  suspenseSeconds: number;
}

export interface AppData {
  version: 1;
  prizes: Record<ID, Prize>;
  images: Record<ID, string>;
  queue: ID[];
  participants: Participant[];
  excluded: Excluded[];
  draws: DrawRecord[];
  settings: Settings;
  stage: StageState;
}

/** Visão que o motor do sorteio enxerga (real, ou real+ensaio). */
export interface DrawView {
  queue: ID[];
  prizes: Record<ID, Prize>;
  participants: Participant[];
  excluded: Excluded[];
  draws: DrawRecord[];
  stage: StageState;
}

export const DEFAULT_SETTINGS: Settings = {
  eventName: 'Sorteio de Fim de Ano Viceri 2026',
  giftSeconds: 4,
  suspenseSeconds: 7,
};

export function createEmptyData(): AppData {
  return {
    version: 1,
    prizes: {},
    images: {},
    queue: [],
    participants: [],
    excluded: [],
    draws: [],
    settings: { ...DEFAULT_SETTINGS },
    stage: { phase: 'idle' },
  };
}
