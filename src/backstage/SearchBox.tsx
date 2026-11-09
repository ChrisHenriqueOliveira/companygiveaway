import { Search } from 'lucide-react';
import { TextInput } from '../ui';

export function SearchBox({ value, onChange, placeholder = 'Buscar…' }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="relative">
      <Search size={18} strokeWidth={3} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-wolf" />
      <TextInput
        aria-label={placeholder}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-11"
      />
    </div>
  );
}
