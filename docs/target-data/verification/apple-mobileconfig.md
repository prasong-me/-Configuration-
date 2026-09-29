# apple-mobileconfig Target Verification Package

Version: 1.0.0
Target Data reference: data/targets/apple-mobileconfig.json

## Evidence state
- Target-data status: specification-only
- Normative source verification: pending
- Project constraints: recorded in Target Data
- Runtime verification: pending

## Evidence requirements
Before freeze, record authoritative target documentation/specification evidence for native syntax, required and optional fields, policy/reference semantics, capability boundaries, output format, and version/platform restrictions.

## Test vectors

### VALID_MINIMAL
Minimum configuration containing every required field and sufficient runtime data for a runnable artifact.
Expected: validation succeeds.

### VALID_FULL
Representative configuration exercising supported optional features.
Expected: validation succeeds and all references resolve.

### MISSING_REQUIRED
Remove one required field.
Expected: MISSING_REQUIRED; never runnable.

### INVALID_SYNTAX
Introduce malformed target-native syntax, delimiter, section, type, or value.
Expected: INVALID_SYNTAX.

### UNRESOLVED_REFERENCE
Reference a node/group/policy that is not defined.
Expected: UNRESOLVED_REFERENCE; never silently substitute DIRECT.

### UNSUPPORTED_CAPABILITY
Request a canonical capability not represented by the target.
Expected: UNSUPPORTED_CAPABILITY or an explicitly documented partial result.

### PARTIAL_MAPPING
Request semantics for which only a documented subset is representable.
Expected: PARTIAL_MAPPING and non-runnable status unless completeness is independently established.

### NO_RUNTIME_DATA
Omit required runtime-specific credentials, keys, endpoints, or equivalent values.
Expected: template status, not runnable.

## Freeze gate
This package is not evidence-complete until authoritative sources are attached and every test vector has an observed result.
