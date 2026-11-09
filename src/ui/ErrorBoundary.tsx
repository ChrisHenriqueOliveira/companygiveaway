import { Component, type ErrorInfo, type ReactNode } from 'react';
import { downloadText } from '../io/download';
import { useAppStore } from '../store/appStore';
import { STORAGE_KEY } from '../store/persistence';
import { Presentinho } from '../mascot/Presentinho';
import { Button } from './Button';

interface State {
  error: Error | null;
}

/** Um erro de tela nunca pode deixar o telão em branco: mostra saídas claras em vez disso. */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Erro na tela do sorteio:', error, info.componentStack);
  }

  private retry = () => this.setState({ error: null });

  /** Solta um palco travado (e descarta um sorteio ainda não confirmado) sem apagar nada confirmado. */
  private backToStart = () => {
    useAppStore.setState((s) => ({
      stage: { phase: 'idle' },
      draws: s.draws.filter((d) => d.status !== 'pending'),
      rehearsal: { ...s.rehearsal, stage: { phase: 'idle' }, draws: [] },
    }));
    this.retry();
  };

  private downloadRaw = () => {
    const raw = localStorage.getItem(STORAGE_KEY) ?? '{}';
    downloadText(`dados-salvos-${Date.now()}.json`, raw);
  };

  private wipe = () => {
    if (window.confirm('Apagar TODOS os dados salvos e recomeçar? Baixe a cópia antes, se puder.')) {
      localStorage.removeItem(STORAGE_KEY);
      location.reload();
    }
  };

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div role="alert" className="flex h-screen w-screen flex-col items-center justify-center gap-6 bg-white p-10 text-center">
        <Presentinho mood="sad" size={160} />
        <h1 className="text-5xl font-black text-eel">Opa, algo deu errado.</h1>
        <p className="max-w-3xl text-xl font-bold text-wolf">
          Seus dados salvos continuam guardados. Tente de novo; se não resolver, volte ao início do sorteio ou recarregue a página.
        </p>
        <p className="max-w-3xl truncate text-sm font-bold text-wolf/70">{this.state.error.message}</p>
        <div className="flex flex-wrap justify-center gap-4">
          <Button size="lg" onClick={this.retry}>
            Tentar de novo
          </Button>
          <Button size="lg" variant="secondary" onClick={this.backToStart}>
            Voltar ao início do sorteio
          </Button>
          <Button size="lg" variant="ghost" onClick={() => location.reload()}>
            Recarregar a página
          </Button>
        </div>
        <div className="flex flex-wrap justify-center gap-4 text-sm">
          <Button variant="ghost" onClick={this.downloadRaw}>
            Baixar cópia dos dados salvos
          </Button>
          <Button variant="ghost" onClick={this.wipe}>
            Apagar tudo e recomeçar
          </Button>
        </div>
      </div>
    );
  }
}
