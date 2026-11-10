# Sorteio Viceri — Documento de Design

**Data:** 2026-11-09
**Status:** aguardando aprovação

## 1. Intenção

App one-page para conduzir, ao vivo e projetado em telão, o sorteio de prêmios da festa de fim de ano da Viceri. Precisa ser **divertido, bonito e à prova de falhas no dia**: quem vê tem que pensar "isso levou meses", e quem opera tem que conseguir fazer tudo com um clique ou uma tecla.

É uso interno, para um evento. Não vai para cliente nem para produção, mas **não pode falhar no meio da festa**.

Temática visual: **Duolingo** (cores vibrantes, botões "gordinhos" 3D, cantos bem arredondados, animações elásticas, mascote expressivo, tom brincalhão).

## 2. Objetivos

- Cadastrar prêmios (nome + imagem), com quantidade, e reordenar a fila a qualquer momento, inclusive durante o evento.
- Importar a lista de colaboradores (nome + e-mail) a partir de planilha.
- Manter uma lista de exclusão (diretores, organizadores) que nunca pode ser sorteada.
- Sortear com uma animação de suspense memorável, revelando primeiro o prêmio e depois o ganhador.
- Tratar ausentes com um clique ("Ausente — ressortear").
- Garantir que ninguém ganha dois prêmios.
- Guardar tudo no navegador (localStorage), com histórico, exportação para Excel e backup.

## 3. Não-objetivos (decididos pelo usuário)

- **Sem contador de prêmios** ("Prêmio 3 de 12" ou similar). A plateia não pode saber quantos faltam nem se é o último.
- **Sem sons**, exceto (decisão posterior do usuário): tique da roleta sincronizado com os nomes + uma comemoração curta na seleção, com liga/desliga.
- **Sem "grand finale"**: o último prêmio é idêntico aos outros.
- Sem fotos dos colaboradores, sem Microsoft Graph, sem App Registration.
- Sem backend, login ou banco de dados.
- Sem suporte a mobile: o alvo é notebook + telão 16:9.
- Sem múltiplos eventos simultâneos (um evento por navegador; o backup cobre a troca).

## 4. Anti-objetivos (seria fracasso mesmo funcionando)

- A tela do palco **revelar a fila de prêmios**, quantos faltam ou que este é o último.
- Perder dados no meio do evento (navegador fechou, F5, aba travou).
- O sorteio **parecer manipulado** ou previsível.
- Depender de internet no local do evento.
- O operador ficar perdido no palco, sem saber qual botão apertar.

## 5. Restrições

- Persistência só em `localStorage` (limite ~5 MB). Imagens precisam ser comprimidas.
- Funcionar 100% offline.
- O mascote e os assets devem ser **originais, inspirados** no estilo Duolingo. **Não usar o Duo (coruja) nem a logo do Duolingo**, que são marcas registradas.

## 6. Experiência

O app tem duas faces:

- **Palco**: a tela principal, que vai no telão. Mostra só o momento atual.
- **Bastidores**: modal grande de configuração e controle. Aberto por um botão discreto (engrenagem no canto) ou pela tecla `B`.

### 6.1 Palco: máquina de estados

```
[setup] ──(tem prêmio pendente + participante elegível)──▶ [idle]
[idle] ──"Próximo prêmio"──▶ [prizeReveal] ──"Sortear!"──▶ [drawing] ──(animação acaba)──▶ [winnerReveal]
[winnerReveal] ──"Confirmar"──▶ [idle]
[winnerReveal] ──"Ausente — ressortear"──▶ [drawing] (mesmo prêmio, novo ganhador)
[idle] ──"Próximo prêmio" sem prêmios pendentes──▶ [finale] (mural de ganhadores)
```

| Estado | O que aparece | Ação principal |
|---|---|---|
| **setup** | Mascote + checklist amigável do que falta (prêmios, participantes). Atalho para Bastidores. | "Abrir bastidores" |
| **idle** | Nome do evento, mascote animado aguardando, mensagem tipo "Quem será o próximo sortudo?" | **Próximo prêmio** |
| **prizeReveal** | Caixa de presente balança, abre com uma explosão de confete, e mostra imagem e nome do prêmio. | **Sortear!** |
| **drawing** | Prêmio fica pequeno no topo. Rolo vertical de cartões de nome (estilo caça-níquel), rápido no começo e desacelerando até parar. Mascote em suspense. | — (sem botão; animação dura a configuração de suspense) |
| **winnerReveal** | Confete, avatar de iniciais grande, nome em destaque, e-mail menor, prêmio ao lado. Mascote comemorando. | **Confirmar** · **Ausente — ressortear** |
| **finale** | Mural com todos os ganhadores confirmados (avatar + nome + prêmio). | (nenhuma; pode voltar pelo Bastidores) |

