import { create, type StateCreator, type StoreApi, type UseBoundStore } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';
import {
  canUndo,
  confirmWinner,
  finishDrawing,
  markAbsentAndRedraw,
  nextPrize,
  startDraw,
  undoLast,
  type ViewPatch,
} from '../domain/engine';
import { normalizeEmail } from '../domain/email';
import { validateNewPerson } from '../domain/people';
import { expandPrizeInput } from '../domain/prizes';
import { newId, sampleUnique } from '../domain/random';
import {
  createEmptyData,
  type AppData,
  type DrawRecord,
  type DrawView,
  type ID,
  type Participant,
  type Settings,
  type StageState,
} from '../domain/types';
import {
  createSafeStorage,
  migrate,
  normalizeOnLoad,
  STORAGE_ERROR_MESSAGE,
  STORAGE_KEY,
} from './persistence';

export interface Rehearsal {
  active: boolean;
  draws: DrawRecord[];
  stage: StageState;
}

export interface AppState extends AppData {
  rehearsal: Rehearsal;
  storageError: string | null;
}

export interface AppActions {
  addPrizes(input: { name: string; image?: string; quantity: number }): void;
  updatePrize(id: ID, patch: { name?: string; image?: string | null }): void;
  removePrize(id: ID): void;
  reorderQueue(ids: ID[]): void;
  shuffleQueue(): void;
  importParticipants(people: Array<{ name: string; email: string }>, mode: 'replace' | 'append'): void;
  addParticipant(p: { name: string; email: string }): void;
  removeParticipant(id: ID): void;
  addExcluded(p: { name: string; email: string }): void;
  removeExcluded(id: ID): void;
  updateSettings(patch: Partial<Settings> & { logo?: string | null }): void;
  setRehearsal(active: boolean): void;
  stageNext(): void;
  stageStartDraw(): void;
  stageFinishDrawing(): void;
  stageConfirm(): void;
  stageAbsent(): void;
  undoLast(): void;
  restoreBackup(d: AppData): void;
  resetAll(): void;
}

export type AppStore = AppState & AppActions;

const freshRehearsal = (): Rehearsal => ({ active: false, draws: [], stage: { phase: 'idle' } });

/** Visão que o motor enxerga: no ensaio, sorteios reais + de teste (ganhadores reais continuam inelegíveis). */
export function selectView(s: AppState): DrawView {
  const base = {
    queue: s.queue,
    prizes: s.prizes,
    participants: s.participants,
    excluded: s.excluded,
  };
  if (s.rehearsal.active) {
    return { ...base, draws: [...s.draws, ...s.rehearsal.draws], stage: s.rehearsal.stage };
  }
  return { ...base, draws: s.draws, stage: s.stage };
}

export function selectActiveStage(s: AppState): StageState {
  return s.rehearsal.active ? s.rehearsal.stage : s.stage;
}

/** No ensaio, desfazer só enxerga os sorteios de teste (nunca os reais). */
export function selectUndoView(s: AppState): DrawView {
  if (s.rehearsal.active) {
    return { ...selectView(s), draws: s.rehearsal.draws };
  }
  return selectView(s);
}

export function selectCanUndo(s: AppState): boolean {
  return canUndo(selectUndoView(s));
}

function referencedImages(prizes: AppData['prizes'], logoImageId?: ID): Set<ID> {
  const used = new Set<ID>();
  Object.values(prizes).forEach((p) => p.imageId && used.add(p.imageId));
  if (logoImageId) used.add(logoImageId);
  return used;
}

function gcImages(images: AppData['images'], prizes: AppData['prizes'], logoImageId?: ID): AppData['images'] {
  const used = referencedImages(prizes, logoImageId);
  return Object.fromEntries(Object.entries(images).filter(([id]) => used.has(id)));
}

/** Só os dados do evento (sem ensaio nem erro de storage): o que se persiste e o que o Controle espelha. */
export const selectData = (s: AppState): AppData => dataKeys(s);

