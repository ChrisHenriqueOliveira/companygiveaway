# 🎁 Sorteio Viceri

App de uma página para sortear os prêmios da festa de fim de ano, no estilo Duolingo. Roda **100% offline** a partir de **um único arquivo**: `dist/index.html`. Os dados ficam no `localStorage` do navegador.

## Gerar o arquivo

```bash
npm install
npm run build
```

O resultado é `dist/index.html`. Copie esse arquivo para o notebook do evento e abra com dois cliques (Chrome ou Edge). Não precisa de servidor nem de internet.

Outros comandos: `npm run dev` (desenvolvimento), `npm test` (testes), `npm run preview` (serve o `dist` por HTTP).

## Como funciona

Duas janelas:

- **Palco**: a janela principal, que vai no telão. Mostra só o momento atual. Nunca mostra a fila de prêmios, quantos faltam nem se o prêmio atual é o último.
- **Controle**: abre pelo ícone de **monitor** (canto inferior direito do palco). É a janela do operador, com os botões, a fila, o histórico e todos os Bastidores. Arraste essa janela para o notebook e deixe o palco em tela cheia no telão.

Os **Bastidores** (engrenagem no canto inferior esquerdo, ou `Ctrl+K`) têm cinco abas: Prêmios, Participantes, Exclusões, Histórico e Evento.

### Atalhos do palco

| Tecla | Ação |
|---|---|
| `Espaço` / `Enter` / `→` / `PageDown` | Avança (próximo prêmio → sortear → confirmar) |
| `R` | Ausente: ressortear o mesmo prêmio |
| `F` | Tela cheia |
| `Ctrl+K` | Abre/fecha os Bastidores |
| `Esc` | Fecha o modal |

Os botões "tela preta" dos passadores de slide (`B`, `.`, `W`) e `PageUp` são ignorados de propósito.

### Regras do sorteio

- Cada pessoa ganha no máximo um prêmio.
- Quem está na lista de **Exclusões** (comparada pelo e-mail) nunca é sorteado.
- Quem foi marcado como **ausente** sai do sorteio.
- Prêmio com quantidade 3 vira 3 prêmios separados na fila, sorteados em momentos diferentes.
- O ganhador é decidido (com `crypto.getRandomValues`) e gravado **antes** da animação. Se der F5 no meio, a tela volta ao mesmo ganhador.

## Checklist do dia do evento

**Antes (dias antes):**
- [ ] Gerar `dist/index.html` e abrir no navegador do evento.
- [ ] Importar a planilha de colaboradores (colunas de nome e e-mail) e conferir a prévia.
- [ ] Cadastrar as exclusões (diretores e organizadores).
- [ ] Cadastrar os prêmios (nome, imagem, quantidade) e deixar na ordem do sorteio.
- [ ] Fazer um ensaio completo com o **Modo ensaio** ligado (aba Evento) e depois **desligar**.
- [ ] Baixar um **backup** (aba Evento) e guardar o arquivo `.json`.

**No dia:**
- [ ] Usar **o mesmo navegador e o mesmo arquivo** de antes (os dados ficam no navegador).
- [ ] Conferir que o **Modo ensaio está desligado** (sem a faixa amarela no topo).
- [ ] Usar **tela estendida**: palco em tela cheia (`F`) no telão e Controle no notebook.
- [ ] Permitir popups para a página, se o navegador bloquear a janela de Controle.
- [ ] Abrir a janela de Controle **antes** de colocar o palco em tela cheia.
- [ ] Evitar o botão de "apresentação" do passador de slides: ele costuma enviar `Esc`, que sai da tela cheia (o `F5` já é ignorado pelo palco).
- [ ] Conferir que o Windows está com **efeitos de animação** ligados (com animações desligadas o suspense vira 2 s).
- [ ] Combinar com os apresentadores quem avisa que é o último prêmio (o app não mostra isso).

**Se algo der errado:**
- Fechou a aba ou deu F5 no meio de um sorteio: reabra e o app continua do mesmo ponto.
- Clicou errado: Histórico → **Desfazer último** (também no Controle).
- Perdeu os dados do navegador: Evento → **Restaurar backup**.

## Limitações conhecidas

- Os dados ficam no navegador (`localStorage`, cerca de 5 MB). As imagens dos prêmios são reduzidas automaticamente (até 640 px). O app avisa quando o espaço passa de 80%.
- Só **uma janela do palco** pode estar aberta: se outra gravar nos mesmos dados, o palco avisa e trava até recarregar.
- Uma janela de Controle por palco. Se o palco recarregar, o Controle reconecta sozinho em poucos segundos.
- Feito para notebook + telão 16:9, não para celular.
- Os assets visuais (mascote "Presentinho") são originais, inspirados no estilo Duolingo, e não usam marcas do Duolingo.
