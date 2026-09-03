// Russian surnames decline by gender (Иванов/Иванова, Достоевский/Достоевская,
// Толстой/Толстая) — for search/highlight purposes those are the same family
// name, so we key on a gender-normalized form rather than the literal string.
// This is a heuristic covering the common patterns, not a full morphology
// engine; unrecognized endings just pass through unchanged.
export function surnameKey(lastName: string): string {
  const s = lastName.trim().toLowerCase()
  if (s.endsWith('ская') || s.endsWith('цкая')) return `${s.slice(0, -2)}ий`
  if (s.endsWith('ая')) return `${s.slice(0, -2)}ой`
  if (s.endsWith('а') && s.length > 2) return s.slice(0, -1)
  return s
}
