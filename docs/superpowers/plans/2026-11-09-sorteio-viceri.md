# Sorteio Viceri — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** App one-page de sorteio de prêmios, temática Duolingo, que roda offline num único `index.html`, com palco no telão e janela de Controle no notebook do operador.

**Architecture:**
- **Domínio:** um motor de sorteio puro (sem React) decide as transições de fase, a elegibilidade e o desfazer.
- **Estado:** uma store Zustand na janela do palco (a "dona") aplica esse motor e persiste em `localStorage`.
- **Janela de Controle:** espelha o estado via `postMessage` e envia comandos pelo nome da ação.
- **UI:** React + Tailwind v4 + Framer Motion, com componentes 3D "gordinhos" e um mascote SVG original.

**Tech Stack:** Vite 6, React 19, TypeScript 5 (strict), Tailwind CSS v4 (`@tailwindcss/vite`), Framer Motion (`motion`), Zustand 5, dnd-kit (`@dnd-kit/core`, `@dnd-kit/sortable`), SheetJS (`xlsx` via `https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz`), canvas-confetti, lucide-react, `@fontsource/nunito`, vite-plugin-singlefile, Vitest + jsdom + @testing-library/react.

**Spec:** `docs/superpowers/specs/2026-11-09-sorteio-viceri-design.md` (leia antes de qualquer tarefa; as seções citadas abaixo como §N são de lá).

## Global Constraints

- Todo texto de UI em PT-BR, tom leve e brincalhão (§9).
- **Nenhum áudio**, em lugar nenhum.
- O palco **nunca** mostra: contador de prêmios, quantidade restante, fila, número de elegíveis, nem qualquer indício de último prêmio. O botão "Próximo prêmio" é sempre idêntico e sempre ativo.
- Sem "grand finale": o último prêmio usa exatamente a mesma animação.
- Paleta exata: verde `#58CC02`/sombra `#58A700`, verde claro `#89E219`, azul `#1CB0F6`/`#1899D6`, vermelho `#FF4B4B`/`#EA2B2B`, amarelo `#FFC800`/`#E5B400`, laranja `#FF9600`, roxo `#CE82FF`, texto `#4B4B4B`, secundário `#777777`, borda `#E5E5E5`, fundos `#FFFFFF`/`#F7F7F7`.
- Fonte Nunito, embutida via `@fontsource/nunito` (pesos 600, 700, 800, 900). Nenhum recurso carregado da internet em runtime.
- Não usar o Duo (coruja), nem a logo ou os assets do Duolingo. O mascote é o "Presentinho" original (§9).
- Chave de storage: `sorteio-viceri:v1`; campo `version: 1`.
- Suspense: slider de 3 a 15 s, padrão 7 s.
- Imagens: máximo de 640px no maior lado, WebP qualidade 0.8 (fallback JPEG 0.8), alvo < 80 KB.
- Aleatoriedade só via `crypto.getRandomValues`. `Math.random` é proibido em código de sorteio.
- Teclas do palco: `Espaço`/`Enter`/`ArrowRight`/`PageDown` = ação principal; `R` = ausente; `F` = tela cheia; `Ctrl+K` = Bastidores; `Esc` = fechar modal. As teclas `B`, `.`, `W` e `PageUp` são ignoradas no palco.
- O build final é um único `dist/index.html` que funciona aberto por `file://` no Chrome e no Edge.
- Respeitar `prefers-reduced-motion` (animações encurtadas, sem confete contínuo).

## Review Focus

1. **F5 no meio da animação do sorteio:** ao recarregar, o palco mostra direto o mesmo ganhador (winnerReveal), sem sortear de novo. Teste na Task 4 (`normalizeOnLoad`).
2. **Planilha "suja":** linhas em branco, cabeçalho com acento e maiúsculas ("E-mail", "Nome Completo"), e-mails com espaços e maiúsculas, duplicados. A importação deduplica por e-mail normalizado e conta cada caso na prévia. Teste na Task 5.
3. **Pessoa excluída importada depois, com e-mail em maiúsculas:** continua inelegível. Teste na Task 3.
4. **Ressortear quando não sobra ninguém elegível:** vai para a fase `noEligible`, o prêmio continua pendente e o registro de ausente é mantido. Teste na Task 3.
5. **Palco recarrega com a janela de Controle aberta:** o Controle reconecta sozinho e volta a receber o estado. Teste na Task 9 (protocolo com janelas simuladas).

---

## Estrutura de arquivos

```
index.html · package.json · vite.config.ts · tsconfig.json · .gitignore
src/
  main.tsx                    boot: escolhe modo (palco|controle) pelo hash
  App.tsx                     renderiza <StageApp/> ou <ControlApp/>
  styles/index.css            Tailwind v4 @theme (paleta, fontes, raios), utilitários .btn-3d etc.
  domain/
    types.ts                  tipos de dados (Prize, Participant, ...)
    random.ts                 secureRandomInt, pickOne, sampleUnique
    email.ts                  normalizeEmail, isValidEmail
    people.ts                 initials, avatarColor, validateNewPerson
    prizes.ts                 expandPrizeInput
    engine.ts                 eligibleParticipants, pendingQueue, transições de fase, undo
  store/
    appStore.ts               store Zustand (dona): dados + ações
    persistence.ts            storage seguro (quota), migração, normalizeOnLoad, estimateUsage
    actions.ts                tipo AppActions + useActions() (local ou proxy)
  sync/
    protocol.ts               mensagens + lógica de handshake (pura, testável)
    ownerBridge.ts            lado palco: recebe comandos, envia estado
    mirrorBridge.ts           lado controle: espelho + envio de comandos
  io/
    sheetImport.ts            readSheetFile, detectColumns, buildImportPreview
    sheetExport.ts            exportHistoryXlsx
    backup.ts                 serializeBackup, parseBackup
    image.ts                  compressImage
  ui/                         Button, Card, Modal, Tabs, Field, Toggle, Slider, Badge, ConfirmDialog, Toaster, Avatar, EmptyState
  mascot/Presentinho.tsx      SVG animado, prop mood
  stage/
    StageApp.tsx              shell do palco: tela, cantos (engrenagem, monitor), hotkeys, modal
    hotkeys.ts                stageKeyAction (pura) + useStageHotkeys
    screens/                  SetupScreen, IdleScreen, PrizeRevealScreen, DrawingScreen, WinnerRevealScreen, NoEligibleScreen, FinaleScreen
    confetti.ts               burst helpers
    reel.ts                   buildReel (pura)
  backstage/
    BackstagePanel.tsx        abas
    PrizesTab.tsx · ParticipantsTab.tsx · ImportDialog.tsx · ExclusionsTab.tsx · HistoryTab.tsx · EventTab.tsx
  control/
    ControlApp.tsx            layout Ao vivo + BackstagePanel
    LivePanel.tsx
tests/                        espelha src/ (ex.: tests/domain/engine.test.ts)
```

