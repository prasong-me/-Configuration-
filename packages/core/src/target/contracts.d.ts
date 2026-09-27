import type { CapabilityMatchOutcome } from '../model/capability';
import type { Profile } from '../model/profile';
import type { ResultMetadata } from '../model/result';
import type { Target, TargetId, OutputFormat } from '../model/target';

/**
 * Effective, Processing-approved input for a Target Adapter.
 *
 * Raw ConfigurationDocument data is intentionally excluded from this boundary.
 * Processing owns skip semantics, capability matching, and compatibility decisions.
 */
export interface TargetCompileInput {
  target: Target;
  effectiveProfiles: Profile[];
  outcomes: CapabilityMatchOutcome[];
  resultMetadata: ResultMetadata;
}

/**
 * Target-specific representation before serialization.
 */
export interface TargetCompileResult {
  targetId: TargetId;
  outputFormat: OutputFormat;
  representation: unknown;
}

/**
 * Translator-only Target Adapter contract.
 *
 * Adapters must not re-run compatibility, capability, or skip decisions.
 */
export interface TargetAdapter {
  targetId: TargetId;
  compile(input: TargetCompileInput): TargetCompileResult;
}
