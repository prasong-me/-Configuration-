import assert from 'node:assert/strict';
import test from 'node:test';

import { ConfigurationExporter } from './exporter.js';
import { TargetRegistry } from './registry.js';
import { SerializerRegistry } from './serializer-registry.js';

const target = {
  targetId: 'test-target',
  outputFormat: 'json',
};

const metadata = (status = 'SUCCESS') => ({
  status,
  timestamp: '2026-09-27T00:00:00.000Z',
  diagnostics: [],
  summary: {
    profilesTotal: 0,
    profilesProcessed: 0,
    profilesSkipped: 0,
    featuresRequired: 0,
    featuresOptional: 0,
    featuresSupported: 0,
    featuresPartial: 0,
    featuresUnsupported: 0,
    diagnosticsTotal: 0,
  },
});

function createHarness({
  processingStatus = 'SUCCESS',
  compileResult = {
    targetId: 'test-target',
    outputFormat: 'json',
    representation: { foo: 'bar' },
  },
  adapterError,
  serializer = {
    format: 'json',
    serialize: (value) => JSON.stringify(value),
  },
} = {}) {
  const targetRegistry = new TargetRegistry();
  let compileCalls = 0;
  const adapter = {
    targetId: 'test-target',
    compile(input) {
      compileCalls += 1;
      if (adapterError) throw adapterError;
      return compileResult;
    },
  };

  targetRegistry.register({
    target,
    capabilities: [],
    adapter,
  });

  const serializerRegistry = new SerializerRegistry();
  if (serializer) serializerRegistry.register(serializer);

  return {
    exporter: new ConfigurationExporter(targetRegistry, serializerRegistry),
    targetRegistry,
    serializerRegistry,
    adapter,
    get compileCalls() {
      return compileCalls;
    },
    input: {
      target,
      effectiveProfiles: [],
      outcomes: [],
      resultMetadata: metadata(processingStatus),
    },
  };
}

test('1. Processing FAILED is blocked', () => {
  const h = createHarness({ processingStatus: 'FAILED' });
  const result = h.exporter.export(h.input);
  assert.equal(result.status, 'BLOCKED');
});

test('2. Processing FAILED does not call TargetRegistry', () => {
  const h = createHarness({ processingStatus: 'FAILED' });
  let calls = 0;
  h.exporter.targetRegistry = { get() { calls += 1; } };
  h.exporter.export(h.input);
  assert.equal(calls, 0);
});

test('3. Processing FAILED does not call Adapter', () => {
  const h = createHarness({ processingStatus: 'FAILED' });
  h.exporter.export(h.input);
  assert.equal(h.compileCalls, 0);
});

test('4. Processing FAILED does not call Serializer Registry or Serializer', () => {
  const h = createHarness({ processingStatus: 'FAILED' });
  let registryCalls = 0;
  let serializerCalls = 0;
  h.exporter.serializerRegistry = {
    get() {
      registryCalls += 1;
      return { serialize() { serializerCalls += 1; return '{}'; } };
    },
  };
  h.exporter.export(h.input);
  assert.equal(registryCalls, 0);
  assert.equal(serializerCalls, 0);
});

test('5. PARTIAL processing is exportable', () => {
  const h = createHarness({ processingStatus: 'PARTIAL' });
  assert.equal(h.exporter.export(h.input).status, 'EXPORTED');
});

test('6. SUCCESS processing is exportable', () => {
  const h = createHarness();
  assert.equal(h.exporter.export(h.input).status, 'EXPORTED');
});

test('7. Registered target resolves and compiles', () => {
  const h = createHarness();
  const result = h.exporter.export(h.input);
  assert.equal(result.status, 'EXPORTED');
  assert.equal(h.compileCalls, 1);
});

test('8. Missing target returns TARGET_NOT_REGISTERED', () => {
  const h = createHarness();
  h.input.target = { targetId: 'missing-target', outputFormat: 'json' };
  const result = h.exporter.export(h.input);
  assert.equal(result.status, 'FAILED');
  assert.equal(result.diagnostics[0].code, 'TARGET_NOT_REGISTERED');
});

test('9. Compile result targetId mismatch is rejected', () => {
  const h = createHarness({
    compileResult: {
      targetId: 'other-target',
      outputFormat: 'json',
      representation: {},
    },
  });
  const result = h.exporter.export(h.input);
  assert.equal(result.diagnostics[0].code, 'TARGET_ID_MISMATCH');
});

test('10. Registered adapter is the adapter actually used', () => {
  const h = createHarness();
  const result = h.exporter.export(h.input);
  assert.equal(h.compileCalls, 1);
  assert.equal(result.status, 'EXPORTED');
});

test('11. Matching target output format is accepted', () => {
  const h = createHarness();
  const result = h.exporter.export(h.input);
  assert.equal(result.artifact.outputFormat, 'json');
});

