export type ProfileId = string;

import type { CapabilityRequirement } from './capability';
import type { ProfileComponent } from './component';

export interface ProfileMetadata {
  source?: string;
  revision?: number;
  note?: string;
  createdBy?: string;
  [key: string]: unknown;
}

export { ProfileComponent } from './component';

export interface Profile {
  id: ProfileId;
  name: string;
  enabled: boolean;
  order: number;
  metadata?: ProfileMetadata;
  components?: ProfileComponent[];
  requirements?: CapabilityRequirement[];
}
