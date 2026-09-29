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
