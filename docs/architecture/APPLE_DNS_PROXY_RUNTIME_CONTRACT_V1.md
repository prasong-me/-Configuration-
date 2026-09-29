# Apple DNS Proxy Provider Runtime Contract v1

## Purpose

This contract defines the boundary between Apple's `NEDNSProxyProvider` substrate and application-owned DNS runtime logic.

It does **not** claim that Apple provides a native A→B→C DNS pipeline primitive. The native MobileConfig/DDM targets remain fail-closed for ordered DNS pipelines unless semantic equivalence is established by evidence.

## Contract domains

### 1. Flow

The provider runtime receives OS-intercepted DNS flows and uses the framework flow I/O surface for UDP/TCP datagrams or stream data.

The contract records this as:

- input: `OS_INTERCEPTED_DNS_FLOW`
- read: `DATAGRAMS` / `STREAM_DATA`
- write: `DATAGRAMS` / `STREAM_DATA`

Flow interception is an Apple platform capability. The generated application owns processing after delivery.

### 2. DNS parser

The provider runtime converts:

`RAW_DNS_DATA → DNS_MESSAGE`

DNS wire-format parsing, inspection, mutation, and serialization are application-runtime responsibilities.

The contract therefore records parser implementation as `APPLICATION_RUNTIME`.

### 3. Pipeline stages

Stages are explicit runtime nodes with:

- stable `id`
- deterministic `order`
- explicit `dependsOn`
- `DNS_CONTEXT` input
- `STAGE_RESULT` output
- immutable context by default
- optional mutable context only when explicitly selected
- optional per-stage timeout

An unresolved dependency is a contract error and fails admission.

This is where A→B→C chaining lives. It is not encoded as Apple `ServerAddresses`.

### 4. Upstream transport

The contract supports the transport classes needed by the runtime:

- UDP
- TCP
- DoT
- DoH

The transport layer is separate from stage logic. A stage requests upstream work through the transport abstraction rather than embedding a specific transport implementation.

### 5. Failure semantics

Runtime failures are explicit:

- `FAST_FAIL`
- `SKIP_STAGE`
- `FALLBACK`

They are independently defined for timeout, parser failure, and upstream failure.

No failure is implicitly converted into PASS.

### 6. Resource policy

The contract uses explicit runtime budgets:

- `maxBufferedBytes`
- `perFlowBufferedBytes`
- `maxConcurrentFlows`

No fixed Apple-wide memory ceiling is encoded. Exact platform resource behavior is version/device/runtime dependent and must be represented by target evidence rather than an invented universal constant.

### 7. Lifecycle

The provider runtime state machine is:

`CREATED → STARTING → RUNNING → STOPPING → STOPPED`

with `FAILED` as a terminal failure state.

Cancellation is cooperative and terminal states are `STOPPED` and `FAILED`.

## Compiler boundary

| Target engine | Ordered DNS A→B→C |
|---|---|
| Apple MobileConfig | UNKNOWN → BLOCK |
| Apple DDM DNS Settings | UNKNOWN → BLOCK |
| Apple DNS Proxy Provider | REPRESENTABLE as generated runtime, subject to this contract |

The last row means **representable by generated application runtime code**, not native Apple configuration semantics.

## Non-goals

- No DNS parser implementation in this contract package.
- No UDP/TCP/DoT/DoH transport implementation in this contract package.
- No Swift source generator yet.
- No claim of a universal Apple Network Extension memory limit.
- No mutation of the canonical DNS policy.

## Admission rule

A Provider Runtime Contract is admissible only when:

1. it targets `APPLE_DNS_PROXY_PROVIDER`;
2. it contains at least one stage;
3. it contains at least one supported upstream transport;
4. parser ownership is explicitly application-runtime;
5. all stage dependencies resolve to earlier stages;
6. resource values, when supplied, are positive integers;
7. failure actions belong to the defined finite set.

This contract is the implementation-side counterpart to the evidence-backed Apple Chain IR boundary.
