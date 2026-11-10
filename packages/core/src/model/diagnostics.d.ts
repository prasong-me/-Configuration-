export type DiagnosticSeverity = 'INFO' | 'WARNING' | 'ERROR';

export type DiagnosticCode =
  | 'PROFILE_INVALID'
  | 'PROFILE_DISABLED'
  | 'PROFILE_SKIPPED'
  | 'TARGET_NOT_FOUND'
  | 'TARGET_VERSION_UNSUPPORTED'
  | 'FEATURE_SUPPORTED'
  | 'FEATURE_UNSUPPORTED'
  | 'FEATURE_PARTIAL'
  | 'TARGET_FEATURE_UNSUPPORTED'
  | 'TARGET_CAPABILITY_UNKNOWN'
  | 'SEMANTIC_LOSS'
  | 'EXPORT_FAILED'
  | 'INVALID_OUTPUT';

export interface Diagnostic {
  code: DiagnosticCode;
  severity: DiagnosticSeverity;
  message: string;
  featureKey?: string;
  profileId?: string;
  targetId?: string;
  path?: string;
  details?: Record<string, unknown>;
}
