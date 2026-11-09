import { useEffect, useSyncExternalStore } from 'react';
import { BackstagePanel } from '../backstage/BackstagePanel';
import { Presentinho } from '../mascot/Presentinho';
import { WinnersPrintSheet } from '../print/WinnersPrintSheet';
import { useAppStore } from '../store/appStore';
import { getLinkSnapshot, startMirror, subscribeLink } from '../sync/mirrorBridge';
import { Badge, Toaster } from '../ui';
import { useControlHotkeys } from './hotkeys';
import { LivePanel } from './LivePanel';

export function ControlApp() {
  const { connected } = useSyncExternalStore(subscribeLink, getLinkSnapshot);
  const eventName = useAppStore((s) => s.settings.eventName);
  const storageError = useAppStore((s) => s.storageError);
  const hasOpener = !!window.opener && !window.opener.closed;
  useControlHotkeys();

  useEffect(() => {
    document.title = 'Controle — Sorteio Viceri';
    return startMirror();
  }, []);

  return (
    <div className="flex h-screen flex-col bg-polar">
      <header className="flex items-center gap-4 border-b-2 border-swan bg-white px-6 py-3">
        <Presentinho mood={connected ? 'idle' : 'sad'} size={52} />
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-black text-eel">Controle do sorteio</h1>
          <p className="truncate text-sm font-bold text-wolf">{eventName}</p>
        </div>
        <Badge color={connected ? 'green' : 'red'} className="text-sm">
          {connected ? '🟢 Conectado ao palco' : '🔴 Desconectado'}
        </Badge>
      </header>

      {storageError && (
        <div className="bg-cardinal px-6 py-2 text-center font-extrabold text-white" role="alert">
          {storageError}
        </div>
      )}

      {!connected && (
        <div className="bg-cardinal px-6 py-2 text-center font-extrabold text-white" role="alert">
          {hasOpener
            ? 'Sem conexão com o palco. Os botões ficam travados até ele voltar.'
            : 'Abra esta janela pelo botão “Janela de controle” no palco (ícone de monitor, canto inferior direito).'}
        </div>
      )}

      <main
        className={`grid min-h-0 flex-1 grid-cols-1 gap-6 p-6 transition lg:grid-cols-[400px_1fr] ${
          connected ? '' : 'pointer-events-none opacity-50'
        }`}
        aria-disabled={!connected}
      >
        <aside className="min-h-0 overflow-auto">
          <LivePanel />
        </aside>
        <section className="min-h-0 overflow-auto pr-1">
          <BackstagePanel />
        </section>
      </main>
      <Toaster />
      <WinnersPrintSheet />
    </div>
  );
}
