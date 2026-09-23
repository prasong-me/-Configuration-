export const DiagnosticLevel = Object.freeze({
  INFO: "INFO",
  WARNING: "WARNING",
  HIGH: "HIGH",
  CRITICAL: "CRITICAL"
});

export function diagnostic(level, code, message, extra = {}) {
  return { level, code, message, ...extra };
}

export function hasBlockingDiagnostics(items) {
  return items.some(x => x.level === DiagnosticLevel.CRITICAL);
}
