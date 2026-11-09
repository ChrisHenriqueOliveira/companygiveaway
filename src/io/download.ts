export function downloadText(filename: string, text: string, mime = 'application/json'): void {
  const url = URL.createObjectURL(new Blob([text], { type: mime }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** AAAA-MM-DD_HHMM: nomes de arquivo de backup que não se sobrescrevem no mesmo dia. */
export function timeStamp(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${todayStamp(d)}_${p(d.getHours())}${p(d.getMinutes())}`;
}

export function todayStamp(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
