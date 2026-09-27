const OUTPUT_FORMATS = new Set(["plist", "json", "yaml", "ini", "text"]);

export class ConfigurationExporter {
  constructor() {
    this.adapters = new Map();
    this.serializers = new Map();
  }

  registerAdapter(adapter) {
    if (!adapter || typeof adapter.targetId !== "string" || typeof adapter.compile !== "function") {
      throw new TypeError("Invalid target adapter registration.");
    }
    this.adapters.set(adapter.targetId, adapter);
  }

  registerSerializer(serializer) {
    if (!serializer || !OUTPUT_FORMATS.has(serializer.format) || typeof serializer.serialize !== "function") {
      throw new TypeError("Invalid serializer registration.");
    }
    this.serializers.set(serializer.format, serializer);
  }

  export(input) {
    const resultMetadata = input?.resultMetadata;
    const targetId = input?.target?.targetId;

    if (!resultMetadata || typeof resultMetadata.status !== "string") {
      return {
        status: "FAILED",
        resultMetadata,
      };
    }

    if (resultMetadata.status === "FAILED") {
      return {
        status: "BLOCKED",
        resultMetadata,
      };
    }

    const adapter = this.adapters.get(targetId);
    if (!adapter) {
      return {
        status: "FAILED",
        resultMetadata,
      };
    }

    try {
      const compileResult = adapter.compile(input);

      if (!compileResult || compileResult.targetId !== targetId) {
        return {
          status: "FAILED",
          resultMetadata,
        };
      }

      if (!OUTPUT_FORMATS.has(compileResult.outputFormat)) {
        return {
          status: "FAILED",
          resultMetadata,
        };
      }

      const serializer = this.serializers.get(compileResult.outputFormat);
      if (!serializer || serializer.format !== compileResult.outputFormat) {
        return {
          status: "FAILED",
          resultMetadata,
        };
      }

      const content = serializer.serialize(compileResult.representation);

      if (!(typeof content === "string" || content instanceof Uint8Array)) {
        return {
          status: "FAILED",
          resultMetadata,
        };
      }

      return {
        status: "EXPORTED",
        artifact: {
          content,
          outputFormat: compileResult.outputFormat,
        },
        resultMetadata,
      };
    } catch {
      return {
        status: "FAILED",
        resultMetadata,
      };
    }
  }
}
