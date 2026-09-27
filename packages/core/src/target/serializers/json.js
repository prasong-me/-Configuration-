export const jsonSerializer = Object.freeze({
  format: "json",

  serialize(representation) {
    return JSON.stringify(representation, null, 2);
  },
});