---

### Task 1: Scaffold, tema e build single-file

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `.gitignore`, `src/main.tsx`, `src/App.tsx`, `src/styles/index.css`, `tests/smoke.test.ts`

**Interfaces:**
- Produces: scripts `npm run dev`, `npm test` (vitest run), `npm run build` (gera `dist/index.html`), `npm run typecheck`. Classes de tema (`.btn-3d`, cores `bg-feather`, `bg-macaw`, `bg-cardinal`, `bg-bee`, `bg-fox`, `bg-beetle`, `text-eel`, `text-wolf`, `border-swan`, `bg-polar`), disponíveis para todas as tarefas de UI.

- [ ] **Step 1:** `git init`. Criar o projeto Vite React-TS na pasta atual (sem sobrescrever `docs/`). Instalar todas as dependências da Tech Stack (SheetJS pelo tarball da CDN). `.gitignore` com `node_modules`, `dist`.
- [ ] **Step 2:** Configurar `vite.config.ts` com `react()`, `tailwindcss()`, `viteSingleFile()`, e `test: { environment: 'jsdom', include: ['tests/**/*.test.ts?(x)'] }`. Configurar `base: './'` e `build.assetsInlineLimit: 100_000_000`, para as fontes entrarem inline.
- [ ] **Step 3:** Em `src/styles/index.css`, importar o Tailwind e as fontes Nunito 600/700/800/900. Declarar `@theme` com as cores nomeadas `feather #58CC02`, `feather-dark #58A700`, `mask #89E219`, `macaw #1CB0F6`, `macaw-dark #1899D6`, `cardinal #FF4B4B`, `cardinal-dark #EA2B2B`, `bee #FFC800`, `bee-dark #E5B400`, `fox #FF9600`, `beetle #CE82FF`, `eel #4B4B4B`, `wolf #777777`, `swan #E5E5E5`, `polar #F7F7F7`, e a fonte padrão Nunito. Criar `.btn-3d`: raio 16px, `border-bottom: 4px solid` na cor *-dark, uppercase, peso 800. No `:active`, `translateY(4px)` e `border-bottom-width: 0`.
- [ ] **Step 4:** Teste de fumaça `tests/smoke.test.ts`: `expect(1+1).toBe(2)`, só para validar o runner. Rodar `npm test` e esperar PASS.
- [ ] **Step 5:** `App.tsx` provisório renderiza um botão `.btn-3d bg-feather` "Bora sortear!". Rodar `npm run build`.
  Esperado: existe só `dist/index.html`, e `grep -c "<script src" dist/index.html` retorna `0`. Abrir o arquivo via `file://` no navegador e conferir o botão verde com Nunito.
- [ ] **Step 6:** Commit `chore: scaffold vite react ts + tailwind theme + single-file build`.

---

### Task 2: Primitivos de domínio (tipos, aleatoriedade, e-mail, pessoas, prêmios)

**Files:**
- Create: `src/domain/types.ts`, `src/domain/random.ts`, `src/domain/email.ts`, `src/domain/people.ts`, `src/domain/prizes.ts`
- Test: `tests/domain/random.test.ts`, `tests/domain/email.test.ts`, `tests/domain/people.test.ts`, `tests/domain/prizes.test.ts`

**Interfaces:**
- Produces (`types.ts`):
  ```ts
  type ID = string;
  interface Prize { id: ID; name: string; imageId?: ID; groupId?: ID; groupIndex?: number; groupSize?: number; createdAt: number }
  interface Person { id: ID; name: string; email: string }   // email sempre normalizado
  type Participant = Person; type Excluded = Person;
  type DrawStatus = 'pending' | 'confirmed' | 'absent';
  interface DrawRecord { id: ID; prizeId: ID; prizeName: string; participantId: ID; name: string; email: string; status: DrawStatus; at: number }
  type StagePhase = 'idle' | 'prizeReveal' | 'drawing' | 'winnerReveal' | 'noEligible' | 'finale';
  interface StageState { phase: StagePhase; prizeId?: ID; drawId?: ID }
  interface Settings { eventName: string; logoImageId?: ID; suspenseSeconds: number }
  interface AppData { version: 1; prizes: Record<ID, Prize>; images: Record<ID, string>; queue: ID[]; participants: Participant[]; excluded: Excluded[]; draws: DrawRecord[]; settings: Settings; stage: StageState }
  interface DrawView { queue: ID[]; prizes: Record<ID, Prize>; participants: Participant[]; excluded: Excluded[]; draws: DrawRecord[]; stage: StageState }
  const DEFAULT_SETTINGS: Settings = { eventName: 'Sorteio de Fim de Ano Viceri 2026', suspenseSeconds: 7 };
  function createEmptyData(): AppData
  ```
- Produces: `newId(): string` (crypto.randomUUID), `secureRandomInt(maxExclusive: number): number`, `pickOne<T>(items: T[]): T`, `sampleUnique<T>(items: T[], n: number): T[]`, `normalizeEmail(s: string): string`, `isValidEmail(s: string): boolean`, `initials(name: string): string`, `avatarColor(email: string): string`, `validateNewPerson(list: Person[], input: {name: string; email: string}): { ok: true; person: Omit<Person,'id'> } | { ok: false; error: 'name-required' | 'email-invalid' | 'duplicate' }`, `expandPrizeInput(input: { name: string; imageId?: ID; quantity: number }, now: number): Prize[]`.

