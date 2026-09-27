import type { CapabilityMatchOutcome } from '../model/capability';
import type { Profile } from '../model/profile';
import type { ResultMetadata } from '../model/result';
import type { OutputFormat, Target, TargetId } from '../model/target';

export interface TargetCompileInput {
  target: Target;
  effectiveProfiles: Profile[];
  outcomes: CapabilityMatchOutcome[];
  resultMetadata: ResultMetadata;
}

export interface TargetCompileResult {
  targetId: TargetId;
  outputFormat: OutputFormat;
  representation: unknown;
}

export interface TargetAdapter {
  targetId: TargetId;
  compile(input: TargetCompileInput): TargetCompileResult;
}
