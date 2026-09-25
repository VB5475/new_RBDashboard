/** Deterministic accent colors for overview groups / stat tiles without API Colour. */
const PALETTE = [
  '#0288d1',
  '#2e7d32',
  '#e6a817',
  '#7c4dff',
  '#e65100',
  '#1a3a6e',
  '#43a047',
  '#5c35b5',
  '#c62828',
  '#00838f',
  '#7044cc',
  '#0277bd',
];

const UNDECLARED = new Set([
  '',
  '#000',
  '#000000',
  'black',
  'rgb(0,0,0)',
  'rgb(0, 0, 0)',
  'rgba(0,0,0,1)',
  'rgba(0, 0, 0, 1)',
]);

function hashString(str) {
  const s = String(str ?? 'default');
  let h = 0;
  for (let i = 0; i < s.length; i += 1) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export function isUndeclaredAccent(colour) {
  if (colour == null) return true;
  const c = String(colour).trim().toLowerCase();
  if (!c) return true;
  return UNDECLARED.has(c);
}

/** Same key → same color (stable across re-renders). */
export function accentColorForKey(key) {
  const idx = hashString(key) % PALETTE.length;
  return PALETTE[idx];
}

function normalizeDeclaredAccent(colour) {
  if (isUndeclaredAccent(colour)) return null;
  const c = String(colour).trim();
  if (/^#|^rgb|^hsl/i.test(c)) return c;
  return c;
}

export function resolveStatAccent(colour, key) {
  const declared = normalizeDeclaredAccent(colour);
  if (declared) return declared;
  return accentColorForKey(key);
}

export function resolveGroupAccent(declaredAccent, groupKey) {
  const declared = normalizeDeclaredAccent(declaredAccent);
  if (declared) return declared;
  return accentColorForKey(groupKey);
}
