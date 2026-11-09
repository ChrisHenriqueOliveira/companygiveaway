import { UserPlus } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { validateNewPerson } from '../domain/people';
import type { Person } from '../domain/types';
import { Button, Field, TextInput } from '../ui';

const MESSAGES = {
  'name-required': 'Informe o nome.',
  'email-invalid': 'E-mail inválido.',
  duplicate: 'Este e-mail já está na lista.',
} as const;

interface Props {
  list: Person[];
  onAdd: (p: { name: string; email: string }) => void;
  buttonLabel?: string;
}

export function PersonForm({ list, onAdd, buttonLabel = 'Adicionar' }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string>();

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const v = validateNewPerson(list, { name, email });
    if (!v.ok) {
      setError(MESSAGES[v.error]);
      return;
    }
    onAdd(v.person);
    setName('');
    setEmail('');
    setError(undefined);
  };

  return (
    <form onSubmit={submit} className="grid grid-cols-1 items-start gap-3 md:grid-cols-[1fr_1fr_auto]">
      <Field label="Nome">
        <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome completo" />
      </Field>
      <Field label="E-mail" error={error}>
        <TextInput value={email} onChange={(e) => setEmail(e.target.value)} placeholder="pessoa@viceri.com.br" inputMode="email" />
      </Field>
      <Button type="submit" variant="secondary" icon={<UserPlus size={18} strokeWidth={3} />} className="md:mt-[26px]">
        {buttonLabel}
      </Button>
    </form>
  );
}
