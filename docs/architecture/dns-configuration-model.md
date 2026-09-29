# DNS Configuration Model

## Canonical structure

The DNS source configuration is one configuration set. Resolver entries are ordered inside that set.

1. Cloudflare — order 1
2. AdGuard — order 2

The order is semantic data in the Configuration model. It is not represented by invented Apple payload keys.

## Target serialization

Apple MobileConfig is a serialization/target format. The exporter must emit only keys and value types supported by the selected Apple payload.

For legacy Apple DNSSettings:

- `PayloadType` is `com.apple.dnsSettings.managed`
- `DNSProtocol` is `HTTPS` for DoH
- `ServerURL` is a single HTTPS URL
- `ServerAddresses` contains IP addresses, not DoH URLs

Therefore an ordered two-resolver source model must not be serialized by inventing fields such as `Primary`, `FallbackServers`, or `Layer` inside the Apple DNS payload.

If the selected Apple target cannot represent both resolver entries with its supported schema, the exporter must preserve the source data in the internal model and report the compatibility limitation rather than silently changing the meaning.

## Private endpoint handling

The AdGuard endpoint in the canonical example is user-provided configuration data. It must not be replaced with a public placeholder or rewritten as a different endpoint.

Do not commit credentials, private keys, tokens, or certificates to the repository. If a configuration contains sensitive material, keep it outside version control or use a documented secret/reference mechanism.

## Repository layout

- `configs/dns/` — canonical source configuration data
- `packages/core/` — target-independent normalization and runtime semantics
- `packages/apple-adapter/` — Apple-specific serialization
- `packages/targets/` — target/export registry and exporters
- `schemas/` — validation schemas
- `examples/` — non-canonical examples
- `tests/` — automated behavior and structure tests

The canonical source configuration is deliberately separated from target exporters so the Apple file format does not become the internal data model.
