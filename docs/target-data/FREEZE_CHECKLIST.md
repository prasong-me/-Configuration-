# Target Data Freeze Checklist

Version: 1.0.0

Before Target Data is frozen:

- [ ] Registry IDs exactly match all target definitions.
- [ ] Every target definition parses as valid JSON.
- [ ] Required fields use native target names or explicitly documented logical paths.
- [ ] Optional fields are not incorrectly marked required.
- [ ] Unsupported features are explicitly listed where known.
- [ ] Native syntax and symbol notation are documented.
- [ ] Case sensitivity is documented where applicable.
- [ ] Output format, extension, and MIME are consistent.
- [ ] Artifact statuses have the same semantics across targets.
- [ ] Canonical-to-target mapping does not silently change intent.
- [ ] No invented runtime keys, credentials, endpoints, or identifiers are specified.
- [ ] Evidence exists for normative target-specific claims.
- [ ] Test vectors exist for validation and negative cases.
- [ ] Open uncertainties are recorded instead of guessed.

Freeze means the data is accepted as the versioned contract for the next implementation phase. Freeze does not mean runtime verification has passed.
