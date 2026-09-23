export const DiagnosticLevel = Object.freeze({INFO:"INFO",WARNING:"WARNING",HIGH:"HIGH",CRITICAL:"CRITICAL"});
export function diagnostic(level,code,message,extra={}){if(!Object.values(DiagnosticLevel).includes(level))throw new TypeError(`Unknown diagnostic level: ${level}`);if(!code||!message)throw new TypeError("Diagnostic code and message are required.");return {level,code,message,...extra};}
export function hasBlockingDiagnostics(items){return items.some(x=>x.level===DiagnosticLevel.CRITICAL);}
