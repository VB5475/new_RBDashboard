/**
 * Title-style casing for UI copy (each word capitalized).
 * Preserves short acronyms like R&B when already mixed case.
 */
export function toTitleCase(text) {
  if (text == null || typeof text !== 'string') return '';
  return text
    .trim()
    .split(/\s+/)
    .map((word) => {
      if (!word) return word;
      if (/^[A-Z0-9&./-]+$/.test(word) && word.length <= 4) return word;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}
