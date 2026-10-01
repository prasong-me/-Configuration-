# Evidence Gap Audit — 2026-10-02

> Purpose: identify project areas that lack sufficient evidence, distinguish evidence gaps from implementation gaps, and prevent unsupported promotion.

## Scope audited

- Target compatibility matrix
- Official-source research snapshot
- Target-specific evidence records
- Architecture/export-first boundary
- Target Profile contract status
- Runtime-validation boundary

## Newly resolved evidence gaps

| Target | Gap | Resolution | Result |
|---|---|---|---|
| Loon | Official target identity not recorded as a dedicated evidence artifact | Apple App Store official listing captured | Identity VERIFIED; syntax/capability/runtime remain pending |
| Stash | Official capability evidence not recorded as a dedicated artifact | Apple App Store official listing captured | Listed capabilities VERIFIED; full mapping/runtime remain pending |
| Quantumult X | Official capability evidence not recorded as a dedicated artifact | Apple App Store official listing captured | Listed capabilities VERIFIED; full mapping/runtime remain pending |
| Shadowrocket | Official capability evidence not recorded as a dedicated artifact | Apple App Store official listing captured | Listed capabilities VERIFIED; full mapping/runtime remain pending |

## Evidence gaps intentionally retained

### Target Profile contract

Repository schema and TypeScript model exist, but they are implementation artifacts rather than normative external evidence.

**Disposition:** HOLD.

Do not freeze or invent a normative Target Profile shape until an authoritative specification establishes it.

### Clash Live

No uniquely attributable official network-client identity was established.

**Disposition:** PENDING_IDENTITY_RESOLUTION.

Do not substitute Clash Mi, Clash Lite, or generic Mihomo.

### Runtime validation

Documentation and App Store evidence do not constitute physical-device runtime validation.

**Disposition:** RUNTIME_UNVERIFIED unless a reproducible runtime observation exists.

### Import / round-trip

The project remains export-first. Target-specific parser/conversion evidence is insufficient to claim completed import or round-trip support.

**Disposition:** DEFERRED.

### Apple signing / entitlement / NetworkExtension runtime

Repository-side source generation and syntax validation do not establish physical Apple runtime, signing, provisioning, entitlement, or NetworkExtension behavior.

**Disposition:** DEFERRED / RUNTIME_UNVERIFIED.

### Upstream DNS end-to-end

DNS format/configuration evidence does not establish upstream transport end-to-end runtime behavior.

**Disposition:** DEFERRED / RUNTIME_UNVERIFIED.

### Performance / reliability / battery

No reproducible project-owned measurement evidence was established in this audit.

**Disposition:** DEFERRED.

## Promotion rule

Evidence is promoted only for the exact claim and scope that the source supports.

- Official documentation → documented capability/configuration evidence.
- Repository evidence → implementation/syntax evidence.
- Runtime observation → runtime evidence for the observed scope.
- Generated artifact → generated-output evidence only.

No evidence class may be silently upgraded into another class.

## Current conclusion

The audit found several target records that lacked dedicated official evidence artifacts even though official sources were available. Those gaps are now recorded.

Remaining gaps are explicitly marked rather than guessed, and the project continues under the export-first, fail-closed boundary.