- [ ] **Step 1: Write failing tests**
  - `secureRandomInt`: com `crypto.getRandomValues` mockado em sequência, retorna valores em `[0, max)`. Faz rejection sampling: mockar um valor acima do limite aceito e verificar que ele é descartado e o próximo é usado. Lança erro se `max <= 0`.
  - `sampleUnique([1..10], 4)`: 4 elementos distintos, todos do conjunto. `n > length` retorna todos.
  - `normalizeEmail('  Fulano.Silva@Viceri.COM.br ')` resulta em `'fulano.silva@viceri.com.br'`. `isValidEmail('a@b.co')` é true; `'abc'`, `'a@'` e `''` são false.
  - `initials('Christian de Oliveira')` resulta em `'CO'`; `initials('Ana')` em `'A'`; `initials('  maria   souza ')` em `'MS'`.
  - `avatarColor` é determinístico (mesmo e-mail, mesma cor) e retorna um valor de `['#58CC02','#1CB0F6','#FF4B4B','#FFC800','#FF9600','#CE82FF']`.
  - `validateNewPerson`: nome vazio dá `name-required`; e-mail inválido dá `email-invalid`; e-mail já na lista (com outra caixa) dá `duplicate`; caso válido retorna o e-mail normalizado e o nome com trim.
  - `expandPrizeInput({name:'Vale R$200', imageId:'img1', quantity:3}, 1000)`: 3 prêmios com o mesmo `groupId`, `groupIndex` 1, 2, 3, `groupSize` 3, mesmo `imageId`, ids distintos. Com `quantity: 1`, 1 prêmio sem `groupId`. Com `quantity < 1` ou nome vazio após trim, lança erro.
- [ ] **Step 2:** `npm test -- tests/domain` deve falhar (módulos inexistentes).
- [ ] **Step 3:** Implementar os módulos com as assinaturas acima. `secureRandomInt` usa `Uint32Array` e um limite `Math.floor(2**32 / max) * max` para a rejeição.
- [ ] **Step 4:** `npm test -- tests/domain` deve passar.
- [ ] **Step 5:** Commit `feat(domain): types, secure random, email, people, prize expansion`.

---

### Task 3: Motor do sorteio (elegibilidade, fases, ausentes, desfazer)

**Files:**
- Create: `src/domain/engine.ts`
- Test: `tests/domain/engine.test.ts`

**Interfaces:**
- Consumes: tipos da Task 2, `pickOne`, `newId`, `normalizeEmail`.
- Produces (todas puras; recebem `DrawView` e devolvem um patch):
  ```ts
  type ViewPatch = Partial<Pick<DrawView, 'queue' | 'draws' | 'stage'>>;
  function eligibleParticipants(v: DrawView): Participant[]
  function pendingQueue(v: DrawView): ID[]            // queue sem prêmios com draw 'confirmed' e sem ids inexistentes
  function nextPrize(v: DrawView): ViewPatch
  function startDraw(v: DrawView, now: number, pick?: <T>(xs: T[]) => T): ViewPatch
  function finishDrawing(v: DrawView): ViewPatch
  function confirmWinner(v: DrawView): ViewPatch
  function markAbsentAndRedraw(v: DrawView, now: number, pick?: <T>(xs: T[]) => T): ViewPatch
  function undoLast(v: DrawView): ViewPatch
  function canUndo(v: DrawView): boolean
  function currentDraw(v: DrawView): DrawRecord | undefined
  ```

**Regras (§6.1, §7):**
- `eligibleParticipants` = participantes, menos os e-mails em `excluded` (comparação por `normalizeEmail`), menos `participantId`s com draw `confirmed`, `absent` ou `pending`.
- `nextPrize`:
  - Se a fase não for `idle`, não faz nada (`{}`).
  - Com `pendingQueue` vazia, vai para `{phase:'finale'}`.
  - Senão, vai para `{phase:'prizeReveal', prizeId: primeiro pendente}`.
- `startDraw`:
  - Só age em `prizeReveal` ou `noEligible`.
  - Sem elegíveis, vai para `{phase:'noEligible', prizeId}` sem criar registro.
  - Com elegíveis, cria um `DrawRecord` `pending` com snapshot de `prizeName`, `name` e `email`, e vai para `{phase:'drawing', prizeId, drawId}`.
- `finishDrawing`: de `drawing` para `winnerReveal` (mantém ids).
- `confirmWinner`: só age em `winnerReveal`. O draw atual vira `confirmed`, o prêmio sai da `queue`, e a fase vai para `{phase:'idle'}`.
- `markAbsentAndRedraw`: só age em `winnerReveal`. O draw atual vira `absent` e depois roda a lógica de `startDraw` para o mesmo prêmio (que pode levar a `noEligible`).
- `canUndo`: há algum draw e nenhum `pending`, e a fase é `idle` ou `finale`.
- `undoLast`: remove o draw de maior `at`. Se era `confirmed`, recoloca `prizeId` no **início** da `queue` (se ainda existir em `prizes`). A fase vai para `idle`.

- [ ] **Step 1: Write failing tests** (fixture `makeView()` com 5 participantes, 2 prêmios na fila e 1 excluído):
  - `eligibleParticipants` exclui quem está em `excluded` mesmo quando o participante tem o e-mail `FULANO@VICERI.COM.BR` e o excluído tem `fulano@viceri.com.br` (Review Focus 3).
  - Também exclui confirmados, ausentes e o pendente atual.
  - `nextPrize` em `idle` vai para `prizeReveal` com o primeiro da fila. Com a fila vazia vai para `finale`. Fora de `idle` retorna `{}`.
  - `startDraw` com `pick = xs => xs[0]` cria um registro `pending` do primeiro elegível e vai para a fase `drawing`.
  - Fluxo completo: next → start → finish → confirm. O prêmio sai da fila, o draw fica `confirmed` e a fase volta a `idle`. Uma nova sequência nunca escolhe o mesmo ganhador.
  - `markAbsentAndRedraw`: o anterior vira `absent`, existe um novo `pending` para o mesmo `prizeId`, de participante diferente, e a fase é `drawing`.
  - Com apenas 1 elegível, `markAbsentAndRedraw` vai para `noEligible`, o prêmio continua na fila e o registro `absent` permanece (Review Focus 4).
  - `undoLast` após confirmar recoloca o prêmio no índice 0 da fila e remove o registro. Após um ausente, remove o ausente e a pessoa volta a ser elegível.
  - `canUndo` é false com draw `pending` e é false sem draws.
- [ ] **Step 2:** `npm test -- tests/domain/engine.test.ts` deve falhar.
- [ ] **Step 3:** Implementar `engine.ts` seguindo as regras acima. `pick` padrão = `pickOne`.
- [ ] **Step 4:** O mesmo comando deve passar.
- [ ] **Step 5:** Commit `feat(domain): draw engine with eligibility, absent redraw and undo`.

---

