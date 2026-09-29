# wireguard Target Verification Package

Version: 1.0.0
Target Data reference: data/targets/wireguard.json

## Evidence state
- Target-data status: specification-only
- Normative source verification: SOURCE_VERIFIED
- Runtime verification: pending

## Source evidence
- https://www.wireguard.com/quickstart/

Evidence note: Official WireGuard documentation confirms private/public keys, peer AllowedIPs, endpoint, PersistentKeepalive, and the distinction between core wg configuration and wg-quick automation.

## Test vectors
- VALID_MINIMAL — minimum required configuration; expected validation success.
- VALID_FULL — supported optional features; expected validation success.
- MISSING_REQUIRED — remove a required field; expected MISSING_REQUIRED.
- INVALID_SYNTAX — malformed native syntax/type/value; expected INVALID_SYNTAX.
- UNRESOLVED_REFERENCE — missing node/group/policy; expected UNRESOLVED_REFERENCE.
- UNSUPPORTED_CAPABILITY — unsupported canonical capability; expected UNSUPPORTED_CAPABILITY or documented partial result.
- PARTIAL_MAPPING — only documented subset is representable; expected PARTIAL_MAPPING.
- NO_RUNTIME_DATA — missing runtime-specific values; expected template, not runnable.

## Freeze gate
Evidence is not runtime verification. Freeze requires observed results for the test vectors and no unresolved normative-source ambiguity.