**Regra crítica (usuário):** o botão "Próximo prêmio" está **sempre ativo e idêntico**, inclusive quando o prêmio atual é o último. Nada no palco muda por ser o último. Os apresentadores avisam verbalmente.

**Decisão do builder:** quando não há mais prêmios pendentes, clicar em "Próximo prêmio" leva ao mural final. Isso só acontece depois de os apresentadores já terem anunciado o fim, então não quebra a expectativa.

**Sem participantes elegíveis** (todos já ganharam, foram excluídos ou estão ausentes): o palco mostra uma mensagem amigável do mascote ("Acabaram os participantes!") em vez de quebrar. O prêmio continua pendente.

### 6.2 Atalhos de teclado (palco)

| Tecla | Ação |
|---|---|
| `Espaço` / `Enter` / `→` / `PageDown` | Ação principal do estado atual (compatível com passador de slides) |
| `R` | Ausente — ressortear (só em winnerReveal) |
| `F` | Tela cheia liga/desliga |
| `Ctrl+K` | Abre/fecha Bastidores |
| `Esc` | Fecha modal |

Atalhos desativados enquanto um campo de texto estiver focado ou um modal estiver aberto (exceto `Esc`).

**Decisão do builder:** muitos passadores de slide têm um botão de "tela preta" que envia `B`, `.` ou `W`. Por isso o Bastidores usa `Ctrl+K`, uma combinação que passador nenhum envia. As teclas `B`, `.`, `W` e `PageUp` são ignoradas no palco, para um clique acidental no passador não fazer nada visível.

### 6.3 Bastidores: abas

1. **Prêmios**
   - Formulário: nome, imagem (upload por clique ou arrastar), **quantidade** (padrão 1).
   - **Quantidade N > 1:** ao salvar, o app cria **N prêmios independentes** com o mesmo nome e imagem. Cada um entra separado na fila, para ser sorteado em momentos diferentes (decisão do usuário). No Bastidores, um selo discreto "1/3, 2/3, 3/3" ajuda a identificá-los. **No palco, aparece só o nome.**
   - Lista em fila com arrastar-e-soltar para reordenar (também por teclado). Prêmios já sorteados ficam numa seção "Já sorteados", fora da fila, mostrando o ganhador.
   - Editar e excluir prêmios pendentes. Prêmio sorteado não pode ser excluído; precisa desfazer o sorteio antes.
   - Atalho "Embaralhar fila" (decisão do builder, opcional e barato).

2. **Participantes**
   - **Importar planilha** `.xlsx`, `.xls` ou `.csv`:
     - Detecção automática de colunas pelo cabeçalho (normalizado, sem acento): nome = `nome|name|colaborador|funcionario`; e-mail = `email|e-mail|mail|correio`. Fallback: a coluna cujos valores contêm `@` é o e-mail, e a primeira coluna de texto restante é o nome.
     - Se a detecção falhar, mostra seletores para o usuário escolher as colunas.
     - **Prévia** antes de confirmar: total de linhas, válidos, duplicados (mesmo e-mail), inválidos (sem e-mail válido), e quantos batem com a lista de exclusão.
     - Modo: **Substituir lista** ou **Adicionar à lista**.
   - Adição manual (nome + e-mail), busca e remoção.
   - E-mail normalizado (trim + minúsculas). É a chave única.
   - Remover participante que já ganhou é bloqueado.

3. **Exclusões** (blacklist)
   - Cadastro simples de nome + e-mail, remoção e busca.
   - Atalho: na aba Participantes, um botão "Excluir do sorteio" em cada linha copia a pessoa para cá.
   - Indicador: "X pessoas da lista de participantes estão excluídas".
   - A comparação é por e-mail normalizado. A exclusão vale mesmo se a pessoa for importada depois.

4. **Histórico**
   - Linha do tempo de cada sorteio: horário, prêmio, ganhador, status (✅ confirmado / 🚫 ausente).
   - **Desfazer último**: reverte o registro mais recente. Se era confirmado, o prêmio volta a pendente (no topo da fila) e a pessoa volta a concorrer. Se era ausente, a pessoa volta a concorrer. Pede confirmação.
   - **Exportar para Excel** (`.xlsx`): ganhadores confirmados (prêmio, nome, e-mail, horário) e, em outra aba, o log completo.
   - Indicador de elegíveis: "N pessoas ainda concorrem". Fica só no Bastidores, nunca no palco.

