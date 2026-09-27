import type { OutputFormat } from '../model/target';
import type { ResultMetadata } from '../model/result';

export type ExportStatus = 'EXPORTED' | 'BLOCKED' | 'FAILED';

export type ExportDiagnosticCode =
  | 'TARGET_NOT_REGISTERED'
  | 'TARGET_ID_MISMATCH'
  | 'SERIALIZER_NOT_REGISTERED'
  | 'TARGET_OUTPUT_FORMAT_MISMATCH'
  | 'INVALID_COMPILE_RESULT'
  | 'COMPILE_FAILED'
  | 'SERIALIZE_FAILED';

export interface ExportDiagnostic {
  readonly code: ExportDiagnosticCode;
  readonly severity: 'ERROR' | 'WARNING' | 'INFO';
  readonly message: string;
  readonly targetId?: string;
  readonly outputFormat?: OutputFormat;
  readonly cause?: unknown;
}

export interface ExportArtifact {
  readonly content: string | Uint8Array;
  readonly outputFormat: OutputFormat;
}

export interface ExportResult {
  readonly status: ExportStatus;
  readonly artifact?: ExportArtifact;
  readonly resultMetadata: ResultMetadata;
  readonly diagnostics: readonly ExportDiagnostic[];
}
