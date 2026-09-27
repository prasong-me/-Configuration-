import type { OutputFormat } from '../model/target';

export interface Serializer {
  format: OutputFormat;
  serialize(representation: unknown): string | Uint8Array;
}
