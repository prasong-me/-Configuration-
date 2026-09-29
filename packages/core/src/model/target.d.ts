export type TargetId = string;

export type OutputFormat =
  | 'plist'
  | 'json'
  | 'yaml'
  | 'ini'
  | 'text';

export interface Target {
  targetId: TargetId;
  version?: string;
  outputFormat: OutputFormat;
  options?: Record<string, unknown>;
}

export interface TargetCapability {
  featureKey: string;
  supported: boolean;
  version?: string;
  notes?: string[];
}
