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

Os **Bastidores** abrem sempre na janela de **Controle** (ícone de monitor, ou `Ctrl+K`), nunca no telão. Têm cinco abas: Prêmios, Participantes, Exclusões, Histórico e Evento.

### Atalhos do palco

| Tecla | Ação |
|---|---|
| `Espaço` / `Enter` / `→` / `PageDown` | Avança (próximo prêmio → sortear → confirmar) |
| `R` | Ausente: ressortear o mesmo prêmio |
| `F` | Tela cheia |
| `P` | No mural final: imprimir / salvar em PDF a folha de ganhadores |
| `Ctrl+K` | Abre/fecha os Bastidores |
| `Esc` | Fecha o modal |

No Controle, depois de clicar nele o passador de slides continua funcionando (teclas `→` e `PageDown`). O "Ausente" no Controle pede confirmação com o nome da pessoa.

Os botões "tela preta" dos passadores de slide (`B`, `.`, `W`) e `PageUp` são ignorados de propósito.

### Mural final e folha de ganhadores

No fim, o palco mostra um cartão por ganhador: imagem grande do prêmio, faixa colorida com o nome do prêmio e o ganhador embaixo. Dá para imprimir ou salvar em PDF a **folha de ganhadores** (A4 paisagem, com foto do prêmio, nome, e-mail e uma caixinha "Entregue ☐" com linha de assinatura): tecla `P` no mural, o ícone de impressora no canto, o botão "Imprimir ganhadores" no Controle e no Histórico, ou `Ctrl+P` em qualquer tela. No modo ensaio a folha sai marcada como "Ensaio — não é o resultado oficial".

### Tempos (aba Evento)

- **Abertura do presente** (2–15 s): quanto tempo a caixa balança antes de abrir e mostrar o prêmio.
- **Duração do sorteio** (3–15 s): rolo de nomes e ritmo da revelação do ganhador.

Os dois são independentes e valem sempre, mesmo com "reduzir movimento" ligado no sistema.

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
- [ ] Combinar com os apresentadores quem avisa que é o último prêmio (o app não mostra isso).

**Se algo der errado:**
- Fechou a aba ou deu F5 no meio de um sorteio: reabra e o app continua do mesmo ponto.
- Clicou errado: Histórico → **Desfazer último** (também no Controle). Para voltar um registro antigo (a pessoa volta a concorrer e, se estava confirmado, o prêmio volta para a fila), use a lixeira na linha do histórico. Ausentes não devolvem o prêmio.
- Perdeu os dados do navegador: Evento → **Restaurar backup**. Antes de restaurar ou zerar, o app baixa sozinho uma cópia do estado atual (`backup-antes-de-...json`).
- Apareceu a tela "Opa, algo deu errado": use **Tentar de novo** ou **Voltar ao início do sorteio**; os dados salvos não são apagados.
- Se o app avisar que não consegue salvar (bolinha vermelha no telão, aviso no Controle), o **sorteio fica bloqueado** até voltar a salvar: remova imagens grandes ou baixe um backup.

## Limitações conhecidas

- Os dados ficam no navegador (`localStorage`, cerca de 5 MB). As imagens dos prêmios são reduzidas automaticamente (até 1280 px, em WebP, com teto de tamanho por imagem). O app avisa quando o espaço passa de 80%.
- Só **uma janela do palco** pode estar aberta: se outra gravar nos mesmos dados, o palco avisa e trava até recarregar.
- Uma janela de Controle por palco. Se o palco recarregar, o Controle reconecta sozinho em poucos segundos.
- Feito para notebook + telão 16:9, não para celular.
- O tempo de **suspense** (aba Evento) vale sempre. Se o sistema estiver com "reduzir movimento" ligado, o app só desliga os movimentos decorativos do mascote e do fundo.
- Os assets visuais (mascote "Presentinho") são originais, inspirados no estilo Duolingo, e não usam marcas do Duolingo.
