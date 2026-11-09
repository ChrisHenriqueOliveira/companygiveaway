import { KitPage } from './ui/KitPage';

export function App() {
  if (location.hash === '#/kit') return <KitPage />;
  return (
    <div className="flex h-full items-center justify-center">
      <button className="btn-3d btn-feather px-8 py-4 text-xl">Bora sortear!</button>
    </div>
  );
}
