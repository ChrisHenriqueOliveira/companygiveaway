export function normalizeEmail(s: string): string {
  return s.trim().toLowerCase();
}

export function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
}