test('12. Target output format mismatch is rejected', () => {
  const h = createHarness({
    compileResult: {
      targetId: 'test-target',
      outputFormat: 'yaml',
      representation: {},
    },
  });
  const result = h.exporter.export(h.input);
  assert.equal(result.diagnostics[0].code, 'TARGET_OUTPUT_FORMAT_MISMATCH');
});

test('13. Missing serializer returns SERIALIZER_NOT_REGISTERED', () => {
  const h = createHarness({ serializer: null });
  const result = h.exporter.export(h.input);
  assert.equal(result.diagnostics[0].code, 'SERIALIZER_NOT_REGISTERED');
});

test('14. Serializer Registry supports the Contract v2.1 formats', () => {
  const registry = new SerializerRegistry();
  for (const format of ['plist', 'json', 'yaml', 'ini', 'text']) {
    registry.register({ format, serialize: () => '' });
  }
  assert.deepEqual(
    registry.list().map((serializer) => serializer.format),
    ['plist', 'json', 'yaml', 'ini', 'text'],
  );
});

test('15. JSON serializer is called for json compile output', () => {
  let calls = 0;
  const h = createHarness({
    serializer: {
      format: 'json',
      serialize(value) {
        calls += 1;
        assert.deepEqual(value, { foo: 'bar' });
        return '{"foo":"bar"}';
      },
    },
  });
  h.exporter.export(h.input);
  assert.equal(calls, 1);
});

test('16. Serializer throw is owned by Exporter diagnostics', () => {
  const error = new Error('serializer boom');
  const h = createHarness({
    serializer: {
      format: 'json',
      serialize() {
        throw error;
      },
    },
  });
  const result = h.exporter.export(h.input);
  assert.equal(result.diagnostics[0].code, 'SERIALIZE_FAILED');
  assert.strictEqual(result.diagnostics[0].cause, error);
});

test('17. Adapter throw is owned by Exporter diagnostics', () => {
  const error = new Error('adapter boom');
  const h = createHarness({ adapterError: error });
  const result = h.exporter.export(h.input);
  assert.equal(result.diagnostics[0].code, 'COMPILE_FAILED');
  assert.strictEqual(result.diagnostics[0].cause, error);
});

test('18. Malformed compile result is rejected', () => {
  const h = createHarness({ compileResult: null });
  const result = h.exporter.export(h.input);
  assert.equal(result.diagnostics[0].code, 'INVALID_COMPILE_RESULT');
});

test('19. ResultMetadata identity is preserved', () => {
  const h = createHarness();
  const original = h.input.resultMetadata;
  const result = h.exporter.export(h.input);
  assert.strictEqual(result.resultMetadata, original);
});

test('20. Processing and Export diagnostics remain separate', () => {
  const h = createHarness();
  const processingDiagnostic = { code: 'FEATURE_SUPPORTED', severity: 'INFO', message: 'ok' };
  h.input.resultMetadata.diagnostics.push(processingDiagnostic);
  const result = h.exporter.export(h.input);
  assert.strictEqual(result.resultMetadata.diagnostics[0], processingDiagnostic);
  assert.notStrictEqual(result.diagnostics, h.input.resultMetadata.diagnostics);
  assert.deepEqual(result.diagnostics, []);
});

test('21. Artifact content and output format are correct', () => {
  const h = createHarness();
  const result = h.exporter.export(h.input);
  assert.equal(result.artifact.content, JSON.stringify({ foo: 'bar' }));
  assert.equal(result.artifact.outputFormat, 'json');
});

test('22. PARTIAL metadata is returned unchanged', () => {
  const h = createHarness({ processingStatus: 'PARTIAL' });
  const original = h.input.resultMetadata;
  const result = h.exporter.export(h.input);
  assert.strictEqual(result.resultMetadata, original);
  assert.equal(result.resultMetadata.status, 'PARTIAL');
});

test('25. CompileResult with own representation: undefined passes structural validation', () => {
  let serialized = false;
  const h = createHarness({
    compileResult: {
      targetId: 'test-target',
      outputFormat: 'json',
      representation: undefined,
    },
    serializer: {
      format: 'json',
      serialize(value) {
        serialized = true;
        assert.equal(value, undefined);
        return 'undefined';
      },
    },
  });
  const result = h.exporter.export(h.input);
  assert.equal(serialized, true);
  assert.equal(result.status, 'EXPORTED');
});

test('26. CompileResult without representation is rejected', () => {
  const h = createHarness({
    compileResult: {
      targetId: 'test-target',
      outputFormat: 'json',
    },
  });
  const result = h.exporter.export(h.input);
  assert.equal(result.diagnostics[0].code, 'INVALID_COMPILE_RESULT');
});
