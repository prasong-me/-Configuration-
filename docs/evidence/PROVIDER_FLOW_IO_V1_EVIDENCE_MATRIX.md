# Provider Flow I/O v1 Evidence Matrix

Status: IMPLEMENTED / EVIDENCE-PENDING

| Evidence item | Status | Basis |
|---|---|---|
| NEDNSProxyProvider receives DNS flows | VERIFIED | Apple Developer Documentation |
| handleNewFlow ownership semantics | VERIFIED | Apple Developer Documentation |
| Flow must be opened before data transfer | VERIFIED | Apple flow-copying guidance |
| UDP current read/write API names | VERIFIED | Apple NEAppProxyUDPFlow documentation |
| TCP read/write API names | VERIFIED | Apple NEAppProxyTCPFlow documentation |
| Deterministic JS lifecycle model | IMPLEMENTED | provider-flow-io-runtime.js |
| Unit tests for lifecycle/error paths | WRITTEN | provider-flow-io-runtime.test.js |
| GitHub Actions execution of those tests | PENDING | No runner result is currently available for PR #25 head |
| Xcode compilation | NOT ESTABLISHED | No macOS/Xcode build evidence |
| Network Extension entitlement/signing/provisioning | NOT ESTABLISHED | No signing/build evidence |
| Device execution on iOS/iPadOS/macOS | NOT ESTABLISHED | No device runtime evidence |
| End-to-end DNS forwarding | NOT ESTABLISHED | Upstream transport phase not implemented |
| Performance/memory/battery/reliability | NOT ESTABLISHED | No runtime measurement |

## Decision boundary

The Flow I/O phase can claim a repository-level contract and deterministic state-machine implementation, but it cannot claim Apple platform runtime validation until the missing evidence above is produced.

The platform adapter remains a separate implementation boundary. No deprecated UDP API is admitted by the v1 contract.

## CI note

PR #25 currently has a Vercel status failure pointing to the account build-rate-limit page. This is an external deployment check and is not evidence of the Node test suite failing. GitHub Actions results for the current head are still unavailable, so the test suite must not be reported as passed.
