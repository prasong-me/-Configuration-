# Apple DNS Proxy Flow I/O Contract v1

Status: IMPLEMENTED / TEST-EVIDENCE-PENDING / PLATFORM-RUNTIME-PENDING

## Scope
This contract closes the platform-independent Flow I/O boundary between an admitted Provider Runtime and Apple's NEDNSProxyProvider flow model.

It defines accepted UDP/TCP transports, handleNewFlow ownership semantics, flow lifecycle, read/write operation classes, fail-closed lifecycle behavior, resource limits, and evidence pointers.

It does not claim that JavaScript can access NEAppProxyFlow, or that generated Swift has been compiled or run on Apple hardware.

## Apple API evidence
Apple documents that NEDNSProxyProvider receives DNS traffic as NEAppProxyFlow instances and requires handleNewFlow. Returning true means the provider handles the flow; the provider is responsible for retaining it and opening it. Returning false terminates/discards the flow for this provider.

Apple documents NEAppProxyUDPFlow with current read/write APIs readDatagramsAndFlowEndpointsWithCompletionHandler and writeDatagrams:sentByFlowEndpoints:completionHandler; older datagram methods are deprecated.

Apple documents NEAppProxyTCPFlow.readData and write for TCP flow data. Apple's flow-copying guidance describes flows as initially unopened and requires an open step before data transfer.

## Implemented
- packages/apple-adapter/src/provider-flow-io-contract.js
- packages/apple-adapter/src/provider-flow-io-runtime.js
- tests/provider-flow-io-runtime.test.js

The runtime is a deterministic platform-independent state machine. It is evidence for contract behavior only; it is not an Apple Network Extension implementation.

## Explicit non-claims / evidence gaps
1. Xcode compilation of generated Network Extension source.
2. Network Extension entitlement, signing, and provisioning validation.
3. Actual NEAppProxyFlow retention/open/read/write execution on iOS/iPadOS/macOS.
4. Upstream UDP/TCP/DoT/DoH connection implementation.
5. End-to-end DNS forwarding on a physical device.
6. Performance, memory, battery, and reliability measurements.
