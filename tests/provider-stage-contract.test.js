import test from "node:test";
import assert from "node:assert/strict";
import {
  StageFailureResult,
  StageMutationMode,
  StageResult,
  createProviderStageContract,
  validateProviderStageContract,
  resolveProviderStageExecutionOrder,
} from "../packages/apple-adapter/src/provider-stage-contract.js";

test("stage contract defines deterministic input/output and immutable context by default", () => {
  const stage = createProviderStageContract({ id: "b", order: 2, dependsOn: ["a"] });
  assert.equal(stage.input, "DNS_CONTEXT");
  assert.equal(stage.output, "STAGE_RESULT");
  assert.equal(stage.mutation, StageMutationMode.IMMUTABLE);
  assert.equal(stage.resultOnSuccess, StageResult.CONTINUE);
  assert.equal(validateProviderStageContract(stage).valid, true);
});

test("stage contract resolves A-to-B-to-C deterministically", () => {
  const stages = [
    createProviderStageContract({ id: "c", order: 3, dependsOn: ["b"] }),
    createProviderStageContract({ id: "a", order: 1 }),
    createProviderStageContract({ id: "b", order: 2, dependsOn: ["a"] }),
  ];
  assert.deepEqual(resolveProviderStageExecutionOrder(stages).map(stage => stage.id), ["a", "b", "c"]);
});

test("stage contract rejects a dependency cycle", () => {
  const stages = [
    createProviderStageContract({ id: "a", order: 1, dependsOn: ["b"] }),
    createProviderStageContract({ id: "b", order: 2, dependsOn: ["a"] }),
  ];
  const result = resolveProviderStageExecutionOrder(stages);
  assert.equal(result.valid, false);
  assert.ok(result.errors.includes("PROVIDER_STAGE_DEPENDENCY_CYCLE"));
});

test("stage failure semantics are explicit and never implicitly PASS", () => {
  const stage = createProviderStageContract({
    id: "a",
    order: 1,
    onParseError: StageFailureResult.ERROR,
    onTimeout: StageFailureResult.TIMEOUT,
    onUpstreamError: StageFailureResult.FALLBACK,
  });
  assert.equal(stage.failure.onParseError, StageFailureResult.ERROR);
  assert.equal(stage.failure.onTimeout, StageFailureResult.TIMEOUT);
  assert.equal(stage.failure.onUpstreamError, StageFailureResult.FALLBACK);
  assert.equal(stage.resultOnSuccess, StageResult.CONTINUE);
});
