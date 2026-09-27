const OUTPUT_FORMATS = new Set(["plist", "json", "yaml", "ini", "text"]);

export class SerializerRegistry {
  constructor() {
    /** @private @type {Map<string, import("./serializer").Serializer>} */
    this.serializers = new Map();
  }

  register(serializer) {
    if (!serializer || typeof serializer !== "object" || typeof serializer.format !== "string") {
      throw new TypeError("Serializer must define a valid format.");
    }

    if (!OUTPUT_FORMATS.has(serializer.format)) {
      throw new TypeError(
        `Serializer format '${serializer.format}' is not a supported output format.`,
      );
    }

    if (typeof serializer.serialize !== "function") {
      throw new TypeError(
        `Serializer '${serializer.format}' must define a serialize function.`,
      );
    }

    if (this.serializers.has(serializer.format)) {
      throw new Error(
        `Serializer for format '${serializer.format}' is already registered.`,
      );
    }

    this.serializers.set(serializer.format, serializer);
  }

  has(format) {
    return this.serializers.has(format);
  }

  get(format) {
    return this.serializers.get(format);
  }

  list() {
    return Array.from(this.serializers.values());
  }
}
