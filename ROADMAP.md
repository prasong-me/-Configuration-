# แผนพัฒนาและ Release Gates

> Baseline: 2026-09-30 · Repository implementation status is separated from target/runtime validation.

## Phase 0 — Foundation
- [x] Project direction and terminology
- [x] Repository structure and repository roles
- [x] Public/private boundary documented in docs/PRIVACY.md, docs/SECURITY.md, and CONTRIBUTING.md
- [>] DEFERRED — Final product brand is an owner decision; implementation uses working name Configuration Platform

## Phase 1 — Canonical Policy / Profile / Target Model
- [x] Canonical policy model
- [x] Canonical profile contract
- [x] Profile schema
- [x] Target manifest/capability model
- [ ] HOLD — Target Profile contract reconciliation is pending normative-source verification; do not freeze or invent a target-profile shape
- [x] Diagnostic model
- [x] Result/evidence metadata model

## Phase 2 — Capability Engine
- [x] Capability registry
- [x] SUPPORTED / LIMITED / TRANSFORMABLE / LOSSY / UNSUPPORTED / UNKNOWN states
- [x] Capability negotiation
- [x] Capability diagnostics
- [x] UNKNOWN / UNSUPPORTED fail-closed admission

## Phase 3 — Compiler
- [x] Normalization
- [x] Semantic mapping
- [x] Deterministic target IR
- [x] Capability admission
- [x] Compile result contract
- [x] Export/compile diagnostics

## Phase 4 — Target Adapters
- [x] Apple MobileConfig implementation
- [x] Apple declarative DNS reference export
- [x] Apple legacy DNS export boundary
- [x] Apple Web Clip through generic webEntry
- [x] Surge exporter
- [x] Mihomo / Clash-compatible template exporter
- [x] WireGuard template exporter
- [x] Shadowrocket template exporter
- [x] Loon template exporter
- [x] Stash template exporter
- [x] Quantumult X template exporter
- [x] Apple native runtime source-generation boundary

Adapter implementation is complete at repository level. Target capability support is governed separately by the evidence matrix.

## Phase 5 — Import / Round-trip
- [>] DEFERRED — Target-specific parsers for external configurations (requires target-specific normative syntax/specifications)
- [>] DEFERRED — Canonical conversion from imported target configurations
- [>] DEFERRED — Import diagnostics
- [>] DEFERRED — Target round-trip tests
- Status: intentionally deferred; import is not required to close the current export-first product scope.

## Phase 6 — Web Application
- [x] React + Vite shell
- [x] Discovery/Search
- [x] Six-step wizard
- [x] Canonical policy generation
- [x] Target selection
- [x] Compatibility diagnostics
- [x] UNKNOWN / UNSUPPORTED / EXTENSION-BACKED explanation
- [x] Export/download/share
- [x] Knowledge page
- [x] DNS profile add/remove/enable/disable
- [x] Web export through ConfigurationExporter
- [x] Mobile-first contract audit

## Phase 7 — Security / Privacy
- [x] Local-first processing boundary
- [x] Sensitive-data exclusion from committed policy
- [x] Privacy model
- [x] Threat model
- [x] Third-party evidence/source attribution rules
- [x] Security reporting and contribution guidance

## Phase 8 — Compatibility Test Lab
- [x] Syntax/export validation
- [x] Structural model validation
- [x] Semantic capability validation
- [x] Target artifact validation matrix
- [x] Regression matrix
- [x] Evidence-aware target compatibility matrix
- [>] DEFERRED — Physical-device validation for targets without sufficient repository-side evidence
- [>] DEFERRED — End-to-end runtime validation where applicable

## Phase 9 — Public Release
- [x] README / architecture / terminology documentation
- [x] Contribution guide
- [x] Security and privacy documentation
- [x] GitHub Pages deployment workflow
- [x] Versioned schemas/contracts
- [x] GitHub Actions verification workflow
- [>] DEFERRED — Final product brand decision

## Release Gate Classification

### CLOSED — repository implementation
Canonical model, capability engine, compiler, exporter boundary, target registry, web wizard, artifact validation, regression suite, security/privacy model and documentation are implemented.

### DEFERRED — deliberately skipped until the required external evidence or owner decision is available
- Physical device observations for targets currently partial/unverified.
- Apple NetworkExtension entitlement/signing/provisioning.
- Physical Apple NetworkExtension runtime.
- Upstream DNS transport end-to-end.
- Performance/reliability/battery measurements.
- Target-specific import/round-trip behavior.

These are intentionally deferred, not falsely marked complete. The project implementation scope is closed without claiming those external validations.

## Verification rule

IMPLEMENTED != SYNTAX-TESTED != REAL-DEVICE-TESTED != RUNTIME-VALIDATED

GitHub Actions success proves the repository-side execution path that the workflow actually ran. It does not manufacture physical-device evidence.

## Audit completion rule

Inventory → Read → Compare → Extract differences → Merge baseline → Audit contradictions → Fix → Re-read affected files → Run verification → Record evidence → Final snapshot.
