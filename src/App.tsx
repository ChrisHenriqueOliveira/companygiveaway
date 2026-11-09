import { BackstagePanel } from './backstage/BackstagePanel';
import { Toaster } from './ui';
import { KitPage } from './ui/KitPage';

export function App() {
  if (location.hash === '#/kit') return <KitPage />;
  // Temporário (Task 7): visualização dos Bastidores. Removido na Task 8.
  if (location.hash === '#/bastidores') {
    return (
      <div className="mx-auto max-w-5xl p-6">
        <BackstagePanel />
        <Toaster />
      </div>
    );
  }
  return (
    <div className="flex h-full items-center justify-center">
      <button className="btn-3d btn-feather px-8 py-4 text-xl">Bora sortear!</button>
    </div>
  );
}
