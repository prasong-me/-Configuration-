# Provider Runtime v1 Verification Record

## Scope

This record covers the Provider Runtime Generator v1 boundary and the application-side Provider Stage Execution Engine.

## Implemented

- Provider Runtime Contract v1
- DNS Wire Parser Contract v1
- Provider Stage Contract v1
- Provider Transport Contract v1
- Provider Runtime IR v1
- Provider Runtime Generator Contract v1
- Deterministic Swift source generator v1
- Provider Stage Execution Engine v1
- Apple DNS Proxy Provider export boundary
- Fail-closed generated `handleNewFlow` entrypoint when flow I/O is outside Generator v1

## Verified by repository tests

The Node test suite covers:
- deterministic Provider Runtime IR canonicalization;
- dependency ordering, missing dependencies, duplicate/cyclic graph rejection;
- DNS wire bounded decoding and malformed compression rejection;
- Provider Stage execution ordering;
- immutable/mutable stage context behavior;
- explicit parse/upstream/timeout failure mapping;
- terminal stage short-circuit;
- deterministic Swift generation;
- invalid IR fail-closed generation;
- generated DNS proxy flow entrypoint presence.

## External platform evidence

Apple documentation confirms that `NEDNSProxyProvider` is a DNS proxy provider app extension and requires implementations of `startProxy`, `stopProxy`, and `handleNewFlow`. It also documents `NEAppProxyFlow` as the flow substrate.

- https://developer.apple.com/documentation/networkextension/nednsproxyprovider
- https://developer.apple.com/documentation/networkextension/nednsproxyprovider/handlenewflow(_:)
- https://developer.apple.com/documentation/networkextension/neappproxyudpflow
- https://developer.apple.com/documentation/bundleresources/entitlements/com.apple.developer.networking.networkextension
- https://developer.apple.com/documentation/networkextension/nednsproxyprovider/handlenewflow(_:)
- https://developer.apple.com/documentation/networkextension/neappproxyflow
- https://developer.apple.com/documentation/networkextension/handling-flow-copying

## Evidence boundary

The repository and CI tests verify deterministic source generation and the JavaScript execution model. They do **not** prove that the generated Swift source compiles or runs on an Apple device.

Apple documentation also establishes that the DNS proxy provider uses `NEDNSProxyProvider`, `NEAppProxyFlow`, `NEAppProxyUDPFlow`, and `NEAppProxyTCPFlow`; `handleNewFlow` returns `true` when the provider elects to handle a flow and `false` when it does not. UDP read/write APIs are currently documented with newer flow-endpoint variants while older methods are deprecated.

No Mac/Xcode runtime validation is claimed here.

The previously proposed fixed 15 MB iOS memory ceiling is **not treated as an authoritative requirement** in this record because no Apple documentation was established for that exact universal limit.

The generated v1 Swift flow entrypoint intentionally fails closed because actual Network Extension flow I/O, DNS wire encode/decode integration, upstream transport implementation, and stage-handler wiring are outside this generator boundary.

## Status vocabulary

- VERIFIED: supported by repository implementation/tests or authoritative Apple documentation.
- NOT PROVEN: implementation exists but lacks Apple device/Xcode runtime evidence.
- BLOCKED: deliberately refused by the fail-closed boundary.


## DNS Wire Encoder Phase — Verification Addendum

### Scope completed
- DNS Wire Encoder Contract v1
- deterministic, fail-closed DNS message encoder
- uncompressed output names for v1
- explicit structured RDATA paths for name-bearing records
- EDNS(0) OPT contract and version-0 wire support
- semantic query/A round-trip and EDNS control/opaque-option round-trip tests
- explicit rejection of multiple OPT records and unsupported EDNS versions

### Normative evidence
RFC 1035 defines the DNS message sections, RR fields, RDLENGTH/RDATA encoding, and permits implementations to omit compression when generating messages. citeturn0search0turn1search0

RFC 6891 defines OPT as RR type 41, with UDP payload size in CLASS, extended RCODE/version/flags in TTL, and option code/length/data tuples in RDATA. v1 therefore treats OPT separately from ordinary RR semantics. citeturn0search1

RFC 9460 defines SVCB/HTTPS RDATA as priority, target name, and service parameters; the current encoder preserves these as an explicit structured mapping rather than inventing parameter semantics. citeturn1search1turn1search23

### CI evidence
For head b51a4b922d9ffc9d6a5d3438d73eea02aaca0a00:
- CI #587: SUCCESS
- Core: 145 tests, 145 pass, 0 fail
- Web build: SUCCESS
- Verify Configuration Platform #366: SUCCESS
- MobileConfig Run Profile #175: SUCCESS
- Apple Style Guide & Grammar Checker #243: SUCCESS

### Correction evidence
Two intermediate encoder regressions were observed and corrected before the final passing run:
1. RR TTL was omitted from the encoded RR header, causing decoder truncation. Corrected by restoring the 32-bit TTL field before RDLENGTH.
2. Root DNS name normalization did not strip the terminal root dot correctly. Corrected to normalize "." to the zero-length root label.

These were implementation defects, not accepted semantics. They are closed by the final 145/145 CI result above.

### Remaining boundary
This phase does not claim byte-identical encode(decode(wire)). v1 establishes semantic round-trip only for explicitly represented fields. Full wire-preservation/compression reconstruction remains a separate contract. Physical Apple Network Extension execution remains outside this phase.


## Apple NetworkExtension Compile Phase — Evidence Boundary

A dedicated macOS Swift Package compile fixture and GitHub Actions workflow were added:
- `Package.swift`
- `apple-runtime/GeneratedDNSProxyProvider.swift`
- `.github/workflows/apple-networkextension.yml`

The workflow uses GitHub-hosted `macos-26` and invokes the installed Swift/Xcode toolchain. GitHub documents `macos-26` as an available macOS runner. citeturn0search12

The fixture imports `NetworkExtension` and subclasses `NEDNSProxyProvider`, implementing the documented `startProxy`, `stopProxy`, and `handleNewFlow` boundary. Apple documents these methods as required for a DNS proxy provider. citeturn0search0turn0search2

The compile fixture is intentionally not a signed Network Extension app and does not claim entitlement, provisioning, device execution, or DNS forwarding. Those remain separate evidence gates.
