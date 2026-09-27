import type { OutputFormat } from '../model/target';
import type { Serializer } from './serializer';

export interface SerializerRegistry {
  register(serializer: Serializer): void;
  has(format: OutputFormat): boolean;
  get(format: OutputFormat): Serializer | undefined;
  list(): readonly Serializer[];
}

export declare class SerializerRegistryImpl implements SerializerRegistry {
  register(serializer: Serializer): void;
  has(format: OutputFormat): boolean;
  get(format: OutputFormat): Serializer | undefined;
  list(): readonly Serializer[];
}
