# Security Architecture

## Threat model scope

The project may process configuration containing network endpoints, routing rules, credentials, certificates, or other sensitive values.

## Requirements

- Never log secrets.
- Never commit secrets.
- Validate untrusted configuration before parsing.
- Treat imported configuration as untrusted input.
- Avoid arbitrary code execution from configuration files.
- Keep target adapters isolated from one another.
- Use deterministic compilation where practical.
- Provide diagnostics rather than silently changing requested behavior.
- Respect platform and application security boundaries.

## Reporting

Security vulnerabilities should be reported privately through the repository's configured GitHub security channel when available. Do not publish credentials, private keys, or exploit details in ordinary issues.
