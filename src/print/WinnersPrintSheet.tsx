import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ViceriMark } from '../brand/ViceriMark';
import { useAppStore } from '../store/appStore';
import { useWinners } from '../store/hooks';

/**
 * Folha de ganhadores para imprimir ou salvar em PDF (A4 paisagem): prêmio com foto, ganhador, e-mail
 * e uma caixinha "Entregue" com linha de assinatura. Fica fora do app (portal no body) e só aparece
 * na impressão; o CSS de impressão esconde todo o resto da página.
 */
export function WinnersPrintSheet() {
  const winners = useWinners();
  const eventName = useAppStore((s) => s.settings.eventName);
  const logoId = useAppStore((s) => s.settings.logoImageId);
  const logo = useAppStore((s) => (logoId ? s.images[logoId] : undefined));
  const rehearsal = useAppStore((s) => s.rehearsal.active);
  const [printedAt, setPrintedAt] = useState(() => new Date());

  useEffect(() => {
    const refresh = () => setPrintedAt(new Date());
    window.addEventListener('beforeprint', refresh);
    return () => window.removeEventListener('beforeprint', refresh);
  }, []);

  return createPortal(
    <div className="print-root">
      <header className="flex items-center gap-5 border-b-[3px] border-[#FD4237] pb-3">
        {logo ? <img src={logo} alt="" className="h-14 object-contain" /> : <ViceriMark size={56} />}
        <div>
          <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-[#777]">{eventName}</p>
          <h1 className="text-3xl font-black text-[#FD4237]">Ganhadores</h1>
        </div>
      </header>

      {rehearsal && (
        <p className="mt-3 rounded-lg border-2 border-[#FFB41F] bg-[#FFF3D4] px-3 py-1.5 text-center text-sm font-black uppercase tracking-widest text-[#D99200]">
          Ensaio — não é o resultado oficial
        </p>
      )}

      {winners.length === 0 ? (
        <p className="mt-8 text-center text-xl font-bold text-[#777]">Nenhum ganhador ainda.</p>
      ) : (
        <table className="mt-4 w-full border-collapse text-left">
          <thead>
            <tr className="text-xs font-extrabold uppercase tracking-wider text-[#777]">
              <th className="w-10 border-b-2 border-[#ddd] py-2 pr-2">Nº</th>
              <th className="border-b-2 border-[#ddd] py-2 pr-3">Prêmio</th>
              <th className="border-b-2 border-[#ddd] py-2 pr-3">Ganhador</th>
              <th className="w-72 border-b-2 border-[#ddd] py-2">Entregue / assinatura</th>
            </tr>
          </thead>
          <tbody>
            {winners.map((w) => (
              <tr key={w.draw.id} className="align-middle">
                <td className="border-b border-[#ddd] py-2 pr-2 text-lg font-black text-[#999]">{w.order}</td>
                <td className="border-b border-[#ddd] py-2 pr-3">
                  <div className="flex items-center gap-3">
                    {w.image && (
                      <img src={w.image} alt="" className="h-[22mm] w-[22mm] shrink-0 rounded-lg border border-[#ddd] object-contain" />
                    )}
                    <span className="text-base font-black text-[#333]">{w.prizeName}</span>
                  </div>
                </td>
                <td className="border-b border-[#ddd] py-2 pr-3">
                  <div className="text-lg font-black text-[#222]">{w.draw.name}</div>
                  <div className="text-xs font-bold text-[#777]">{w.draw.email}</div>
                </td>
                <td className="border-b border-[#ddd] py-2">
                  <div className="flex items-end gap-3">
                    <span className="text-3xl leading-none text-[#555]">☐</span>
                    <span className="mb-1 flex-1 border-b border-[#999]" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <footer className="mt-6 text-xs font-bold text-[#999]">
        Gerado em {printedAt.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
      </footer>
    </div>,
    document.body,
  );
}