### Task 4: Store, persistência e modo ensaio

**Files:**
- Create: `src/store/persistence.ts`, `src/store/appStore.ts`, `src/store/actions.ts`
- Test: `tests/store/persistence.test.ts`, `tests/store/appStore.test.ts`

**Interfaces:**
- Consumes: Tasks 2 e 3.
- Produces:
  ```ts
  // persistence.ts
  const STORAGE_KEY = 'sorteio-viceri:v1';
  const STORAGE_LIMIT_CHARS = 5_000_000;
  function normalizeOnLoad(d: AppData): AppData     // 'drawing' → 'winnerReveal'
  function migrate(raw: unknown): AppData            // valida forma básica; desconhecido → createEmptyData()
  function estimateUsage(d: AppData): { chars: number; ratio: number }
  function createSafeStorage(onError: (e: unknown) => void): StateStorage   // try/catch no setItem
  // appStore.ts
  interface Rehearsal { active: boolean; draws: DrawRecord[]; stage: StageState }
  interface AppState extends AppData { rehearsal: Rehearsal; storageError: string | null }
  interface AppActions {
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
    stageNext(): void; stageStartDraw(): void; stageFinishDrawing(): void;
    stageConfirm(): void; stageAbsent(): void; undoLast(): void;
    restoreBackup(d: AppData): void; resetAll(): void;
  }
  function createAppStore(opts: { persist: boolean; storage?: StateStorage }): UseBoundStore<StoreApi<AppState & AppActions>>
  function selectView(s: AppState): DrawView        // mistura rehearsal quando ativo
  function selectActiveStage(s: AppState): StageState
  // actions.ts
  type ActionName = keyof AppActions;
  function useActions(): AppActions                  // palco: ações locais; controle: proxy (Task 9)
  function setActionsProvider(p: () => AppActions): void
  ```

**Regras:**
- O `persist` (Zustand) faz `partialize` apenas dos campos de `AppData`: `rehearsal` e `storageError` nunca são gravados. No `onRehydrateStorage`, aplicar `migrate` e depois `normalizeOnLoad` (Review Focus 1).
- **Modo ensaio:** com `rehearsal.active`, as ações `stage*` e `undoLast` operam em `{ queue: real, draws: rehearsal.draws, stage: rehearsal.stage }`. Só `rehearsal.draws` e `rehearsal.stage` recebem o patch; mudanças de `queue` do patch são **ignoradas**, porque `pendingQueue` já filtra pelos draws do ensaio. Ações de cadastro gravam normalmente. `setRehearsal(false)` zera o ensaio.
- **Imagens:**
  - `addPrizes` guarda a imagem uma vez em `images[newId()]` e passa o `imageId` para `expandPrizeInput`.
  - `updatePrize` com `image` cria um novo `imageId` só para aquele prêmio; com `image: null`, remove a imagem.
  - Imagens sem referência (em `prizes` e `settings.logoImageId`) são removidas após `removePrize`, `updatePrize` e `updateSettings`.
- **Bloqueios:**
  - `removePrize` não faz nada para um prêmio com draw `confirmed` ou que seja o `stage.prizeId` atual.
  - `removeParticipant` não faz nada se a pessoa tem draw `confirmed`.
- `importParticipants('replace')`: substitui a lista, mas preserva participantes que têm qualquer `DrawRecord`. A deduplicação é por e-mail; o novo registro vence no nome.
- `addPrizes` acrescenta os novos prêmios ao **fim** da fila. `reorderQueue(ids)` aceita só uma permutação exata dos ids atuais da fila; caso contrário, não faz nada.
- Quota: o `setItem` que falhar chama `onError` e gera `storageError = 'Não foi possível salvar. Remova imagens ou baixe um backup.'`. O próximo save bem-sucedido limpa o erro.
- `restoreBackup` substitui tudo e zera o ensaio. `resetAll` volta para `createEmptyData()`.

- [ ] **Step 1: Write failing tests** (store criada com `persist: true` e um storage em memória):
  - `normalizeOnLoad` com `phase:'drawing'` resulta em `winnerReveal`, mantendo `drawId` (Review Focus 1). Outras fases ficam iguais.
  - `migrate(null)` e `migrate({foo:1})` resultam em dados vazios; `migrate(validData)` retorna os mesmos dados.
  - Storage cujo `setItem` lança `QuotaExceededError`: após `addPrizes`, `storageError` fica preenchido e o estado em memória mantém o prêmio.
  - `addPrizes({name:'Vale', image:'data:x', quantity:3})`: 3 prêmios na fila, `images` com uma única entrada.
  - `removePrize` de um prêmio confirmado não faz nada. `removePrize` do último prêmio de uma imagem a remove de `images`.
  - `reorderQueue` com ids faltando não faz nada; com uma permutação válida, aplica.
  - Ensaio: `setRehearsal(true)` → next → start → finish → confirm. A `queue` e os `draws` reais ficam intactos, e `selectView` mostra o prêmio como não pendente. Um `addParticipant` durante o ensaio persiste. `setRehearsal(false)` faz o palco voltar ao real.
  - `importParticipants(replace)` preserva um vencedor ausente da nova lista e deduplica e-mails com caixas diferentes.
  - O storage em memória nunca contém as chaves `rehearsal` nem `storageError`.
- [ ] **Step 2:** `npm test -- tests/store` deve falhar.
- [ ] **Step 3:** Implementar `persistence.ts`, `appStore.ts` (cada ação `stage*` chama a função do motor com `selectView` e aplica o patch no lugar certo, real ou ensaio) e `actions.ts`.
  Exportar o singleton `export const isControlWindow = () => location.hash.startsWith('#/controle')` e `export const useAppStore = createAppStore({ persist: !isControlWindow() })`, usado por todos os componentes nas duas janelas. O provider padrão de `useActions()` devolve as ações do próprio `useAppStore`.
- [ ] **Step 4:** `npm test -- tests/store` deve passar.
- [ ] **Step 5:** Commit `feat(store): zustand store with safe persistence, rehearsal mode and load recovery`.

---

### Task 5: Entrada e saída (planilha, exportação, backup, imagem)

**Files:**
- Create: `src/io/sheetImport.ts`, `src/io/sheetExport.ts`, `src/io/backup.ts`, `src/io/image.ts`
- Test: `tests/io/sheetImport.test.ts`, `tests/io/backup.test.ts`, `tests/io/sheetExport.test.ts`

