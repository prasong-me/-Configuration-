# Provider Runtime E2E Pipeline v1

## Boundary

RAW DNS DATA → DNS wire decode → DNS_CONTEXT → ordered provider stages → DNS message selection → DNS wire encode → RAW DNS DATA.

## Semantics

- Incoming bytes are copied before processing.
- Decode failure is terminal and fail-closed.
- Stage ordering is delegated to the existing dependency/order resolver.
- Stage handlers own policy semantics.
- CONTINUE encodes context.message.
- RESPOND requires context.responseMessage; the pipeline never invents one.
- BLOCK and DROP terminate without output.
- Stage failure is terminal and does not silently fall back.
- The bridge does not rewrite transaction IDs or invent DNS policy.

## Not included

This phase does not claim physical Apple device execution, NetworkExtension entitlement/signing/provisioning, upstream network connectivity, production policy definitions, or device DNS interception.


Validation trigger: CI must execute the repository test suite for this phase before merge.
