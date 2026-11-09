import { useState } from 'react';
import { Gift, Settings, Trophy } from 'lucide-react';
import { Presentinho, type Mood } from '../mascot/Presentinho';
import { Avatar, Badge, Button, Card, ConfirmDialog, EmptyState, Field, Modal, Slider, Tabs, TextInput, toast, Toaster, Toggle } from './index';

const MOODS: Mood[] = ['idle', 'excited', 'suspense', 'celebrate', 'sad'];

/** Página temporária de visualização do kit (removida na Task 8). */
export function KitPage() {
  const [tab, setTab] = useState('a');
  const [on, setOn] = useState(true);
  const [secs, setSecs] = useState(7);
  const [modal, setModal] = useState(false);
  const [confirm, setConfirm] = useState(false);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 p-8">
      <h1 className="text-4xl font-black text-feather">Kit Sorteio Viceri</h1>

      <Card className="flex flex-wrap items-end justify-around gap-4 p-6">
        {MOODS.map((m) => (
          <div key={m} className="flex flex-col items-center gap-2">
            <Presentinho mood={m} size={130} />
            <Badge color="blue">{m}</Badge>
          </div>
        ))}
      </Card>

      <Card className="flex flex-wrap items-center gap-4 p-6">
        <Button>Sortear</Button>
        <Button variant="secondary" icon={<Settings size={18} />}>Bastidores</Button>
        <Button variant="danger">Ausente</Button>
        <Button variant="warning" icon={<Trophy size={18} />}>Histórico</Button>
        <Button variant="ghost">Cancelar</Button>
        <Button disabled>Desabilitado</Button>
        <Button size="lg" icon={<Gift size={22} />}>Grande</Button>
        <Button size="xl">Próximo prêmio</Button>
      </Card>

      <Card className="flex flex-col gap-5 p-6">
        <Tabs tabs={[{ id: 'a', label: 'Prêmios' }, { id: 'b', label: 'Participantes' }, { id: 'c', label: 'Histórico' }]} value={tab} onChange={setTab} />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Nome"><TextInput placeholder="Ex.: Vale-presente" /></Field>
          <Field label="E-mail" error="E-mail inválido"><TextInput defaultValue="abc" /></Field>
        </div>
        <Toggle checked={on} onChange={setOn} label="Modo ensaio" />
        <Slider min={3} max={15} value={secs} onChange={setSecs} suffix="s" label="Suspense" />
        <div className="flex flex-wrap gap-2">
          <Badge color="green">confirmado</Badge><Badge color="red">ausente</Badge><Badge color="yellow">ensaio</Badge><Badge color="purple">2/3</Badge><Badge>cinza</Badge>
        </div>
        <div className="flex gap-3">
          {['Ana Souza', 'Bruno Lima', 'Carla Dias', 'Davi Rocha', 'Eva Nunes'].map((n) => (
            <Avatar key={n} name={n} email={`${n}@v.com`} size={56} />
          ))}
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setModal(true)}>Abrir modal</Button>
          <Button variant="danger" onClick={() => setConfirm(true)}>Confirmar</Button>
          <Button variant="warning" onClick={() => toast('Importados 200 participantes!', 'success')}>Toast</Button>
          <Button variant="ghost" onClick={() => toast('Não foi possível salvar.', 'error')}>Toast erro</Button>
        </div>
      </Card>

      <Card><EmptyState mood="sad" title="Nenhum prêmio ainda" description="Cadastre o primeiro prêmio para começar." /></Card>

      <Modal open={modal} onClose={() => setModal(false)} title="Exemplo de modal"><p className="text-lg font-bold">Conteúdo do modal. Esc fecha.</p></Modal>
      <ConfirmDialog open={confirm} title="Zerar evento" message="Isso apaga tudo." confirmLabel="Zerar" requireText="ZERAR" danger onConfirm={() => setConfirm(false)} onCancel={() => setConfirm(false)} />
      <Toaster />
    </div>
  );
}
