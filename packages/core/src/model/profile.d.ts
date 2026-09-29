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
