export type ProfileId = string;

import type { CapabilityRequirement } from './capability';

export interface ProfileMetadata {
  source?: string;
  revision?: number;
  note?: string;
  createdBy?: string;
  [key: string]: unknown;
}

export interface ProfileComponent {
  type: string;
  data: Record<string, unknown>;
}

export interface Profile {
  id: ProfileId;
  name: string;
  enabled: boolean;
  order: number;
  metadata?: ProfileMetadata;
  components?: ProfileComponent[];
  requirements?: CapabilityRequirement[];
}

export interface TargetCapabilityResult {
  featureKey: string;
  state: 'SUPPORTED' | 'LIMITED' | 'TRANSFORMABLE' | 'LOSSY' | 'UNSUPPORTED' | 'UNKNOWN';
  decision: 'ALLOW' | 'ALLOW_WITH_WARNING' | 'BLOCK';
  evidenceRefs?: string[];
  notes?: string[];
}

export interface TargetProfile {
  contractVersion: '1.0';
  targetId: string;
  targetVersion: string;
  profile: Profile;
  capabilities: TargetCapabilityResult[];
  adapterData?: Record<string, unknown>;
}
