import type { Diagnostic } from './diagnostics';

export type ResultStatus = 'SUCCESS' | 'PARTIAL' | 'FAILED';

export interface ResultSummary {
  profilesTotal: number;
  profilesProcessed: number;
  profilesSkipped: number;
  featuresRequired: number;
  featuresOptional: number;
  featuresSupported: number;
  featuresPartial: number;
  featuresUnsupported: number;
  featuresUnknown: number;
  diagnosticsTotal: number;
}

export interface ResultMetadata {
  status: ResultStatus;
  timestamp: string;
  diagnostics: Diagnostic[];
  summary: ResultSummary;
}
