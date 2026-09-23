# Evidence System

Target adapters are evidence-driven.

Each target must have:
1. authoritative documentation references;
2. a version/date snapshot;
3. a capability manifest;
4. representative fixtures;
5. parser/serializer tests;
6. explicit limitations.

Unknown behavior remains UNKNOWN. The compiler must not infer unsupported features from similar products.

## Evidence levels

- OFFICIAL: vendor/platform documentation or source controlled by the target owner.
- PRIMARY: target repository/specification maintained by the project owner.
- OBSERVED: reproducible behavior verified by tests; must not be treated as an official guarantee.
- SECONDARY: independent documentation used only as supporting context.

Only OFFICIAL/PRIMARY evidence may promote a target capability to SUPPORTED without an explicit OBSERVED fixture.

## Review record

Each target evidence file records:
- target ID
- target version
- source URL
- retrieved date
- evidence level
- covered features
- limitations
