# Project Memory Snapshot — 2026-09-30

Status taxonomy: VERIFIED / IMPLEMENTED / MERGED / PENDING / NOT_ESTABLISHED / UNKNOWN.

## Current baseline

Repository: `prasong-me/-Configuration-`
Architecture rule: `structure != implementation != validated system`.
Authority order: Repository implementation truth; frozen contracts/approved decisions; CI/runtime evidence for validation; proposals remain non-authoritative.
Fail-closed rule: UNKNOWN and unsupported capability must not silently become supported/default behavior.

## Completed implementation phases

### PR #24 — DNS Wire Encoder Contract + Runtime v1
Status: MERGED.
Merge commit: `fa7bf7bbf2d44509ce39cd536780b51c73e26ceb`.
Scope:
- deterministic DNS wire encoder contract;
- EDNS/OPT contract and runtime support;
- deterministic uncompressed encoding;
- semantic query/A/OPT roundtrip coverage;
- malformed/truncated/compression safety boundaries.
Evidence:
- implementation and repository tests were completed for the phase;
- final phase evidence previously recorded as 145/145 core tests passing.
Known follow-up boundary:
- encoder contract/runtime representation for TXT and some structured RDATA still needs a later semantic-representation reconciliation before claiming universal semantic roundtrip;
- this phase does not claim byte-identical encode(decode(wire)).

### PR #25 — Apple DNS Proxy Flow I/O Contract v1
Status: MERGED.
Merge commit: `339aa4b48d0afbdd1a4c4a4cfdf9f5d680ae78a6`.
Scope:
- Provider Flow I/O contract;
- UDP/TCP admission;
- RECEIVED → OPENING → OPEN → CLOSING → CLOSED/FAILED lifecycle;
- ownership/retention semantics;
- deterministic fail-closed state machine;
- read/write/open/close error handling;
- current Apple API evidence references.
Apple API evidence: VERIFIED.
Repository tests: WRITTEN/IMPLEMENTED.
Important limitation:
- no device runtime proof;
- no real NEAppProxyFlow execution;
- no upstream DNS transport implementation;
- no end-to-end forwarding proof.

### PR #26 — Apple NetworkExtension Compile Validation Boundary
Status: MERGED.
Merge commit: `a5ebfdee566af4bf521972da8f89f1ec63f793f2`.
Scope:
- `Package.swift` macOS Swift package;
- NetworkExtension compile fixture;
- NEDNSProxyProvider subclass implementing startProxy/stopProxy/handleNewFlow boundary;
- GitHub Actions macOS-26 compile workflow;
- evidence-boundary documentation.
This establishes a compile-validation mechanism, not device validation.

## Evidence status

VERIFIED:
- Apple NEDNSProxyProvider API shape and handleNewFlow ownership semantics.
- Current NEAppProxyUDPFlow datagram read/write API names and deprecation boundary.
- NEAppProxyTCPFlow read/write API boundary.
- DNS wire format / OPT / SVCB-HTTPS normative foundations used by encoder phase.

IMPLEMENTED:
- Provider Runtime Contract/IR;
- deterministic Swift source generator;
- Provider Stage Execution;
- DNS Wire Parser/Runtime;
- DNS Wire Encoder/EDNS;
- Provider Flow I/O contract/runtime;
- macOS NetworkExtension compile fixture/workflow.

PENDING / NOT_ESTABLISHED:
1. GitHub Actions runner evidence for the latest PR #26 merge commit was not returned by the current GitHub workflow-run connector.
2. Xcode/macOS compilation result for the latest fixture is therefore NOT_ESTABLISHED from current connector evidence; do not call it passed without runner logs.
3. Network Extension entitlement/capability validation.
4. Signing and provisioning.
5. Packaged app-extension build.
6. Actual iOS/iPadOS/macOS NEAppProxyFlow retention/open/read/write runtime.
7. Upstream UDP/TCP/DoT/DoH implementation.
8. End-to-end DNS forwarding on physical hardware.
9. Performance, memory, battery, reliability measurements.
10. Full semantic roundtrip coverage for every supported DNS RDATA representation.

## CI caveat

Current merge-commit status exposed by the GitHub connector shows a Vercel `build-rate-limit` failure. This is an external deployment/account-rate-limit status and must not be interpreted as a Node, Swift, or DNS test failure.

No GitHub Actions PASS claim is recorded for PR #26 without runner evidence.

## Next phase boundary

The next implementation phase is Real Apple Runtime / Transport Integration:
Flow I/O adapter → upstream transport adapter → DNS wire decode/encode → stage execution → response write-back → physical/device validation.

Do not merge platform runtime claims into the existing contract/compile evidence. Keep endpoint adapters separate from shared middle-layer orchestration, with target-specific configuration stored in target adapters and consumed by the middle layer.

## Error/lesson record

Memory-management lesson: test results, errors, evidence gaps, and corrections are first-class project state. Never collapse them into generic project knowledge.
