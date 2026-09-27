import type { TargetCompileInput } from './contracts';
import type { ExportResult } from './export-diagnostics';
import type { SerializerRegistry } from './serializer-registry';
import type { TargetRegistry } from './registry';

export declare class ConfigurationExporter {
  constructor(targetRegistry: TargetRegistry, serializerRegistry: SerializerRegistry);
  export(input: TargetCompileInput): ExportResult;
}
