// Inisial untuk avatar tanpa foto: huruf pertama nama depan + nama belakang ("Andri Novri" → "AN").
// Mirror family-finance-app/lib/utils/avatar.ts.
export function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const initials = parts.length === 1 ? parts[0][0] : parts[0][0] + parts[parts.length - 1][0];
  return initials.toUpperCase();
}
