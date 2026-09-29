import type { Profile } from './profile';
import type { Target } from './target';

export interface SkipContext {
  skippedSteps: string[];
  skippedComponents?: string[];
}

export interface ConfigurationDocument {
  schemaVersion: string;
  profiles: Profile[];
  target: Target;
  skipContext?: SkipContext;
}
