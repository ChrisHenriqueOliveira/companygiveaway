let control: Window | null = null;

/**
 * Abre (ou traz para a frente) a janela de Controle. É o único caminho para os Bastidores:
 * assim nada de configuração ou fila de prêmios aparece no telão. Devolve null se o popup foi bloqueado.
 */
export function openControlWindow(): Window | null {
  if (control && !control.closed) {
    control.focus();
    return control;
  }
  const base = location.href.split('#')[0];
  control = window.open(`${base}#/controle`, 'sorteio-controle', 'popup,width=1280,height=820');
  return control;
}
