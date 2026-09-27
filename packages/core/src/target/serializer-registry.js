/** @typedef {import('../model/target').OutputFormat} OutputFormat */
/** @typedef {import('./serializer').Serializer} Serializer */

const OUTPUT_FORMATS = new Set([
  'plist',
  'json',
  'yaml',
  'ini',
  'text',
]);

export class SerializerRegistry {
  constructor() {
    /** @private @type {Map<OutputFormat, Serializer>} */
    this.serializers = new Map();
  }

  /** @param {Serializer} serializer */
  register(serializer) {
    if (!serializer || !OUTPUT_FORMATS.has(serializer.format)) {
      throw new TypeError('Serializer must define a supported output format.');
    }
    if (this.serializers.has(serializer.format)) {
      throw new Error(`Serializer for format '${serializer.format}' is already registered.`);
    }
    this.serializers.set(serializer.format, serializer);
  }

  /** @param {OutputFormat} format */
  has(format) {
    return this.serializers.has(format);
  }

  /** @param {OutputFormat} format */
  get(format) {
    return this.serializers.get(format);
  }

  list() {
    return Array.from(this.serializers.values());
  }
}
