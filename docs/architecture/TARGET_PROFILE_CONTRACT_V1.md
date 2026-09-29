# Target Profile Contract v1.0

Target Profile is the reconciled materialized view between the canonical profile and a target adapter. It is not a second policy model and it does not own target syntax.

## Shape

- profile: canonical user intent.
- targetId / targetVersion: target identity and version scope.
- capabilities[]: explicit per-feature state and decision.
- evidenceRefs[]: optional references to repository evidence records.
- adapterData: target-specific data owned by the adapter boundary only.

## Processing boundary

Profile -> Normalize -> Validate -> Capability Evaluation -> TargetProfile -> Target Adapter -> Serializer -> Artifact

UNKNOWN is never promoted by fallback. UNSUPPORTED and UNKNOWN produce BLOCK when the capability is requested. LIMITED / LOSSY may continue only with an explicit warning.

## Non-goals

- Target Profile does not contain target syntax.
- UI does not construct adapterData.
- Target-specific implementation does not redefine canonical semantics.
- Target Profile is not evidence of physical runtime behavior.

The contract is defined by packages/core/src/model/profile.d.ts and schemas/target-profile.schema.json.