**Interfaces:**
- Produces:
  ```ts
  type Row = Record<string, unknown>;
  async function readSheetFile(file: File): Promise<{ headers: string[]; rows: Row[] }>   // 1ª aba, ignora linhas vazias
  function detectColumns(headers: string[], rows: Row[]): { name?: string; email?: string }
  interface ImportPreview { valid: Array<{ name: string; email: string }>; duplicates: number; invalid: number; alreadyExcluded: number; total: number }
  function buildImportPreview(rows: Row[], cols: { name: string; email: string }, excluded: Excluded[]): ImportPreview
  function exportHistoryXlsx(draws: DrawRecord[], eventName: string): void   // baixa o arquivo
  function buildHistoryWorkbook(draws: DrawRecord[]): XLSX.WorkBook
  function serializeBackup(d: AppData): string
  function parseBackup(text: string): { ok: true; data: AppData } | { ok: false; error: string }
  async function compressImage(file: File, maxSide?: number /*640*/, quality?: number /*0.8*/): Promise<string>
  ```

**Regras:**
- `detectColumns`:
  - Normaliza os cabeçalhos (minúsculas, sem acento, trim).
  - Nome: `nome|name|colaborador|funcionario` (aceita "nome completo").
  - E-mail: `email|e-mail|mail|correio`.
  - Fallback: o e-mail é a coluna em que a maioria das amostras contém `@`; o nome é a primeira outra coluna com texto.
- `buildImportPreview`:
  - Faz trim e `normalizeEmail`.
  - Linhas sem e-mail válido contam em `invalid`. E-mails repetidos depois do primeiro contam em `duplicates`.
  - `alreadyExcluded` conta os válidos cujo e-mail está em `excluded`. Eles continuam em `valid`, porque a exclusão é aplicada no sorteio.
- Exportação: aba "Ganhadores" (só `confirmed`, colunas Prêmio, Nome, E-mail, Horário em `dd/MM/yyyy HH:mm`) e aba "Log completo" (todos os registros, com a coluna Status em `Confirmado`/`Ausente`/`Pendente`). Nome do arquivo: `ganhadores-<slug do evento>.xlsx`.
- `parseBackup` rejeita JSON inválido e objetos sem `version === 1`, `prizes`, `queue`, `participants` ou `draws`. Em caso de sucesso, passa por `migrate` (Task 4).
- `compressImage`: `createImageBitmap` → canvas redimensionado → `toDataURL('image/webp', q)`. Se o resultado não começar com `data:image/webp`, usar `image/jpeg`. Sem teste unitário (o jsdom não tem canvas); validado manualmente na Task 7.

- [ ] **Step 1: Write failing tests**
  - `detectColumns(['Nome Completo','E-mail Corporativo'], ...)` resulta em `{name:'Nome Completo', email:'E-mail Corporativo'}`.
  - Fallback: cabeçalhos `['Col A','Col B']` com a coluna B contendo `@` resultam em `{name:'Col A', email:'Col B'}`.
  - `buildImportPreview` com as linhas `[{N:'Ana',E:' ANA@V.COM '},{N:'Ana 2',E:'ana@v.com'},{N:'',E:''},{N:'Bob',E:'bob'},{N:'Caio',E:'caio@v.com'}]` e `caio@v.com` excluído resulta em `valid` 2 (`ana@v.com`, `caio@v.com`), `duplicates` 1, `invalid` 2, `alreadyExcluded` 1, `total` 5 (Review Focus 2).
  - `readSheetFile` com um CSV gerado em memória (`new File(['Nome;Email\nAna;ana@v.com\n\n'], 'x.csv')`) retorna 1 linha. Também testar o separador `,`.
  - `buildHistoryWorkbook`: a aba "Ganhadores" tem só confirmados; a aba "Log completo" tem todos, com o Status traduzido.
  - `parseBackup(serializeBackup(data))` faz o caminho de ida e volta. `parseBackup('{}')` e `parseBackup('lixo')` retornam `ok:false`.
- [ ] **Step 2:** `npm test -- tests/io` deve falhar.
- [ ] **Step 3:** Implementar. Usar `XLSX.read(await file.arrayBuffer(), { type: 'array' })` e `sheet_to_json(ws, { defval: '' })`. O CSV com `;` deve ser detectado: se o resultado tiver 1 coluna contendo `;`, reler com `FS: ';'`.
- [ ] **Step 4:** `npm test -- tests/io` deve passar.
- [ ] **Step 5:** Commit `feat(io): spreadsheet import/export, backup and image compression`.

---

### Task 6: Kit de UI Duolingo e mascote Presentinho

**Files:**
- Create: `src/ui/*.tsx` (Button, Card, Modal, Tabs, Field, Toggle, Slider, Badge, ConfirmDialog, Toaster, Avatar, EmptyState), `src/ui/index.ts`, `src/mascot/Presentinho.tsx`
- Modify: `src/App.tsx` (rota `#/kit`, temporária, para visualização)
- Test: `tests/ui/ConfirmDialog.test.tsx`

**Interfaces:**
- Produces:
  ```ts
  <Button variant: 'primary'(feather)|'secondary'(macaw)|'danger'(cardinal)|'warning'(bee)|'ghost' size: 'md'|'lg'|'xl' icon?>  // .btn-3d
  <Card>  // borda 2px swan, borda inferior 4px, raio 20px
  <Modal open onClose title size: 'md'|'lg'|'full'>  // Esc fecha, foco preso, animação spring
  <Tabs tabs: {id,label,icon}[] value onChange>
  <Field label error> · <Toggle checked onChange label> · <Slider min max step value onChange suffix> · <Badge color>
  <ConfirmDialog open title message confirmLabel danger? requireText?: string onConfirm onCancel>
  toast(msg: string, kind?: 'success'|'error'|'info') + <Toaster/>
  <Avatar name email size: number>   // initials + avatarColor (Task 2)
  <EmptyState mood title description action?>
  <Presentinho mood: 'idle'|'excited'|'suspense'|'celebrate'|'sad' size?: number>
  ```

