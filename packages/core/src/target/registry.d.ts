import type { Target, TargetCapability, TargetId } from "../model/target";
import type { TargetAdapter } from "./contracts";

export interface TargetRegistration {
  target: Target;
  capabilities: TargetCapability[];
  adapter: TargetAdapter;
}

export interface TargetRegistry {
  register(registration: TargetRegistration): void;
  has(targetId: TargetId): boolean;
  get(targetId: TargetId): TargetRegistration | undefined;
  getTarget(targetId: TargetId): Target | undefined;
  getCapabilities(targetId: TargetId): TargetCapability[];
  getAdapter(targetId: TargetId): TargetAdapter | undefined;
  list(): TargetRegistration[];
}
