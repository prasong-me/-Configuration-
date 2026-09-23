# Threat Model

## Scope

The platform may handle network configuration, routing, DNS settings, proxy settings, credentials, certificates, and external rule sources.

## Assets

- user configuration
- credentials and private keys
- generated configuration artifacts
- provider metadata
- runtime state
- audit records

## Threat categories

1. Secret leakage
2. Malicious or malformed imported configuration
3. Untrusted remote provider data
4. Target capability mismatch
5. Unsafe transformation
6. Sensitive information in logs
7. Supply-chain or dependency compromise
8. Unauthorized runtime changes

## Security boundary

The platform must not bypass platform permissions, application permissions, signing, entitlements, sandboxing, or other security controls.

## Trust model

Imported files and remote provider data are untrusted until validated. Generated artifacts must be treated as user-controlled output that requires review before installation or activation.
