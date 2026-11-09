import { isValidEmail, normalizeEmail } from './email';
import type { Person } from './types';

const PALETTE = ['#58CC02', '#1CB0F6', '#FF4B4B', '#FFC800', '#FF9600', '#CE82FF'];

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0][0];
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

export function avatarColor(email: string): string {
  let h = 0;
  for (let i = 0; i < email.length; i++) h = (h * 31 + email.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

export type NewPersonResult =
  | { ok: true; person: Omit<Person, 'id'> }
  | { ok: false; error: 'name-required' | 'email-invalid' | 'duplicate' };

export function validateNewPerson(
  list: readonly Person[],
  input: { name: string; email: string },
): NewPersonResult {
  const name = input.name.trim();
  if (!name) return { ok: false, error: 'name-required' };
  if (!isValidEmail(input.email)) return { ok: false, error: 'email-invalid' };
  const email = normalizeEmail(input.email);
  if (list.some((p) => normalizeEmail(p.email) === email)) return { ok: false, error: 'duplicate' };
  return { ok: true, person: { name, email } };
}
