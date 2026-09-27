export class ConfigurationExporter {
  constructor(targetRegistry, serializerRegistry) {
    if (!targetRegistry || typeof targetRegistry.get !== "function") {
      throw new TypeError("ConfigurationExporter requires a target registry.");
    }

    if (!serializerRegistry || typeof serializerRegistry.get !== "function") {
      throw new TypeError("ConfigurationExporter requires a serializer registry.");
    }

    this.targetRegistry = targetRegistry;
    this.serializerRegistry = serializerRegistry;
  }

  export(input) {
    const resultMetadata = input?.resultMetadata;
    const targetId = input?.target?.targetId;

    if (!resultMetadata || typeof resultMetadata.status !== "string") {
      throw new TypeError("ConfigurationExporter requires Processing resultMetadata.");
    }

    if (resultMetadata.status === "FAILED") {
      return {
        status: "BLOCKED",
        resultMetadata,
        diagnostics: [],
      };
    }

    const registration = this.targetRegistry.get(targetId);
    if (!registration) {
      return {
        status: "FAILED",
        resultMetadata,
        diagnostics: [{
          code: "TARGET_NOT_REGISTERED",
          severity: "ERROR",
          message: `Target '${targetId}' is not registered.`,
          targetId,
        }],
      };
    }

    let compileResult;
    try {
      compileResult = registration.adapter.compile(input);
    } catch (error) {
      return {
        status: "FAILED",
        resultMetadata,
        diagnostics: [{
          code: "COMPILE_FAILED",
          severity: "ERROR",
          message: `Target adapter '${targetId}' failed during compilation.`,
          targetId,
          cause: error,
        }],
      };
    }

    if (
      !compileResult ||
      typeof compileResult !== "object" ||
      typeof compileResult.targetId !== "string" ||
      typeof compileResult.outputFormat !== "string" ||
      !Object.hasOwn(compileResult, "representation")
    ) {
      return {
        status: "FAILED",
        resultMetadata,
        diagnostics: [{
          code: "INVALID_COMPILE_RESULT",
          severity: "ERROR",
          message: `Target adapter '${targetId}' returned an invalid compile result.`,
          targetId,
        }],
      };
    }

    if (compileResult.targetId !== targetId) {
      return {
        status: "FAILED",
        resultMetadata,
        diagnostics: [{
          code: "TARGET_ID_MISMATCH",
          severity: "ERROR",
          message: `Target adapter returned target '${compileResult.targetId}' for requested target '${targetId}'.`,
          targetId,
        }],
      };
    }

    if (registration.target.outputFormat !== compileResult.outputFormat) {
      return {
        status: "FAILED",
        resultMetadata,
        diagnostics: [{
          code: "TARGET_OUTPUT_FORMAT_MISMATCH",
          severity: "ERROR",
          message: `Target '${targetId}' declares output format '${registration.target.outputFormat}' but adapter returned '${compileResult.outputFormat}'.`,
          targetId,
          outputFormat: compileResult.outputFormat,
        }],
      };
    }

    const serializer = this.serializerRegistry.get(compileResult.outputFormat);
    if (!serializer) {
      return {
        status: "FAILED",
        resultMetadata,
        diagnostics: [{
          code: "SERIALIZER_NOT_REGISTERED",
          severity: "ERROR",
          message: `No serializer is registered for output format '${compileResult.outputFormat}'.`,
          targetId,
          outputFormat: compileResult.outputFormat,
        }],
      };
    }

    let content;
    try {
      content = serializer.serialize(compileResult.representation);
    } catch (error) {
      return {
        status: "FAILED",
        resultMetadata,
        diagnostics: [{
          code: "SERIALIZE_FAILED",
          severity: "ERROR",
          message: `Serializer for '${compileResult.outputFormat}' failed.`,
          targetId,
          outputFormat: compileResult.outputFormat,
          cause: error,
        }],
      };
    }

    if (!(typeof content === "string" || content instanceof Uint8Array)) {
      return {
        status: "FAILED",
        resultMetadata,
        diagnostics: [{
          code: "SERIALIZE_FAILED",
          severity: "ERROR",
          message: `Serializer for '${compileResult.outputFormat}' returned an invalid artifact type.`,
          targetId,
          outputFormat: compileResult.outputFormat,
        }],
      };
    }

    return {
      status: "EXPORTED",
      artifact: {
        content,
        outputFormat: compileResult.outputFormat,
      },
      resultMetadata,
      diagnostics: [],
    };
  }
}
