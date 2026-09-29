# Target Constraint and Conflict Rules

Version: 1.0.0

## Resolution states
- RESOLVED: all required references and fields are present.
- MISSING_REQUIRED: required data is absent.
- UNRESOLVED_REFERENCE: a policy references no defined node/group/policy.
- UNSUPPORTED_CAPABILITY: target cannot represent the requested capability.
- PARTIAL_MAPPING: only a documented subset is representable.
- INVALID_SYNTAX: target-native syntax cannot be produced validly.
- CONFLICT: supplied values violate mutually exclusive target constraints.

## Mandatory invariants
- No silent semantic downgrade.
- No invented key material, credentials, endpoints, identifiers, or runtime values.
- No unresolved proxy policy may be emitted as a working proxy configuration.
- No unsupported capability may be silently dropped while reporting success.
- Explicit canonical fallback is allowed only when supplied by the canonical policy.
- Template artifacts must not be labeled runnable.

## Conflict precedence
1. Invalid target syntax/schema blocks export.
2. Missing required data blocks runnable status.
3. Unsupported capability produces rejection for that capability.
4. Partial mapping produces partial status and diagnostics.
5. Resolved data may proceed to serialization.

These rules are specification data and do not change runtime behavior until explicitly bound to implementation.
