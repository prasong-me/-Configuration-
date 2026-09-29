# Apple Runtime Transport v1 — Evidence Boundary

## Implementation
The repository now contains a concrete Swift NetworkExtension transport path:
1. NEDNSProxyProvider.handleNewFlow
2. retain a session for the incoming NEAppProxyFlow
3. open the flow
4. forward UDP/TCP data through NWConnection
5. write upstream responses back to the originating flow
6. close both flow directions on terminal error or completion.

## Apple API evidence
Apple documents that NEDNSProxyProvider receives DNS flows as NEAppProxyFlow and that handled flows must be retained and opened. Apple documents the current UDP datagram APIs and TCP read/write APIs.

Official sources:
- https://developer.apple.com/documentation/networkextension/neappproxyflow
- https://developer.apple.com/documentation/networkextension/neappproxyudpflow
- https://developer.apple.com/documentation/networkextension/neappproxytcpflow
- https://developer.apple.com/documentation/networkextension/dns-proxy-provider
- https://developer.apple.com/documentation/networkextension/handling-flow-copying

## Validation state

IMPLEMENTED:
- Swift source integration.
- Provider flow retention.
- UDP/TCP transport code paths.
- Unsupported-flow rejection.

PENDING:
- macOS/Xcode runner result for this branch.
- Entitlement and signing.
- App-extension packaging.
- Physical Apple device execution.
- Real upstream connectivity.
- End-to-end DNS query/response verification.
- Performance and reliability measurements.

## Safety boundary
This implementation does not claim that native MobileConfig/DDM expresses a DNS A-to-B-to-C execution pipeline. It is application-runtime forwarding only.

## Important correction
The default upstream value exists only to keep the compile fixture constructible. It is not a validated production resolver choice.


## Final CI evidence — PR #28

PR #28 was merged after the Apple NetworkExtension workflow completed successfully.

Final Apple NetworkExtension workflow:
- Run: #18
- macOS runner: GitHub-hosted macOS 26 arm64
- Xcode: 26.6
- Swift: 6.3.3
- Resolve package: PASS
- Compile NetworkExtension target: PASS
- Swift tests: PASS
- Swift test suite: 3 tests, 0 failures

The repository CI and platform verification workflows for the final branch revision also completed successfully.

## Corrections recorded during this phase

1. The initial transport implementation targeted APIs newer than the package deployment target. The package was moved to a macOS 15 target using Swift Package Manager tools 6.0.
2. The current UDP flow selectors were not directly visible through the Swift importer in the tested toolchain. A small Objective-C bridge was added to invoke the documented current selectors without falling back to deprecated UDP APIs.
3. Swift 6 concurrency checking required an explicit sendability boundary for the callback-driven flow session. This is recorded as an implementation boundary requiring later concurrency/runtime stress validation.
4. The initial fail-closed test exposed that Network.NWEndpoint.Port accepts zero. The runtime validation was corrected to reject port 0, and the final Swift test suite passed.

## Final validation boundary

VERIFIED:
- macOS/Xcode compilation of the transport runtime.
- Current Apple UDP selector bridge compilation.
- Current TCP flow API compilation.
- Provider flow session retention implementation.
- Three transport configuration tests.
- Core CI and web build for the final revision.

NOT ESTABLISHED:
- Entitlement/signing/provisioning.
- Packaged Network Extension app-extension installation.
- Physical Apple device execution.
- Real upstream DNS connectivity from a device.
- End-to-end DNS parse → policy/stage → encode → flow write-back.
- Performance, memory, battery, and reliability measurements.