const dataKeys = (s: AppState): AppData => ({
  version: 1,
  prizes: s.prizes,
  images: s.images,
  queue: s.queue,
  participants: s.participants,
  excluded: s.excluded,
  draws: s.draws,
  settings: s.settings,
  stage: s.stage,
});

export function createAppStore(opts: { persist: boolean; storage?: StateStorage }): UseBoundStore<StoreApi<AppStore>> {
  const holder: { api?: StoreApi<AppStore> } = {};

  const creator: StateCreator<AppStore> = (set, get) => {
    /** Aplica o patch do motor no lugar certo: estado real ou ensaio. */
    const applyPatch = (patch: ViewPatch) => {
      if (Object.keys(patch).length === 0) return;
      const s = get();
      if (s.rehearsal.active) {
        const realIds = new Set(s.draws.map((d) => d.id));
        set({
          rehearsal: {
            ...s.rehearsal,
            draws: patch.draws ? patch.draws.filter((d) => !realIds.has(d.id)) : s.rehearsal.draws,
            stage: patch.stage ?? s.rehearsal.stage,
          },
        });
        return; // a fila real nunca muda durante o ensaio
      }
      set({
        ...(patch.queue ? { queue: patch.queue } : {}),
        ...(patch.draws ? { draws: patch.draws } : {}),
        ...(patch.stage ? { stage: patch.stage } : {}),
      });
    };

    const hasConfirmed = (id: ID, key: 'prizeId' | 'participantId') =>
      get().draws.some((d) => d.status === 'confirmed' && d[key] === id);

    return {
      ...createEmptyData(),
      rehearsal: freshRehearsal(),
      storageError: null,

      addPrizes: ({ name, image, quantity }) => {
        const s = get();
        const imageId = image ? newId() : undefined;
        let prizes;
        try {
          prizes = expandPrizeInput({ name, imageId, quantity }, Date.now());
        } catch {
          return;
        }
        set({
          prizes: { ...s.prizes, ...Object.fromEntries(prizes.map((p) => [p.id, p])) },
          images: imageId && image ? { ...s.images, [imageId]: image } : s.images,
          queue: [...s.queue, ...prizes.map((p) => p.id)],
        });
      },

      updatePrize: (id, patch) => {
        const s = get();
        const prize = s.prizes[id];
        if (!prize) return;
        const next = { ...prize };
        if (patch.name !== undefined && patch.name.trim()) next.name = patch.name.trim();
        let images = s.images;
        if (typeof patch.image === 'string') {
          const imageId = newId();
          images = { ...images, [imageId]: patch.image };
          next.imageId = imageId;
        } else if (patch.image === null) {
          delete next.imageId;
        }
        const prizes = { ...s.prizes, [id]: next };
        set({ prizes, images: gcImages(images, prizes, s.settings.logoImageId) });
      },

      removePrize: (id) => {
        const s = get();
        if (!s.prizes[id] || hasConfirmed(id, 'prizeId')) return;
        if (s.stage.prizeId === id || s.rehearsal.stage.prizeId === id) return;
        const prizes = { ...s.prizes };
        delete prizes[id];
        set({
          prizes,
          queue: s.queue.filter((q) => q !== id),
          images: gcImages(s.images, prizes, s.settings.logoImageId),
        });
      },

      reorderQueue: (ids) => {
        const cur = get().queue;
        if (ids.length !== cur.length || new Set(ids).size !== ids.length) return;
        const curSet = new Set(cur);
        if (!ids.every((i) => curSet.has(i))) return;
        set({ queue: ids });
      },

      shuffleQueue: () => set((s) => ({ queue: sampleUnique(s.queue, s.queue.length) })),

      importParticipants: (people, mode) => {
        const s = get();
        const oldByEmail = new Map(s.participants.map((p) => [normalizeEmail(p.email), p]));
        const result = new Map<string, Participant>();
        if (mode === 'append') s.participants.forEach((p) => result.set(normalizeEmail(p.email), p));
        for (const raw of people) {
          const email = normalizeEmail(raw.email);
          const name = raw.name.trim();
          if (!email || !name) continue;
          const id = oldByEmail.get(email)?.id ?? newId();
          result.set(email, { id, name, email }); // o registro mais novo vence no nome
        }
        if (mode === 'replace') {
          const withDraws = new Set(s.draws.map((d) => d.participantId));
          s.participants.forEach((p) => {
            const email = normalizeEmail(p.email);
            if (withDraws.has(p.id) && !result.has(email)) result.set(email, p);
          });
        }
        set({ participants: [...result.values()] });
      },

      addParticipant: (p) => {
        const s = get();
        const v = validateNewPerson(s.participants, p);
        if (v.ok) set({ participants: [...s.participants, { id: newId(), ...v.person }] });
      },

      removeParticipant: (id) => {
        if (hasConfirmed(id, 'participantId')) return;
        set((s) => ({ participants: s.participants.filter((p) => p.id !== id) }));
      },

      addExcluded: (p) => {
        const s = get();
        const v = validateNewPerson(s.excluded, p);
        if (v.ok) set({ excluded: [...s.excluded, { id: newId(), ...v.person }] });
      },

      removeExcluded: (id) => set((s) => ({ excluded: s.excluded.filter((p) => p.id !== id) })),

      updateSettings: (patch) => {
        const s = get();
        const settings = { ...s.settings };
        if (patch.eventName !== undefined && patch.eventName.trim()) settings.eventName = patch.eventName.trim();
        if (patch.suspenseSeconds !== undefined) {
          settings.suspenseSeconds = Math.min(15, Math.max(3, Math.round(patch.suspenseSeconds)));
        }
        let images = s.images;
        if (typeof patch.logo === 'string') {
          const id = newId();
          images = { ...images, [id]: patch.logo };
          settings.logoImageId = id;
        } else if (patch.logo === null) {
          delete settings.logoImageId;
        }
        set({ settings, images: gcImages(images, s.prizes, settings.logoImageId) });
      },

      setRehearsal: (active) => set({ rehearsal: { ...freshRehearsal(), active } }),

      stageNext: () => applyPatch(nextPrize(selectView(get()))),
      stageStartDraw: () => applyPatch(startDraw(selectView(get()), Date.now())),
      stageFinishDrawing: () => applyPatch(finishDrawing(selectView(get()))),
      stageConfirm: () => applyPatch(confirmWinner(selectView(get()))),
      stageAbsent: () => applyPatch(markAbsentAndRedraw(selectView(get()), Date.now())),
      undoLast: () => {
        const s = get();
        if (s.rehearsal.active) {
          const patch = undoLast(selectUndoView(s));
          if (patch.draws) {
            set({ rehearsal: { ...s.rehearsal, draws: patch.draws, stage: patch.stage ?? s.rehearsal.stage } });
          }
          return;
        }
        applyPatch(undoLast(selectView(s)));
      },

      restoreBackup: (d) =>
        set({ ...normalizeOnLoad(migrate(d)), rehearsal: freshRehearsal(), storageError: null }),

      resetAll: () => set({ ...createEmptyData(), rehearsal: freshRehearsal(), storageError: null }),
    };
  };

  if (!opts.persist) return create<AppStore>()(creator);

  const storage = createSafeStorage(
    () => {
      const api = holder.api;
      if (api && !api.getState().storageError) api.setState({ storageError: STORAGE_ERROR_MESSAGE });
    },
    {
      base: opts.storage,
      onOk: () => {
        const api = holder.api;
        if (api && api.getState().storageError) api.setState({ storageError: null });
      },
    },
  );

  const store = create<AppStore>()(
    persist(creator, {
      name: STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => storage),
      partialize: (s) => dataKeys(s) as unknown as AppStore,
      merge: (persisted, current) => ({ ...current, ...normalizeOnLoad(migrate(persisted)) }),
    }),
  );
  holder.api = store;
  return store;
}

export const isControlWindow = () =>
  typeof location !== 'undefined' && location.hash.startsWith('#/controle');

/** Singleton usado pelas duas janelas. A janela de Controle nunca persiste (é só espelho). */
export const useAppStore = createAppStore({ persist: !isControlWindow() });