- [ ] **Step 1: Write failing test:** com `requireText="ZERAR"`, o `ConfirmDialog` mantém o botão de confirmar desabilitado até digitar exatamente `ZERAR`. `onConfirm` é chamado uma vez.
- [ ] **Step 2:** `npm test -- tests/ui` deve falhar.
- [ ] **Step 3:** Implementar os componentes (Framer Motion para springs; ícones lucide-react).
  - O Presentinho é um SVG desenhado do zero: caixa verde `#58CC02` com faixas verde-claras `#89E219` e laço amarelo `#FFC800`, olhos grandes brancos com pupilas `#4B4B4B` e bochechas rosadas.
  - Cada `mood` é uma variante do Motion:
    - idle: pulinhos suaves em loop e piscar
    - excited: pulinhos rápidos e olhos maiores
    - suspense: tremor horizontal, sobrancelhas franzidas
    - celebrate: salto alto, laço girando 360° e braços levantados
    - sad: corpo inclinado e olhos baixos
  - Com `prefers-reduced-motion`, sem loops.
- [ ] **Step 4:** `npm test -- tests/ui` deve passar.
- [ ] **Step 5: Verificação visual:** `npm run dev`, abrir `#/kit`. Conferir todos os botões (estado pressionado "afunda"), modal, abas e os 5 humores do Presentinho. Tirar screenshot.
- [ ] **Step 6:** Commit `feat(ui): duolingo-style component kit and Presentinho mascot`.

---

### Task 7: Bastidores (abas Prêmios, Participantes, Exclusões, Histórico, Evento)

**Files:**
- Create: `src/backstage/BackstagePanel.tsx`, `PrizesTab.tsx`, `ParticipantsTab.tsx`, `ImportDialog.tsx`, `ExclusionsTab.tsx`, `HistoryTab.tsx`, `EventTab.tsx`
- Test: `tests/backstage/PrizesTab.test.tsx`, `tests/backstage/ImportDialog.test.tsx`

**Interfaces:**
- Consumes: `useAppStore` (com seletores), `useActions()`, `selectView`, `eligibleParticipants`, `pendingQueue`, `canUndo`, `validateNewPerson`, as funções de I/O da Task 5 e o kit da Task 6.
- Produces: `<BackstagePanel initialTab?: 'prizes'|'participants'|'exclusions'|'history'|'event' />`, usado pelo modal do palco (Task 8) e pelo ControlApp (Task 9). **Os componentes só leem a store por seletores e só escrevem via `useActions()`**, para funcionarem também no espelho.

**Comportamento (§6.3):**
- **Prêmios:**
  - Formulário com nome, imagem (dropzone + clique, via `compressImage`, com preview) e quantidade (stepper 1–20).
  - Fila com dnd-kit (`SortableContext`, sensores de pointer e teclado). Cada linha tem alça, miniatura, nome, selo `2/3` quando `groupSize > 1`, editar e excluir.
  - Seção recolhível "Já sorteados" com o ganhador.
  - Botão "Embaralhar fila" com confirmação.
  - Aviso amarelo quando `estimateUsage().ratio > 0.8`.
- **Participantes:**
  - Contadores (total, excluídos), busca e lista virtualizada simples (200 itens dispensam virtualização; um scroll comum basta).
  - Adicionar manual com `validateNewPerson`.
  - Por linha: botões "Excluir do sorteio" (envia para Exclusões) e remover (desabilitado para vencedores, com tooltip).
- **ImportDialog:**
  - Passos: arquivo → (seletor de colunas, se `detectColumns` falhar) → prévia com os contadores da `ImportPreview` → modo Substituir ou Adicionar → confirmar.
  - Mostra um toast com o resultado.
- **Exclusões:** formulário nome + e-mail, lista e busca. Indicador "X pessoas da lista de participantes estão excluídas".
- **Histórico:**
  - Linha do tempo (mais recente no topo) com avatar, nome, prêmio, horário e selo ✅/🚫.
  - Botões "Desfazer último" (habilitado por `canUndo`, com ConfirmDialog) e "Exportar Excel".
  - Indicador "N pessoas ainda concorrem".
  - Com o ensaio ativo, mostra os registros do ensaio com a faixa "ENSAIO".
- **Evento:**
  - Nome do evento, upload da logo, slider de suspense 3–15 s e toggle de modo ensaio.
  - Backup: baixar `.json` (nome `backup-sorteio-<data>.json`) e restaurar (file input → `parseBackup` → ConfirmDialog).
  - Medidor de armazenamento (barra).
  - "Zerar evento" (ConfirmDialog com `requireText="ZERAR"`).

- [ ] **Step 1: Write failing tests** (usam o singleton `useAppStore`, resetado no `beforeEach` com `useAppStore.setState({ ...createEmptyData(), rehearsal: { active: false, draws: [], stage: { phase: 'idle' } }, storageError: null })` e `localStorage.clear()`):
  - PrizesTab: preencher nome "Vale R$200" e quantidade 3 e salvar gera 3 linhas na fila com os selos `1/3`, `2/3`, `3/3`.
  - ImportDialog: dado um arquivo CSV com 3 linhas válidas e 1 duplicada, a prévia mostra "3 válidos" e "1 duplicado". Confirmar no modo Adicionar resulta em 3 participantes na store.
- [ ] **Step 2:** `npm test -- tests/backstage` deve falhar.
- [ ] **Step 3:** Implementar as abas.
- [ ] **Step 4:** `npm test -- tests/backstage` deve passar.
- [ ] **Step 5: Verificação visual:** `npm run dev`. Abrir o painel numa rota temporária `#/bastidores`. Cadastrar 3 prêmios (um com quantidade 3), importar um CSV de exemplo com 200 linhas (gerar em `tests/fixtures/colaboradores-200.csv`), adicionar 2 exclusões, reordenar arrastando e com o teclado, e baixar o backup.
- [ ] **Step 6:** Commit `feat(backstage): prizes, participants import, exclusions, history and event tabs`.

---

### Task 8: Palco (telas, animações, hotkeys)

**Files:**
- Create: `src/stage/StageApp.tsx`, `src/stage/hotkeys.ts`, `src/stage/reel.ts`, `src/stage/confetti.ts`, `src/stage/screens/*.tsx`
- Modify: `src/App.tsx` (rota padrão → `StageApp`; remover as rotas temporárias `#/kit` e `#/bastidores`)
- Test: `tests/stage/hotkeys.test.ts`, `tests/stage/reel.test.ts`, `tests/stage/StageApp.test.tsx`

