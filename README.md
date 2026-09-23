# Configuration Platform

Evidence-first configuration compiler and web application.

## Current status

- Core policy normalization, validation, threat diagnostics and capability gating: implemented.
- Evidence registry: implemented.
- Surge minimal serializer: implemented for a deliberately small fixture-backed subset.
- Mihomo/WireGuard: evidence-only; no serializer is claimed complete.
- Apple MobileConfig: evidence-only; target/application compatibility must be verified separately.

## Testing

Run `npm test` for core tests. Run `npm --prefix apps/web install && npm --prefix apps/web run build` for the web build.

## User validation loop

1. Generate/export a target artifact only after the target adapter reports it as verified.
2. Import it into the real target application/device.
3. Exercise the relevant feature.
4. Return the exact exported artifact (with secrets replaced) and the observed result.
5. Add the artifact as a fixture only after review.

Never commit private keys, passwords, tokens, certificates, or personal configuration data.
