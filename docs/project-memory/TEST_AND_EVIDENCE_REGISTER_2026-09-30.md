# Test & Evidence Register — 2026-09-30

## Completed
- DNS Wire Encoder phase: final recorded phase evidence 145/145 core tests passed; web build and related verification jobs were recorded as successful at that phase.
- Provider Runtime / Flow I/O repository tests were implemented.
- Apple NetworkExtension compile fixture was implemented.
- Apple DNS Proxy Transport Runtime v1 was merged in commit `8294457c6e25c824eb95f1357fbac98f96bff6e4`.
- Apple transport runtime repository validation recorded: NetworkExtension workflow #18 PASS, Xcode 26.6 / Swift 6.3.3, compile PASS, Swift tests PASS 3/3, core CI PASS, platform verification PASS, Apple style guide PASS.

## Not proven
- Network Extension entitlement/signing/provisioning.
- Packaged app-extension validation.
- Physical Apple runtime.
- Real upstream connectivity on device.
- End-to-end DNS forwarding/policy execution on physical hardware.
- Performance/reliability/battery measurements.
- Universal semantic DNS RDATA roundtrip coverage.

## Rule
A test implementation is not test evidence. A configured workflow is not a successful workflow run. Only runner/device evidence closes the corresponding validation state. The recorded Apple transport workflow evidence closes repository/macOS compile-and-test validation only; it does not close device/runtime gates.

## Data Reconciliation / Error Record — 2026-09-30

### Error
External project snapshots were imported from different points in time and were temporarily treated as if they represented one current state.

### Why it happened
The data record did not enforce source/time/evidence reconciliation before current-state interpretation. As the repository advanced, older snapshots remained present without an explicit superseded relationship.

### Effect
Stale status wording could conflict with newer repository evidence and could cause unnecessary repeated external research.

### Fix
- Reconciled the project-memory records against current repository and CI evidence.
- Corrected stale PR #26 wording using the newer PR #28 transport-runtime evidence.
- Preserved historical information and deferred boundaries rather than deleting them.
- Kept the Vercel rate-limit item explicitly deferred and separate from project test failures.
- Established the rule that imported records require source, capture/state time, evidence, status, and reconciliation before being treated as current.

### Current data rule
Historical record != Current state.

Current state is selected by reconciled authoritative repository/evidence records; older records remain traceable but cannot override newer evidence.