**Interfaces:**
- Consumes: store, ações, motor, kit, mascote e `BackstagePanel`.
- Produces:
  ```ts
  type StageKeyAction = 'primary' | 'absent' | 'fullscreen' | 'backstage' | 'close' | null;
  function stageKeyAction(e: Pick<KeyboardEvent,'key'|'ctrlKey'|'metaKey'>, ctx: { typing: boolean; modalOpen: boolean }): StageKeyAction
  function buildReel(eligibleNames: Person[], winner: Person, length?: number /*36*/): Person[]   // último item = winner
  function deriveScreen(s: AppState): 'setup' | StagePhase
  ```

**Comportamento (§6.1, §6.2, §9):**
- `deriveScreen`: é `setup` quando não há participantes ou quando não há prêmio algum cadastrado e nenhum draw. Caso contrário, é a fase ativa (real ou ensaio).
- Layout 16:9 em tela cheia, fundo branco com padrão sutil de confetes geométricos em `polar`. Logo e nome do evento no topo. Cantos inferiores com ícones discretos (opacidade 30%, 100% no hover): engrenagem (Bastidores) e monitor (abrir janela de Controle, Task 9). Faixa "MODO ENSAIO" (bee) quando ativo. Banner vermelho com `storageError`.
- **Telas:**
  - **Setup:** Presentinho `sad`/`idle`, checklist com ✓/✗ (prêmios, participantes) e botão "Abrir bastidores".
  - **Idle:** Presentinho `idle` grande, título "Quem será o próximo sortudo?" e botão xl "PRÓXIMO PRÊMIO". O botão é sempre idêntico, sem nenhuma condição que dependa da fila.
  - **PrizeReveal:** caixa de presente gigante balança (wiggle por 1,2 s) e abre com explosão de confete. Entram a imagem do prêmio (ou um ícone de presente, se não houver imagem) e o nome, com spring. Botão xl "SORTEAR!".
  - **Drawing:**
    - O prêmio encolhe e vai para o topo. Um rolo vertical de cartões (Avatar + nome) gerado por `buildReel` desliza com desaceleração (ease-out cúbico) durante `settings.suspenseSeconds`.
    - O cartão central fica destacado com borda `macaw`. Presentinho em `suspense`.
    - Ao terminar, chama `stageFinishDrawing()`. Nenhum botão.
  - **WinnerReveal:**
    - Confete em rajadas laterais, Avatar grande (≥ 22vh), nome com no mínimo 8vw e peso 900, e-mail menor em `wolf`, cartão do prêmio ao lado. Presentinho em `celebrate`. Título "Temos um sortudo!".
    - Botões "CONFIRMAR" (primary) e "AUSENTE — RESSORTEAR" (danger).
    - Ao ressortear, mostra por 1,2 s "Ixi, não veio? Bora de novo!" e volta ao Drawing.
  - **NoEligible:** Presentinho `sad`, "Acabaram os participantes!" e botão para abrir Bastidores.
  - **Finale:** mural em grade de até 5×4 com Avatar + nome + prêmio de todos os confirmados (mais de 20 → os cartões encolhem), título "Parabéns aos ganhadores!" e confete suave. Mostrar os registros do ensaio quando ele estiver ativo.
- **Hotkeys (`stageKeyAction`):**
  - `typing` ou `modalOpen` → apenas `Escape` vira `close` (e `Ctrl+K` vira `backstage`). Todo o resto vira `null`.
  - `' '`, `'Enter'`, `'ArrowRight'`, `'PageDown'` → `primary`; `'r'`/`'R'` → `absent`; `'f'`/`'F'` → `fullscreen`; `Ctrl/Meta+'k'` → `backstage`.
  - `'b'`, `'B'`, `'.'`, `'w'`, `'W'`, `'PageUp'` → `null`.
- `primary` por fase: idle → `stageNext`; prizeReveal/noEligible → `stageStartDraw`; winnerReveal → `stageConfirm`; drawing/finale → nada.
- Bloquear a repetição do `primary` por 600 ms, contra clique duplo no passador.
- Ao montar com `phase:'drawing'` (só acontece no ensaio, porque o real é normalizado), ir direto para `stageFinishDrawing`.

- [ ] **Step 1: Write failing tests**
  - `stageKeyAction`: tabela cobrindo cada tecla acima, mais `typing:true` com `' '` resultando em `null`, e `Ctrl+K` com o modal aberto resultando em `backstage`.
  - `buildReel(eleg, winner, 36)`: comprimento 36, último item = winner, todos os itens vêm de `eleg ∪ {winner}`, e nunca há dois itens adjacentes iguais quando `eleg.length ≥ 2`. Com `eleg = [winner]`, retorna `[winner]` repetido (comprimento 36).
  - StageApp (com timers falsos e `suspenseSeconds` 3): com 2 prêmios na fila, pressionar Espaço quatro vezes, avançar os timers e pressionar Espaço de novo leva a idle → prizeReveal → drawing → winnerReveal → idle. O texto "PRÓXIMO PRÊMIO" aparece igual antes e depois. Nenhum texto contendo "de 2", "restam" ou "último" aparece no palco.
- [ ] **Step 2:** `npm test -- tests/stage` deve falhar.
- [ ] **Step 3:** Implementar o palco. O Bastidores abre num `<Modal size="full">` com `<BackstagePanel/>`.
- [ ] **Step 4:** `npm test -- tests/stage` deve passar.
- [ ] **Step 5: Verificação visual:** `npm run dev` com os dados da Task 7. Rodar um sorteio completo: confirmar 1, marcar ausente 1, ressortear, desfazer, chegar ao Finale. Dar F5 no meio de um Drawing e conferir que volta no mesmo ganhador. Checar a legibilidade a 1920×1080. Ligar o modo ensaio e conferir que nada fica gravado.
- [ ] **Step 6:** Commit `feat(stage): animated stage flow, reel, confetti and clicker-safe hotkeys`.

---

### Task 9: Janela de Controle (sync palco ↔ controle)

**Files:**
- Create: `src/sync/protocol.ts`, `src/sync/ownerBridge.ts`, `src/sync/mirrorBridge.ts`, `src/control/ControlApp.tsx`, `src/control/LivePanel.tsx`
- Modify: `src/main.tsx` (hash `#/controle` → modo espelho), `src/stage/StageApp.tsx` (botão monitor → `openControlWindow()`, e iniciar o `ownerBridge`)
- Test: `tests/sync/protocol.test.ts`

