/** Abre a janela de Controle (o operador a arrasta para o notebook; o palco fica no telão). */
export function openControlWindow(): Window | null {
  const base = location.href.split('#')[0];
  return window.open(`${base}#/controle`, 'sorteio-controle', 'popup,width=1280,height=820');
}
