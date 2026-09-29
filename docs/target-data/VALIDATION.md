# Target Validation Contract

Version: 1.0.0

Validation is ordered from structure to runtime. A later stage must not mask a failure from an earlier stage.

1. STRUCTURE — JSON/schema shape and required Target Data fields.
2. SYNTAX — target-native syntax can be serialized without malformed sections, keys, delimiters, or types.
3. REFERENCE — every emitted policy/node/group/provider reference resolves.
4. SEMANTIC — values satisfy target-specific constraints and field relationships.
5. CAPABILITY — requested canonical capabilities are representable or explicitly rejected/partial.
6. ARTIFACT — serialized output is non-empty, structurally valid, and has the declared format.
7. RUNTIME — where runtime verification exists, the artifact is tested against the target application/device.

A validation failure must include a stable diagnostic category and must not be converted into success by fallback serialization.
