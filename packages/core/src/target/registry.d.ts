import type { Target, TargetCapability, TargetId } from '../model/target';
import type { TargetAdapter } from './contracts';

export interface TargetRegistration {
  target: Target;
  capabilities: readonly TargetCapability[];
  adapter: TargetAdapter;
}

export declare class TargetRegistry {
  constructor();
  register(registration: TargetRegistration): void;
  has(targetId: TargetId): boolean;
  get(targetId: TargetId): TargetRegistration | undefined;
  list(): readonly TargetRegistration[];
}
