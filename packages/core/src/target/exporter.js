/** @typedef {import('./contracts').TargetCompileInput} TargetCompileInput */
/** @typedef {import('./contracts').TargetCompileResult} TargetCompileResult */
/** @typedef {import('./export-diagnostics').ExportDiagnostic} ExportDiagnostic */
/** @typedef {import('./export-diagnostics').ExportResult} ExportResult */
/** @typedef {import('./registry').TargetRegistry} TargetRegistry */
/** @typedef {import('./serializer-registry').SerializerRegistry} SerializerRegistry */

function diagnostic(code, message, details = {}) {
  return {
    code,
    severity: 'ERROR',
    message,
    ...details,
  };
}

export class ConfigurationExporter {
  /** @param {TargetRegistry} targetRegistry @param {SerializerRegistry} serializerRegistry */
  constructor(targetRegistry, serializerRegistry) {
    this.targetRegistry = targetRegistry;
    this.serializerRegistry = serializerRegistry;
  }

  /** @param {TargetCompileInput} input @returns {ExportResult} */
  export(input) {
    if (input.resultMetadata.status === 'FAILED') {
      return {
        status: 'BLOCKED',
        resultMetadata: input.resultMetadata,
        diagnostics: [],
      };
    }

    const targetId = input.target.targetId;
    const registration = this.targetRegistry.get(targetId);

    if (!registration) {
      return {
        status: 'FAILED',
        resultMetadata: input.resultMetadata,
        diagnostics: [
          diagnostic(
            'TARGET_NOT_REGISTERED',
            `Target '${targetId}' is not registered.`,
            { targetId },
          ),
        ],
      };
    }

    let compileResult;
    try {
      compileResult = registration.adapter.compile(input);
    } catch (error) {
      return {
        status: 'FAILED',
        resultMetadata: input.resultMetadata,
        diagnostics: [
          diagnostic(
            'COMPILE_FAILED',
            `Target '${targetId}' compilation failed.`,
            { targetId, cause: error },
          ),
        ],
      };
    }

    if (
      compileResult === null ||
      typeof compileResult !== 'object' ||
      !Object.hasOwn(compileResult, 'targetId') ||
      !Object.hasOwn(compileResult, 'outputFormat') ||
      !Object.hasOwn(compileResult, 'representation')
    ) {
      return {
        status: 'FAILED',
        resultMetadata: input.resultMetadata,
        diagnostics: [
          diagnostic(
            'INVALID_COMPILE_RESULT',
            'Target adapter returned an invalid compile result.',
            { targetId },
          ),
        ],
      };
    }

    if (compileResult.targetId !== targetId) {
      return {
        status: 'FAILED',
        resultMetadata: input.resultMetadata,
        diagnostics: [
          diagnostic(
            'TARGET_ID_MISMATCH',
            `Compile result target ID '${compileResult.targetId}' does not match target ID '${targetId}'.`,
            { targetId },
          ),
        ],
      };
    }

    if (compileResult.outputFormat !== input.target.outputFormat) {
      return {
        status: 'FAILED',
        resultMetadata: input.resultMetadata,
        diagnostics: [
          diagnostic(
            'TARGET_OUTPUT_FORMAT_MISMATCH',
            `Compile result output format '${compileResult.outputFormat}' does not match target output format '${input.target.outputFormat}'.`,
            {
              targetId,
              outputFormat: compileResult.outputFormat,
            },
          ),
        ],
      };
    }

    const serializer = this.serializerRegistry.get(compileResult.outputFormat);
    if (!serializer) {
      return {
        status: 'FAILED',
        resultMetadata: input.resultMetadata,
        diagnostics: [
          diagnostic(
            'SERIALIZER_NOT_REGISTERED',
            `No serializer is registered for output format '${compileResult.outputFormat}'.`,
            {
              targetId,
              outputFormat: compileResult.outputFormat,
            },
          ),
        ],
      };
    }

    let content;
    try {
      content = serializer.serialize(compileResult.representation);
    } catch (error) {
      return {
        status: 'FAILED',
        resultMetadata: input.resultMetadata,
        diagnostics: [
          diagnostic(
            'SERIALIZE_FAILED',
            `Serialization failed for target '${targetId}'.`,
            {
              targetId,
              outputFormat: compileResult.outputFormat,
              cause: error,
            },
          ),
        ],
      };
    }

    return {
      status: 'EXPORTED',
      artifact: {
        content,
        outputFormat: compileResult.outputFormat,
      },
      resultMetadata: input.resultMetadata,
      diagnostics: [],
    };
  }
}
