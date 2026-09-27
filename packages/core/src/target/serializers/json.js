export const jsonSerializer = Object.freeze({
  format: "json",
  serialize(representation) {
    try {
      const serialized = JSON.stringify(representation, null, 2);
      if (typeof serialized !== "string") {
        throw new TypeError(
          `JSON serialization produced unexpected type: ${typeof serialized}.`,
        );
      }
      return serialized;
    } catch (error) {
      if (
        error instanceof TypeError &&
        error.message.startsWith("JSON serialization produced")
      ) {
        throw error;
      }
      throw new Error(
        `Failed to serialize representation to JSON: ${error instanceof Error ? error.message : String(error)}`,
        { cause: error },
      );
    }
  },
});
