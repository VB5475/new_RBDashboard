export function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  let sanitized = input.replace(/<script.*?>.*?<\/script>/gi, '');
  sanitized = sanitized.replace(/[<>]/g, '');
  return sanitized;
}

export function isInputSafe(input) {
  if (typeof input !== 'string') return true;
  return !(
    /<script.*?>.*?<\/script>/gi.test(input) || /[<>]/.test(input)
  );
}