**Interfaces:**
- Produces:
  ```ts
  type Msg =
    | { t: 'hello' }                                       // controle → palco
    | { t: 'state'; data: AppData; rehearsal: Rehearsal; storageError: string | null }  // palco → controle
    | { t: 'action'; name: ActionName; args: unknown[] }   // controle → palco
    | { t: 'ping' } | { t: 'pong' };
  const PROTOCOL = 'sorteio-viceri/1';                    // envelope { p: PROTOCOL, m: Msg }
  function isEnvelope(x: unknown): x is { p: string; m: Msg }
  function createOwnerHub(deps: { getSnapshot: () => Msg; apply: (name: ActionName, args: unknown[]) => void; post: (target: MessageEventSource, env: unknown) => void }): { onMessage(e: { data: unknown; source: MessageEventSource | null }): void; broadcast(): void; clientCount(): number }
  function createMirrorLink(deps: { post: (env: unknown) => void; onState: (m: Extract<Msg,{t:'state'}>) => void; now: () => number }): { onMessage(e: { data: unknown }): void; tick(): void; connected(): boolean; send(name: ActionName, args: unknown[]): void }
  function openControlWindow(): Window | null   // window.open(baseUrl + '#/controle', 'sorteio-controle', 'popup,width=1280,height=820')
  ```

**Regras (§6.4):**
- O palco (dono) registra `event.source` de quem enviar `hello` ou `ping`, responde `state` ou `pong`, e chama `broadcast()` a cada mudança da store (`useAppStore.subscribe`). Comandos `action` com um `name` que não pertence a `AppActions` são ignorados.
- O espelho chama `tick()` a cada 1 s:
  - Sem nenhum estado recebido, ou sem resposta há mais de 3 s, fica `connected() = false` e envia `hello` para `window.opener`.
  - Conectado, envia `ping`.
  - Qualquer `state` ou `pong` atualiza o último contato.
  - Se `window.opener` for nulo ou estiver fechado, mostra a instrução "Abra o Controle pelo botão no palco".
- No espelho, `setActionsProvider` passa a devolver um Proxy de `AppActions` que chama `link.send(name, args)`. A store do espelho é o mesmo singleton `useAppStore`, que já nasce sem persistência quando `isControlWindow()` (Task 4). Cada `state` recebido faz `useAppStore.setState({ ...data, rehearsal, storageError })`.
- `postMessage(env, '*')`. Todo envelope é validado por `isEnvelope` e pelo `p`. O dono só aceita `action` de fontes registradas.
- **ControlApp:**
  - Topo com o selo de conexão (🟢 Conectado / 🔴 Desconectado). Desconectado → todos os botões desabilitados.
  - Coluna esquerda `LivePanel`:
    - Mostra a fase atual em PT-BR, o prêmio atual (miniatura + nome), o ganhador atual (Avatar + nome) e "Próximo da fila: <nome>" (ou "Fila vazia").
    - Mostra o número de elegíveis e a faixa de ensaio.
    - Botões grandes que mudam com a fase, com a mesma lógica do `primary` do palco, mais "Ausente — ressortear" no winnerReveal e "Desfazer último" (`canUndo`).
  - Coluna direita: `<BackstagePanel/>`.
  - O Controle não tem hotkeys de palco.

- [ ] **Step 1: Write failing tests** (janelas simuladas com objetos `{ postMessage: vi.fn() }` e relógio falso):
  - Um hub recebe `hello` de A e responde `state` para A. `broadcast()` envia para todas as fontes registradas.
  - Um `action` de uma fonte não registrada é ignorado; um `action` com nome inválido é ignorado; um `action` válido chama `apply` com os args.
  - O link começa desconectado e `tick()` envia `hello`. Ao receber `state`, fica conectado e chama `onState`. 3,5 s sem contato fazem `connected()` voltar a false e o próximo `tick()` reenvia `hello`.
  - **Reconexão (Review Focus 5):** simular um novo hub (palco recarregado, sem fontes registradas). O link desconectado reenvia `hello`, o novo hub registra a fonte e responde `state`, e o link volta a conectado.
  - Envelopes com `p` diferente ou com formato inválido são ignorados pelos dois lados.
- [ ] **Step 2:** `npm test -- tests/sync` deve falhar.
- [ ] **Step 3:** Implementar `protocol.ts` (lógica pura), as bridges (que ligam `window` e store ao protocolo) e as telas de controle.
- [ ] **Step 4:** `npm test -- tests/sync` deve passar.
- [ ] **Step 5: Verificação manual:** `npm run dev`, abrir o Controle pelo botão do palco. No Controle: reordenar a fila, clicar em Próximo/Sortear/Confirmar e ver o palco reagir. Dar F5 no palco e ver o selo ficar vermelho e voltar a verde em até ~3 s. Fechar o palco e ver o Controle desconectado com os botões desabilitados.
- [ ] **Step 6:** Commit `feat(control): presenter control window synced via postMessage`.

---

### Task 10: Acabamento, build final e checklist do evento

**Files:**
- Create: `README.md` (em PT-BR: como gerar o build, como usar no evento e o checklist do dia)
- Modify: o que os testes manuais apontarem

- [ ] **Step 1:** `npm run typecheck && npm test` deve passar sem erros.
- [ ] **Step 2:** `npm run build`. Conferir que existe só `dist/index.html`, sem `<script src` e sem nenhuma URL `http` carregada (`grep -E "https?://" dist/index.html` só pode mostrar textos ou licenças, nunca `src=`/`href=` de recursos).
- [ ] **Step 3: Teste ponta a ponta em `file://`** no Chrome **e** no Edge, com o CSV de 200 linhas:
  - importar, excluir 3 pessoas, cadastrar ~20 prêmios com imagem (um com quantidade 3)
  - abrir o Controle
  - sortear todos com ao menos 1 ausente e 1 desfazer
  - F5 no meio de um sorteio
  - conferir que no palco nada denuncia o último prêmio
  - exportar o Excel e conferir as duas abas
  - baixar o backup, zerar, restaurar e conferir que tudo voltou
  - medir o uso de armazenamento (esperado bem abaixo de 80%)
- [ ] **Step 4:** Revisar com `prefers-reduced-motion` ligado no SO: o fluxo continua funcional e as animações ficam curtas.
- [ ] **Step 5:** Escrever o `README.md`:
  - `npm install`, `npm run build`, abrir `dist/index.html`
  - checklist do dia: mesmo navegador; backup antes; tela estendida; palco em tela cheia no telão; Controle no notebook; modo ensaio desligado
- [ ] **Step 6:** Commit `docs: event-day README and final polish`.
