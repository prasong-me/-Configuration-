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
- https://developer.apple.com/documentation/networkextension/neappproxyflow
- https://developer.apple.com/documentation/networkextension/handling-flow-copying

## Evidence boundary

The repository and CI tests verify deterministic source generation and the JavaScript execution model. They do **not** prove that the generated Swift source compiles or runs on an Apple device.

No Mac/Xcode runtime validation is claimed here.

The generated v1 Swift flow entrypoint intentionally fails closed because actual Network Extension flow I/O, DNS wire encode/decode integration, upstream transport implementation, and stage-handler wiring are outside this generator boundary.

## Status vocabulary

- VERIFIED: supported by repository implementation/tests or authoritative Apple documentation.
- NOT PROVEN: implementation exists but lacks Apple device/Xcode runtime evidence.
- BLOCKED: deliberately refused by the fail-closed boundary.
