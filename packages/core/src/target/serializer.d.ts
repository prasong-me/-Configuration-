import type { OutputFormat } from '../model/target';

/**
 * Representation -> final serialized artifact.
 *
 * Serializers must not perform policy, capability, or compatibility decisions.
 */
export interface Serializer {
  format: OutputFormat;
  serialize(representation: unknown): string | Uint8Array;
}
