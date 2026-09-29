# Search Contract

## Status

**IMPLEMENTED / REVIEW-READY**

This contract defines the first Search foundation for Configuration. It is a read-only discovery layer over already-authoritative project records.

## Scope

Search may discover existing Target identifiers and names, DNS profile/provider/protocol/role values, server and endpoint values, and descriptive metadata when present.

Search does **not** create, modify, validate, authorize, or infer capabilities.

## Query semantics

- case-insensitive matching
- Unicode-aware tokenization
- AND semantics: every query token must match at least one indexed field
- deterministic ordering: score descending, then source index ascending
- optional result limit after ranking

## Fail-closed boundary

A search result means only that a record matched the Search contract. It does not establish Target support, compatibility, evidence, or authorization.

Capability decisions remain in the existing capability/evidence boundaries.

## Implementation boundary

Runtime: `packages/core/src/search.js`

Tests: `tests/search.test.js`

The Search foundation does not modify Target adapters, Apple payloads, DNS runtime, or protected PR work.
