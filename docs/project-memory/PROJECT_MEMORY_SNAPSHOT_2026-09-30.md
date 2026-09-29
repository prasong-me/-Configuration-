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
1. Network Extension entitlement/capability validation.
2. Signing and provisioning.
3. Packaged app-extension validation.
4. Actual iOS/iPadOS/macOS NEAppProxyFlow physical runtime.
5. Real upstream connectivity and end-to-end DNS forwarding on physical hardware.
6. Performance, memory, battery, reliability measurements.
7. Full semantic roundtrip coverage for every supported DNS RDATA representation.

PR #26 compile-boundary uncertainty was superseded by PR #28 transport-runtime validation; do not retain the old 'latest PR #26 runner not returned' wording as current status.

## CI caveat

The Vercel `build-rate-limit` status is an external deployment/account-rate-limit issue and must not be interpreted as a Node, Swift, or DNS test failure. Per project scope, this external rate-limited item is left deferred.

For Apple transport runtime, repository evidence recorded in PR #28 is the authoritative repository-side validation record: NetworkExtension workflow #18 PASS, Xcode 26.6 / Swift 6.3.3, compile PASS, Swift tests 3/3, core CI PASS, platform verification PASS, Apple style guide PASS.

## Next phase boundary

Repository-side transport integration is implemented. The remaining Apple boundary is physical/runtime validation and production packaging:
entitlement/signing/provisioning → packaged extension → device execution → real upstream connectivity → end-to-end DNS policy execution → performance/reliability evidence.

Do not merge platform runtime claims into contract/export evidence. Keep endpoint adapters separate from shared middle-layer orchestration, with target-specific configuration stored in target adapters and consumed by the middle layer.

## Error/lesson record

Memory-management lesson: test results, errors, evidence gaps, and corrections are first-class project state. Never collapse them into generic project knowledge.


## PR #28 — Apple DNS Proxy Transport Runtime v1

Status: MERGED.
Merge commit: `8294457c6e25c824eb95f1357fbac98f96bff6e4`.
Implementation:
- concrete NEDNSProxyProvider UDP/TCP flow handling;
- retained flow sessions;
- current UDP API selectors through a small Objective-C bridge because the tested Swift importer did not expose the current selector directly;
- TCP read/write through NetworkExtension;
- Network.framework NWConnection upstream transport;
- terminal close/error handling;
- Swift test target and macOS CI validation.

Final evidence:
- Apple NetworkExtension workflow #18: PASS;
- Xcode 26.6 / Swift 6.3.3;
- compile PASS;
- Swift tests PASS: 3/3;
- core CI PASS;
- platform verification PASS;
- Apple style guide PASS.

Recorded corrections:
- package deployment/API availability mismatch;
- Swift importer visibility of current UDP selector;
- Swift 6 sendability boundary;
- zero-port validation gap.

Phase boundary:
This closes transport integration, not physical-device validation or end-to-end DNS policy execution.
