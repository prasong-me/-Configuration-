import assert from 'node:assert/strict';
import test from 'node:test';

import { SerializerRegistry } from './serializer-registry.js';

test('SerializerRegistry rejects unsupported formats', () => {
  const registry = new SerializerRegistry();
  assert.throws(
    () => registry.register({ format: 'toml', serialize() { return ''; } }),
    TypeError,
  );
});

test('SerializerRegistry rejects duplicate formats', () => {
  const registry = new SerializerRegistry();
  const serializer = { format: 'json', serialize() { return ''; } };
  registry.register(serializer);
  assert.throws(() => registry.register(serializer), /already registered/);
});
