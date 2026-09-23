const SECRET_KEYS = /password|token|secret|private.?key|credential/i;

export function redact(value) {
  if (Array.isArray(value)) return value.map(redact);
  if (!value || typeof value !== "object") return value;

  return Object.fromEntries(
    Object.entries(value).map(([key, val]) => [
      key,
      SECRET_KEYS.test(key) ? "[REDACTED]" : redact(val)
    ])
  );
}

export function classify(value) {
  if (value == null) return "PUBLIC";
  if (SECRET_KEYS.test(String(value))) return "SECRET";
  return "SENSITIVE";
}
