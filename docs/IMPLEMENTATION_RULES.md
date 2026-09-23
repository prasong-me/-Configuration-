# Implementation Rules

## No invented target behavior

If a target feature has no verified specification, fixture, or implementation, its capability remains `UNKNOWN` and export is blocked.

## Evidence before adapter code

Every target adapter must identify an authoritative source and include fixtures proving the emitted syntax.

## Compile means real output

An adapter is not complete because a function returns an object. It is complete only when automated tests exercise it and the produced artifact is validated against the target syntax.

## No silent loss

Unsupported and lossy transformations must produce diagnostics before export.

## Secrets stay out of policy

Credentials, private keys, and tokens are runtime inputs or protected references, not ordinary committed policy values.

## Truthful status

Documentation must not claim a target or build is complete without test evidence.
