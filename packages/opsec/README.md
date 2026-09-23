# OpSec Runtime

OpSec Runtime defines security boundaries for local processing and runtime state.

## Requirements

- Keep secrets outside ordinary policy objects where practical.
- Redact secrets before diagnostics and logs.
- Never commit credentials, private keys, tokens, or certificates.
- Prefer local processing.
- Make remote processing explicit.
- Keep audit events free of secret material.
- Fail safely when required security invariants cannot be maintained.

This package does not bypass operating-system, application, signing, entitlement, or sandbox controls.
