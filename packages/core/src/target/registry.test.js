import assert from 'node:assert/strict';
import test from 'node:test';

import { TargetRegistry } from './registry.js';

function registration(targetId = 'test-target') {
  return {
    target: { targetId, outputFormat: 'json' },
    capabilities: [],
    adapter: { targetId, compile() { return { targetId, outputFormat: 'json', representation: {} }; } },
  };
}

test('TargetRegistry registers and resolves a target', () => {
  const registry = new TargetRegistry();
  const value = registration();
  registry.register(value);
  assert.equal(registry.has('test-target'), true);
  assert.strictEqual(registry.get('test-target'), value);
  assert.deepEqual(registry.list(), [value]);
});

test('TargetRegistry rejects duplicate target IDs', () => {
  const registry = new TargetRegistry();
  registry.register(registration());
  assert.throws(() => registry.register(registration()), /already registered/);
});

test('TargetRegistry rejects target/adapter ID mismatch', () => {
  const registry = new TargetRegistry();
  assert.throws(
    () => registry.register({
      target: { targetId: 'target-a', outputFormat: 'json' },
      capabilities: [],
      adapter: { targetId: 'target-b', compile() {} },
    }),
    /does not match adapter target ID/,
  );
});
