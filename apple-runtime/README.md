# Apple NetworkExtension runtime integration v1

This phase establishes a concrete flow-to-upstream transport boundary.

Implemented:
- NEDNSProxyProvider.handleNewFlow accepts UDP and TCP proxy flows.
- Provider retains a session for each accepted flow.
- Current UDP datagram read/write APIs are used.
- Current TCP read/write APIs are used.
- Upstream transport uses Network.framework NWConnection.
- Terminal errors close both flow directions.

Boundary:
- This is transport forwarding, not DNS policy execution.
- DNS wire parsing/encoding and stage execution remain separate boundaries.
- No entitlement, signing, provisioning, packaged extension, or physical-device evidence is claimed.
- The 1.1.1.1:53 value is a compile-fixture value only, not a product policy.
