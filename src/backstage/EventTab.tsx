import { Download, Trash2, Upload } from 'lucide-react';
import { useEffect, useState } from 'react';
import { downloadText, timeStamp } from '../io/download';
import { parseBackup, serializeBackup } from '../io/backup';
import { useActions } from '../store/actions';
import { useAppStore } from '../store/appStore';
import { useUsage } from '../store/hooks';
import type { AppData } from '../domain/types';
import { Badge, Button, Card, ConfirmDialog, Field, Slider, TextInput, toast, Toggle } from '../ui';
import { ImagePicker } from './ImagePicker';

export function EventTab() {
  const actions = useActions();
  const eventName = useAppStore((s) => s.settings.eventName);
  const suspense = useAppStore((s) => s.settings.suspenseSeconds);
  const giftSecondsSaved = useAppStore((s) => s.settings.giftSeconds);
  const logoId = useAppStore((s) => s.settings.logoImageId);
  const logo = useAppStore((s) => (logoId ? s.images[logoId] : undefined));
  const rehearsal = useAppStore((s) => s.rehearsal.active);
  const usage = useUsage();

  const [name, setName] = useState(eventName);
  const [secs, setSecs] = useState(suspense);
  const [gift, setGift] = useState(giftSecondsSaved);
  const [pendingBackup, setPendingBackup] = useState<AppData>();
  const [resetting, setResetting] = useState(false);

  useEffect(() => setName(eventName), [eventName]);
  useEffect(() => setSecs(suspense), [suspense]);
  useEffect(() => setGift(giftSecondsSaved), [giftSecondsSaved]);

  const commitName = () => {
    if (name.trim() && name.trim() !== eventName) actions.updateSettings({ eventName: name });
    else setName(eventName);
  };

  const backup = () => {
    downloadText(`backup-sorteio-${timeStamp()}.json`, serializeBackup(useAppStore.getState()));
    toast('Backup baixado! Guarde esse arquivo.', 'success');
  };

  /** Cópia automática do que está no app agora, antes de qualquer ação que substitui ou apaga tudo. */
  const snapshotBefore = (what: 'restaurar' | 'zerar') =>
    downloadText(`backup-antes-de-${what}-${timeStamp()}.json`, serializeBackup(useAppStore.getState()));

  const onBackupFile = async (file?: File) => {
    if (!file) return;
    const text =
      typeof file.text === 'function'
        ? await file.text()
        : await new Promise<string>((resolve, reject) => {
            const r = new FileReader();
            r.onload = () => resolve(String(r.result));
            r.onerror = () => reject(r.error);
            r.readAsText(file);
          });
    const parsed = parseBackup(text);
    if (!parsed.ok) {
      toast(parsed.error, 'error');
      return;
    }
    setPendingBackup(parsed.data);
  };

  const pct = Math.min(100, Math.round(usage.ratio * 100));

  return (
    <div className="flex flex-col gap-6">
      <Card className="flex flex-col gap-5 p-5">
        <h3 className="text-xl font-black text-eel">Evento</h3>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-[1fr_220px]">
          <div className="flex flex-col gap-5">
            <Field label="Nome do evento">
              <TextInput
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={commitName}
                onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
              />
            </Field>
            <Field label="Abertura do presente (tempo balançando antes de abrir)">
              <Slider
                min={2}
                max={15}
                value={gift}
                suffix="s"
                label="Abertura do presente"
                onChange={(v) => {
                  setGift(v);
                  actions.updateSettings({ giftSeconds: v });
                }}
              />
            </Field>
            <Field label="Duração do sorteio (rolo de nomes e revelação do ganhador)">
              <Slider
                min={3}
                max={15}
                value={secs}
                suffix="s"
                label="Duração do sorteio"
                onChange={(v) => {
                  setSecs(v);
                  actions.updateSettings({ suspenseSeconds: v });
                }}
              />
            </Field>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-extrabold uppercase tracking-wider text-wolf">Logo</span>
            <ImagePicker
              value={logo}
              ariaLabel="Logo do evento"
              hint="Logo do evento"
              onChange={(v) => actions.updateSettings({ logo: v ?? null })}
            />
          </div>
        </div>
      </Card>

      <Card className="flex flex-col gap-3 p-5">
        <h3 className="text-xl font-black text-eel">Modo ensaio</h3>
        <p className="font-bold text-wolf">
          Treine o sorteio sem estragar nada: os sorteios de teste não ficam salvos e somem ao desligar. Cadastros feitos durante o ensaio continuam salvos.
        </p>
        <Toggle checked={rehearsal} onChange={actions.setRehearsal} label={rehearsal ? 'Ensaio ligado' : 'Ensaio desligado'} />
      </Card>

      <Card className="flex flex-col gap-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-xl font-black text-eel">Backup e armazenamento</h3>
          <Badge color={pct > 80 ? 'red' : 'green'}>{pct}% do espaço usado</Badge>
        </div>
        <div className="h-4 overflow-hidden rounded-full bg-swan" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Armazenamento usado">
          <div className={`h-full rounded-full transition-all ${pct > 80 ? 'bg-cardinal' : 'bg-feather'}`} style={{ width: `${Math.max(pct, 2)}%` }} />
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" icon={<Download size={18} strokeWidth={3} />} onClick={backup}>
            Baixar backup
          </Button>
          <label className="btn-3d btn-ghost cursor-pointer px-5 py-2.5 text-sm">
            <Upload size={18} strokeWidth={3} />
            Restaurar backup
            <input
              type="file"
              accept=".json,application/json"
              className="sr-only"
              aria-label="Arquivo de backup"
              onChange={(e) => {
                void onBackupFile(e.target.files?.[0]);
                e.target.value = '';
              }}
            />
          </label>
        </div>
      </Card>

      <Card className="flex flex-wrap items-center justify-between gap-4 border-cardinal p-5">
        <div>
          <h3 className="text-xl font-black text-cardinal">Zerar evento</h3>
          <p className="font-bold text-wolf">Apaga prêmios, participantes, exclusões e histórico. Faça um backup antes.</p>
        </div>
        <Button variant="danger" icon={<Trash2 size={18} strokeWidth={3} />} onClick={() => setResetting(true)}>
          Zerar evento
        </Button>
      </Card>

      <ConfirmDialog
        open={!!pendingBackup}
        title="Restaurar backup"
        message={
          pendingBackup
            ? `O arquivo tem ${Object.keys(pendingBackup.prizes).length} prêmios, ${pendingBackup.participants.length} participantes, ${pendingBackup.excluded.length} exclusões e ${pendingBackup.draws.length} sorteios. Tudo o que está no app agora será substituído (uma cópia do estado atual é baixada antes, automaticamente).`
            : ''
        }
        confirmLabel="Restaurar"
        danger
        onCancel={() => setPendingBackup(undefined)}
        onConfirm={() => {
          if (pendingBackup) {
            snapshotBefore('restaurar');
            actions.restoreBackup(pendingBackup);
          }
          setPendingBackup(undefined);
          toast('Backup restaurado!', 'success');
        }}
      />
      <ConfirmDialog
        open={resetting}
        title="Zerar evento"
        message="Isso apaga tudo e não pode ser desfeito. Uma cópia do que está no app agora é baixada automaticamente antes."
        confirmLabel="Zerar tudo"
        requireText="ZERAR"
        danger
        onCancel={() => setResetting(false)}
        onConfirm={() => {
          snapshotBefore('zerar');
          actions.resetAll();
          setResetting(false);
          toast('Evento zerado.', 'info');
        }}
      />
    </div>
  );
}
