import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ChevronDown, GripVertical, Minus, MonitorPlay, Pencil, Plus, Shuffle, Trash2 } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import type { ID, Prize } from '../domain/types';
import { selectActiveStage, useAppStore } from '../store/appStore';
import { useActions } from '../store/actions';
import { useUsage } from '../store/hooks';
import { Badge, Button, Card, ConfirmDialog, EmptyState, Field, Modal, TextInput, toast } from '../ui';
import { PrizeImage } from '../ui/PrizeImage';
import { ImagePicker } from './ImagePicker';

const MAX_QTY = 20;

function PrizeRow({
  prize,
  index,
  image,
  inStage,
  canForce,
  onForce,
  onEdit,
  onDelete,
}: {
  prize: Prize;
  index: number;
  image?: string;
  inStage: boolean;
  canForce: boolean;
  onForce: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: prize.id });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-3 rounded-2xl border-2 border-b-4 bg-white p-2.5 pr-3 ${
        isDragging ? 'z-10 border-macaw shadow-xl' : 'border-swan'
      }`}
    >
      <button
        type="button"
        aria-label={`Arrastar ${prize.name}`}
        className="cursor-grab touch-none rounded-lg p-1.5 text-wolf hover:bg-polar active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical size={22} strokeWidth={3} />
      </button>
      <span className="w-7 text-center text-lg font-black text-wolf">{index + 1}</span>
      <PrizeImage src={image} size={48} />
      <span className="min-w-0 flex-1 truncate text-lg font-extrabold text-eel">{prize.name}</span>
      {prize.groupSize && prize.groupSize > 1 && <Badge color="purple">{`${prize.groupIndex}/${prize.groupSize}`}</Badge>}
      {inStage && <Badge color="yellow">No palco</Badge>}
      {canForce && (
        <button
          type="button"
          aria-label={`Mandar ${prize.name} para o palco`}
          title="Mandar para o palco agora"
          onClick={onForce}
          className="rounded-lg p-2 text-wolf hover:bg-polar hover:text-feather-dark"
        >
          <MonitorPlay size={18} strokeWidth={3} />
        </button>
      )}
      <button type="button" aria-label={`Editar ${prize.name}`} onClick={onEdit} className="rounded-lg p-2 text-wolf hover:bg-polar hover:text-macaw">
        <Pencil size={18} strokeWidth={3} />
      </button>
      <button
        type="button"
        aria-label={`Excluir ${prize.name}`}
        disabled={inStage}
        onClick={onDelete}
        className="rounded-lg p-2 text-wolf hover:bg-polar hover:text-cardinal disabled:cursor-not-allowed disabled:opacity-30"
      >
        <Trash2 size={18} strokeWidth={3} />
      </button>
    </li>
  );
}

function EditPrizeDialog({ prize, image, onClose }: { prize: Prize; image?: string; onClose: () => void }) {
  const actions = useActions();
  const [name, setName] = useState(prize.name);
  const [img, setImg] = useState<{ changed: boolean; value?: string }>({ changed: false, value: image });
  const save = () => {
    actions.updatePrize(prize.id, {
      name,
      ...(img.changed ? { image: img.value ?? null } : {}),
    });
    onClose();
  };
  return (
    <Modal open onClose={onClose} title="Editar prêmio" size="md">
      <div className="flex flex-col gap-4">
        <Field label="Nome do prêmio">
          <TextInput value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        </Field>
        <ImagePicker value={img.value} onChange={(v) => setImg({ changed: true, value: v })} ariaLabel="Trocar imagem do prêmio" />
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={save} disabled={!name.trim()}>Salvar</Button>
        </div>
      </div>
    </Modal>
  );
}

export function PrizesTab() {
  const actions = useActions();
  const queue = useAppStore((s) => s.queue);
  const prizes = useAppStore((s) => s.prizes);
  const images = useAppStore((s) => s.images);
  const draws = useAppStore((s) => s.draws);
  const stage = useAppStore(selectActiveStage);
  const rehearsal = useAppStore((s) => s.rehearsal);
  const usage = useUsage();

  const [name, setName] = useState('');
  const [qty, setQty] = useState(1);
  const [image, setImage] = useState<string>();
  const [error, setError] = useState<string>();
  const [editing, setEditing] = useState<ID>();
  const [deleting, setDeleting] = useState<ID>();
  const [shuffleAsk, setShuffleAsk] = useState(false);
  const [doneOpen, setDoneOpen] = useState(false);
  const [forcing, setForcing] = useState<ID>();

  // Há um ganhador sorteado/na tela que ainda não foi confirmado? Trocar o prêmio descarta esse sorteio.
  const hasPendingDraw = (rehearsal.active ? rehearsal.draws : draws).some((d) => d.status === 'pending');
  const force = (id: ID) => {
    if (hasPendingDraw) setForcing(id);
    else {
      actions.stageForcePrize(id);
      toast('Prêmio enviado ao palco!', 'success');
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const inStageId =
    stage.phase === 'prizeReveal' || stage.phase === 'drawing' || stage.phase === 'winnerReveal' || stage.phase === 'noEligible'
      ? stage.prizeId
      : undefined;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Dê um nome ao prêmio.');
      return;
    }
    actions.addPrizes({ name, image, quantity: qty });
    toast(qty > 1 ? `${qty} prêmios cadastrados!` : 'Prêmio cadastrado!', 'success');
    setName('');
    setQty(1);
    setImage(undefined);
    setError(undefined);
  };

  const onDragEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    const from = queue.indexOf(String(e.active.id));
    const to = queue.indexOf(String(e.over.id));
    if (from < 0 || to < 0) return;
    actions.reorderQueue(arrayMove(queue, from, to));
  };

  const queued = queue.filter((id) => prizes[id]);
  const winners = draws.filter((d) => d.status === 'confirmed');

  return (
    <div className="flex flex-col gap-6">
      {usage.ratio > 0.8 && (
        <div className="rounded-2xl border-2 border-bee bg-[#FFF5CC] px-4 py-3 font-extrabold text-fox">
          O armazenamento está quase cheio ({Math.round(usage.ratio * 100)}%). Remova imagens ou baixe um backup.
        </div>
      )}

      <Card className="p-5">
        <form onSubmit={submit} className="grid grid-cols-1 gap-5 md:grid-cols-[220px_1fr]">
          <ImagePicker value={image} onChange={setImage} ariaLabel="Imagem do prêmio" />
          <div className="flex flex-col gap-4">
            <Field label="Nome do prêmio" error={error}>
              <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Vale-presente R$200" />
            </Field>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <Field label="Quantidade">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" aria-label="Diminuir quantidade" disabled={qty <= 1} onClick={() => setQty((q) => Math.max(1, q - 1))} icon={<Minus size={18} strokeWidth={3} />} />
                  <span className="w-12 text-center text-2xl font-black text-eel" aria-live="polite">{qty}</span>
                  <Button variant="ghost" aria-label="Aumentar quantidade" disabled={qty >= MAX_QTY} onClick={() => setQty((q) => Math.min(MAX_QTY, q + 1))} icon={<Plus size={18} strokeWidth={3} />} />
                </div>
              </Field>
              <Button type="submit" size="lg">Cadastrar prêmio</Button>
            </div>
            {qty > 1 && (
              <p className="text-sm font-bold text-wolf">
                Serão criados {qty} prêmios separados, sorteados em momentos diferentes.
              </p>
            )}
          </div>
        </form>
      </Card>

      <Card className="flex flex-col gap-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-black text-eel">Fila de sorteio</h3>
            <Badge color="blue">{queued.length} na fila</Badge>
          </div>
          <Button variant="ghost" icon={<Shuffle size={16} strokeWidth={3} />} disabled={queued.length < 2} onClick={() => setShuffleAsk(true)}>
            Embaralhar fila
          </Button>
        </div>

        {queued.length === 0 ? (
          <EmptyState title="A fila está vazia" description="Cadastre prêmios acima. A ordem aqui é a ordem do sorteio." />
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={queued} strategy={verticalListSortingStrategy}>
              <ul className="flex flex-col gap-2">
                {queued.map((id, i) => (
                  <PrizeRow
                    key={id}
                    prize={prizes[id]}
                    index={i}
                    image={prizes[id].imageId ? images[prizes[id].imageId!] : undefined}
                    inStage={id === inStageId}
                    canForce={!(id === inStageId && stage.phase === 'prizeReveal')}
                    onForce={() => force(id)}
                    onEdit={() => setEditing(id)}
                    onDelete={() => setDeleting(id)}
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        )}
      </Card>

      <Card className="p-5">
        <button
          type="button"
          aria-expanded={doneOpen}
          onClick={() => setDoneOpen((o) => !o)}
          className="flex w-full items-center justify-between text-left"
        >
          <span className="flex items-center gap-3 text-xl font-black text-eel">
            Já sorteados <Badge color="green">{winners.length}</Badge>
          </span>
          <ChevronDown className={`transition ${doneOpen ? 'rotate-180' : ''}`} strokeWidth={3} />
        </button>
        {doneOpen && (
          <ul className="mt-4 flex flex-col gap-2">
            {winners.length === 0 && <li className="font-bold text-wolf">Ninguém ganhou ainda.</li>}
            {winners.map((d) => {
              const p = prizes[d.prizeId];
              return (
                <li key={d.id} className="flex items-center gap-3 rounded-2xl bg-polar p-2.5">
                  <PrizeImage src={p?.imageId ? images[p.imageId] : undefined} size={40} />
                  <span className="flex-1 font-extrabold text-eel">{d.prizeName}</span>
                  <span className="font-extrabold text-feather-dark">{d.name}</span>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {editing && prizes[editing] && (
        <EditPrizeDialog
          prize={prizes[editing]}
          image={prizes[editing].imageId ? images[prizes[editing].imageId!] : undefined}
          onClose={() => setEditing(undefined)}
        />
      )}
      <ConfirmDialog
        open={!!forcing}
        title="Mandar para o palco"
        message={`O sorteio em andamento será descartado: a pessoa já sorteada volta a concorrer. Mandar “${forcing ? prizes[forcing]?.name : ''}” para o palco agora?`}
        confirmLabel="Mandar para o palco"
        onCancel={() => setForcing(undefined)}
        onConfirm={() => {
          if (forcing) actions.stageForcePrize(forcing);
          setForcing(undefined);
          toast('Prêmio enviado ao palco!', 'success');
        }}
      />
      <ConfirmDialog
        open={!!deleting}
        title="Excluir prêmio"
        message={`Excluir “${deleting ? prizes[deleting]?.name : ''}” da fila?`}
        confirmLabel="Excluir"
        danger
        onCancel={() => setDeleting(undefined)}
        onConfirm={() => {
          if (deleting) actions.removePrize(deleting);
          setDeleting(undefined);
        }}
      />
      <ConfirmDialog
        open={shuffleAsk}
        title="Embaralhar fila"
        message="A ordem atual dos prêmios será trocada por uma ordem aleatória."
        confirmLabel="Embaralhar"
        onCancel={() => setShuffleAsk(false)}
        onConfirm={() => {
          actions.shuffleQueue();
          setShuffleAsk(false);
        }}
      />
    </div>
  );
}
