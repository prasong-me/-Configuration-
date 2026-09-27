const APPLE_ENTRIES = Object.freeze([
  Object.freeze({ target: "apple", format: "mobileconfig", targetId: "apple-mobileconfig" }),
  Object.freeze({ target: "apple", format: "dns-declaration", targetId: "apple-dns-declaration" }),
]);

export function createControlRegistry(entries = APPLE_ENTRIES) {
  const records = entries.map(entry => Object.freeze({ ...entry }));
  return Object.freeze({
    entries: Object.freeze(records),
    resolve(target, format) {
      return records.find(entry => entry.target === target && entry.format === format) ?? null;
    },
  });
}

export const defaultControlRegistry = createControlRegistry();