5. **Evento**
   - Nome do evento (padrão: "Sorteio de Fim de Ano Viceri 2026").
   - Logo (upload, comprimida).
   - Duração do suspense do sorteio (slider de 3 a 15 s, padrão 7 s).
   - **Modo ensaio** (liga/desliga): faixa visível "MODO ENSAIO" em todas as telas enquanto ligado.
     - **Decisão do builder (semântica):** o ensaio isola **apenas os sorteios**. Os registros de sorteio e o andamento do palco ficam numa área só em memória, e a fila real nunca é alterada (o ensaio percorre a fila com um cursor próprio). Cadastros feitos durante o ensaio (prêmios, participantes, exclusões, configurações) **são gravados normalmente**, para ninguém perder trabalho por esquecer o ensaio ligado.
     - Ao desligar o ensaio, os sorteios de teste são descartados e o palco volta ao estado real.
     - O próprio modo ensaio não é persistido: um F5 sai do ensaio e volta ao estado real.
   - **Backup**: "Baixar backup" (`.json` com todo o estado, imagens incluídas) e "Restaurar backup" (substitui tudo, com confirmação).
   - **Medidor de armazenamento**: uso aproximado do localStorage.
   - **Zerar evento**: apaga tudo, com dupla confirmação (digitar "ZERAR").

### 6.4 Janela do apresentador (MVP, decisão do usuário)

- No palco, um botão discreto (ícone de monitor, junto da engrenagem) abre uma **segunda janela, a de Controle** (`#/controle`). O operador arrasta essa janela para o notebook, e a janela principal fica em tela cheia no telão.
- A janela de Controle tem duas partes:
  - **Ao vivo:** o que o palco mostra agora (fase, prêmio atual, ganhador atual); os mesmos botões de ação do palco (Próximo prêmio, Sortear, Confirmar, Ausente — ressortear, Desfazer último); o **próximo prêmio da fila**; quantos ainda concorrem; e um selo de conexão (🟢 conectado / 🔴 desconectado).
  - **Bastidores completo:** todas as abas da seção 6.3, para reordenar a fila e editar ao vivo sem nada aparecer no telão.
- **Arquitetura (decisão do builder):**
  - A janela do palco é a **dona do estado**: é a única que grava no localStorage e a única que sorteia.
  - A janela de Controle é um **espelho**. Recebe o estado completo a cada mudança e envia comandos ("sortear", "reordenar fila"…) que a dona executa.
  - A comunicação é por `window.postMessage` entre as duas janelas, porque funciona também no `file://`, onde `BroadcastChannel` e eventos de storage não são confiáveis.
  - Se o palco der F5, o Controle reconecta sozinho (handshake periódico). Se a conexão cair, o Controle mostra o selo vermelho e bloqueia os botões.
- O modal de Bastidores no palco (`Ctrl+K`) continua existindo, para a configuração antes do evento numa janela só.

### 6.5 Volume esperado (usuário)

- Cerca de **200 colaboradores** e **no máximo ~20 prêmios**. Data do evento ainda indefinida.
- Consequências:
  - 20 imagens comprimidas cabem com folga no localStorage.
  - O mural final cabe numa tela só (grade de até 5×4). Acima de 20 ganhadores, os cartões encolhem para continuar cabendo.

## 7. Regras do sorteio

**Elegíveis para um sorteio** = participantes
− e-mails na lista de exclusão
− quem tem um prêmio **confirmado**
− quem foi marcado **ausente** (decisão do usuário: ausente sai do sorteio)
− quem está no resultado atual, ainda não confirmado (para não ser ressorteado na hora).

- **Aleatoriedade:** `crypto.getRandomValues` com amostragem por rejeição (sem viés de módulo).
- **O ganhador é definido antes da animação.** A animação só encena um resultado já escolhido. O rolo é montado com uma amostra aleatória de nomes elegíveis (~30–40 cartões), terminando no ganhador.
- **Persistência imediata:** o resultado é gravado como `pending` assim que o sorteio é decidido, antes da animação. Se der F5 no meio, o app volta direto para o winnerReveal daquele ganhador, sem sortear de novo. Isso evita "ressortear por acidente" e qualquer suspeita de manipulação.
- Em modo ensaio, nada disso é gravado.

## 8. Modelo de dados (localStorage)

Uma chave única, versionada (`sorteio-viceri:v1`), contendo:

```ts
Prize       { id, name, image?: dataURL, groupId?, groupIndex?, groupSize?, createdAt }
Participant { id, name, email }              // email normalizado, único
Excluded    { id, name, email }
DrawRecord  { id, prizeId, participantId, name, email, status: 'pending'|'confirmed'|'absent', at }
Settings    { eventName, logo?: dataURL, suspenseSeconds, rehearsal: boolean }
State       { prizes, prizeQueue: id[], participants, excluded, draws, settings, stage: { phase, currentPrizeId?, currentDrawId? } }
```

