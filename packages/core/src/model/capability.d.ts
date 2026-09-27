export type RequirementLevel = 'REQUIRED' | 'OPTIONAL';

export type CapabilityMatchResult =
  | 'SUPPORTED'
  | 'PARTIAL'
  | 'UNSUPPORTED'
  | 'UNKNOWN';

export interface CapabilityRequirement {
  featureKey: string;
  requirementLevel: RequirementLevel;
  supportedByDefault: boolean;
}

export interface CapabilityMatchOutcome {
  featureKey: string;
  result: CapabilityMatchResult;
  profileId?: string;
  targetId?: string;
  requirementLevel?: RequirementLevel;
  targetSupported?: boolean;
  notes?: string[];
}
