# Shadowrocket — Official Capability Evidence — 2026-10-02

> Evidence scope: Apple App Store official listing. This record supports only the capabilities explicitly described by that source.

## Source

- Apple App Store: https://apps.apple.com/ua/app/shadowrocket/id932747118
- App ID: 932747118
- Developer: Shadow Launch Technology Limited
- Source class: OFFICIAL
- Retrieved: 2026-10-02

## Officially described capabilities

The official App Store listing documents Shadowrocket as a rule-based proxy utility and describes:

- HTTP/HTTPS/TCP traffic capture and redirection to a proxy server.
- HTTP, HTTPS, and DNS request recording/display.
- Domain, domain-suffix, domain-keyword, CIDR IP range, and GeoIP rules.
- Traffic usage and network-speed measurement.
- Rule-file import from URL or iCloud Drive.
- Ad blocking by domain and User-Agent rules.
- Local DNS mapping.
- Cellular-network operation.
- HTTPS decryption.
- URL rewrite.
- IPv6 support.
- Script filters.
- Multi-level forward proxy.
- kcptun, cloak, gost, and v2ray plugins.
- DNS over HTTPS, DNS over TLS, and DNS over QUIC.
- Current release history also documents additional proxy, DNS, routing, and protocol features; those are version-scoped and must not be generalized beyond the cited release.

## Evidence boundary

This source establishes the listed client capabilities, but does not by itself establish:

- complete configuration grammar;
- every version-specific configuration field;
- full compatibility with this project's canonical model;
- physical-device import/export success;
- runtime performance or reliability.

## Classification

- Identity: VERIFIED
- Listed client capabilities: VERIFIED for the stated claims
- Complete configuration grammar: PENDING target-specific reconciliation
- Full target compatibility: UNKNOWN until mapped to the evidence matrix
- Runtime validation: RUNTIME_UNVERIFIED

## Security boundary

Do not commit proxy credentials, private keys, certificates, subscription secrets, or captured personal traffic.
