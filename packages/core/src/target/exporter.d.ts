import type { TargetCompileInput, TargetAdapter } from './contracts';
import type { Serializer } from './serializer';
import type { OutputFormat } from '../model/target';
import type { ResultMetadata } from '../model/result';

export interface ExportArtifact {
  content: string | Uint8Array;
  outputFormat: OutputFormat;
}

export type ExportStatus =
  | 'EXPORTED'
  | 'BLOCKED'
  | 'FAILED';

export interface ExportResult {
  status: ExportStatus;
  artifact?: ExportArtifact;
  resultMetadata: ResultMetadata;
}

export declare class ConfigurationExporter {
  registerAdapter(adapter: TargetAdapter): void;
  registerSerializer(serializer: Serializer): void;
  export(input: TargetCompileInput): ExportResult;
}
