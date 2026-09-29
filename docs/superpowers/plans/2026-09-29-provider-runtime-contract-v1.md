# Provider Runtime Contract v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Define an evidence-bounded internal contract for generated `NEDNSProxyProvider` runtimes without conflating Apple OS interception with developer-owned DNS pipeline logic.

**Architecture:** Keep Apple flow interception, DNS parsing, pipeline stages, upstream transports, failure semantics, lifecycle, and resource budgets as separate contract domains. The contract is target-specific to `APPLE_DNS_PROXY_PROVIDER`; it does not alter canonical DNS policy or native MobileConfig/DDM admission.

**Tech Stack:** ESM JavaScript, Node.js built-in test runner, no new dependencies.

**Spec:** `docs/architecture/APPLE_DNS_PROXY_RUNTIME_CONTRACT_V1.md`

## Global Constraints

- Native MobileConfig/DDM ordered DNS pipelines remain UNKNOWN/BLOCK.
- `NEDNSProxyProvider` is represented as an App Extension target, not a native DNS settings payload.
- Exact platform memory ceilings are not hard-coded into the contract.
- Unknown/unresolved stage dependencies fail closed.
- No new external runtime dependency is introduced.

## Review Focus

- A stage referencing a later or missing dependency must not be admitted.
- Resource limits must be explicit when supplied and must not encode a fixed Apple memory ceiling.
- Parser ownership must remain application-runtime logic rather than an Apple capability.
- Failure actions must be from the defined finite set.
- Flow I/O must remain distinct from upstream transport and stage processing.

### Task 1: Runtime Contract Core

**Files:**
- Create: `packages/apple-adapter/src/provider-runtime-contract.js`
- Test: `tests/provider-runtime-contract.test.js`

**Interfaces:**
- Produces `createProviderRuntimeContract`, `validateProviderRuntimeContract`, `isProviderRuntimeAdmissionAllowed`.
- Produces enums `ProviderRuntimeResult`, `ProviderTransport`, `ProviderFailureAction`, `ProviderLifecycleState`.

- [x] Write failing tests for flow/parser separation, A→B→C dependencies, unresolved dependency rejection, and resource-budget semantics.
- [x] Run the tests before implementation and observe the expected missing-module failure.
- [x] Implement the minimal contract and validator.
- [x] Run the focused test file and verify all tests pass.

### Task 2: Public Core Export and Architecture Spec

**Files:**
- Modify: `packages/core/src/index.js`
- Create: `docs/architecture/APPLE_DNS_PROXY_RUNTIME_CONTRACT_V1.md`

**Interfaces:**
- Core re-exports the provider runtime contract so compiler/exporter layers can consume one public contract surface.
- Architecture document records the five contract domains and the Apple-vs-implementation boundary.

- [ ] Update exports.
- [ ] Add the architecture contract specification.
- [ ] Run the project test suite.

### Task 3: Branch Verification

**Files:**
- No additional source files.

- [ ] Run `npm test`.
- [ ] Verify no regression in existing Apple Chain IR tests.
- [ ] Record the branch result for review/merge.
