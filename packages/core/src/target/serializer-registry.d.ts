import type { OutputFormat } from '../model/target';
import type { Serializer } from './serializer';

export declare class SerializerRegistry {
  constructor();
  register(serializer: Serializer): void;
  has(format: OutputFormat): boolean;
  get(format: OutputFormat): Serializer | undefined;
  list(): readonly Serializer[];
}
