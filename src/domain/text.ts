/** Minúsculas e sem acentos: "João" e "joao" passam a ser a mesma coisa em buscas. */
export function foldText(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}
