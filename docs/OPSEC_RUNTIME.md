# OpSec Runtime

## Purpose

Provide a common security model for sensitive values and runtime operations without coupling the core to a particular target.

## Secret classes

- PUBLIC
- SENSITIVE
- SECRET
- LOCAL_ONLY

## Rules

- Do not log SECRET or LOCAL_ONLY values.
- Redact sensitive values in diagnostics.
- Do not place secrets in Git-tracked examples.
- Prefer browser/local execution for configuration that does not require a server.
- Remote services must be explicit and documented.
- Runtime actions must require the target's normal permission and user-consent mechanisms.

## Runtime separation

Configuration generation and runtime enforcement are separate responsibilities. A generated artifact does not imply that it has been installed, activated, or granted system privileges.