- A fila (`prizeQueue`) guarda só IDs de prêmios pendentes, em ordem. Prêmio sorteado = tem `DrawRecord` confirmado.
- `DrawRecord` guarda nome e e-mail como snapshot, para o histórico continuar fiel mesmo se o participante for removido depois.
- Campo de versão do schema para migração futura.

**Imagens:** no upload, são redimensionadas no canvas para no máximo 640px no maior lado, em WebP qualidade ~0.8 (fallback JPEG). Alvo: menos de 80 KB por imagem. Prêmios com quantidade N **compartilham a mesma imagem** (guardada uma vez por `groupId`) para economizar espaço. Se uma gravação estourar a cota, o app avisa claramente e não perde o estado anterior.

## 9. Identidade visual (Duolingo-like)

- **Paleta:** verde principal `#58CC02` (sombra `#58A700`), verde claro `#89E219`, azul `#1CB0F6` (sombra `#1899D6`), vermelho `#FF4B4B` (sombra `#EA2B2B`), amarelo `#FFC800` (sombra `#E5B400`), laranja `#FF9600`, roxo `#CE82FF`. Neutros: texto `#4B4B4B`, secundário `#777777`, bordas `#E5E5E5`, fundo `#FFFFFF` / `#F7F7F7`.
- **Tipografia:** Nunito (800/900 para títulos e botões, 600/700 para texto), embutida no build via `@fontsource`, para funcionar offline.
- **Botões 3D:** cor sólida, `border-bottom` de 4px na cor de sombra, `border-radius` 16px, texto em caixa alta com peso 800. Ao pressionar, o botão "afunda" (translateY 4px, sem borda inferior).
- **Cards:** borda de 2px `#E5E5E5`, borda inferior de 4px, raio de 16–20px.
- **Movimento:** springs elásticos (Framer Motion), *bounce* nas entradas, *wiggle* em estados de espera. Respeitar `prefers-reduced-motion` com versões curtas.
- **Mascote original:** **"Presentinho"**, uma caixa de presente verde com laço, olhos grandes e expressivos, em SVG animado. Estados: aguardando (pulinhos), animado (olhos brilhando), suspense (tremendo, roendo unha), comemorando (pulando, laço girando), triste (sem elegíveis). Desenhado do zero; não é o Duo.
- **Avatares:** círculo com iniciais (primeiro + último nome), em cor fixa da paleta escolhida por hash do e-mail.
- **Tom do texto:** PT-BR, leve e brincalhão. Exemplos: "Bora sortear!", "Quem será?", "Temos um sortudo!", "Ixi, não veio? Bora de novo!".
- **Palco em 16:9:** tipografia grande, legível do fundo do salão. Nome do ganhador com no mínimo ~8vw.

## 10. Stack e entrega (decisões do builder)

- **Vite + React + TypeScript**
- **Tailwind CSS v4** (tokens da paleta acima)
- **Framer Motion** (animações), **canvas-confetti** (confete)
- **dnd-kit** (reordenação acessível)
- **Zustand** com middleware `persist` (estado + localStorage)
- **SheetJS** (`xlsx`, instalado pelo tarball oficial da CDN da SheetJS) para importar e exportar planilhas
- **lucide-react** (ícones)
- **Vitest** para a lógica pura: motor de sorteio, elegibilidade, parser de planilha, divisão de quantidade, desfazer e migração/backup
- **vite-plugin-singlefile**: o build gera **um único `dist/index.html`** com JS, CSS, fontes e mascote embutidos. Abre com dois cliques, sem servidor e sem internet.
- Uso recomendado no evento: Chrome ou Edge, sempre o mesmo navegador e o mesmo arquivo. Fazer backup antes do evento.

## 11. V2 (fora do MVP, se der tempo)

- Temas de animação alternativos (roleta, cartas virando).

## 12. Deixado para o builder

- Microcopy exata, curvas e durações das animações, layout fino de cada aba.
- Desenho final do mascote (dentro das diretrizes acima).
- Estrutura de pastas e componentes.

## 13. Riscos conhecidos

| Risco | Mitigação |
|---|---|
| Abrir Bastidores no telão revela a fila | Janela de Controle separada (MVP); modal só para preparação; atalho `Ctrl+K`, que passador nenhum envia |
| localStorage cheio por imagens | Compressão + imagem compartilhada por grupo + medidor + aviso claro |
| Dados perdidos (limpeza do navegador, troca de máquina) | Backup `.json` + persistência a cada ação + recuperação após F5 |
| Planilha em formato inesperado | Detecção + seletor manual de colunas + prévia antes de confirmar |
| `file://` com restrições do navegador | Build single-file sem chamadas de rede nem workers externos; testar no Chrome e no Edge |
