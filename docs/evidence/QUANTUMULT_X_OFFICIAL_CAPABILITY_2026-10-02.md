# Quantumult X — Official Capability Evidence — 2026-10-02

> Evidence scope: Apple App Store official listing. This record supports only the capabilities explicitly described by that source.

## Source

- Apple App Store: https://apps.apple.com/us/app/quantumult-x/id1443988620
- App ID: 1443988620
- Developer: Cross Utility Ltd
- Source class: OFFICIAL
- Retrieved: 2026-10-02

## Officially described capabilities

The official listing describes Quantumult X as a network tool with proxy customization and documents:

- HTTP activity recording, including request/response body when HTTP debug is enabled.
- MitM HTTP decryption for traffic from the TUN interface when MitM is enabled.
- HTTP rewrite with URL redirects and request/response header or body modification.
- Customized DNS settings for specific domains, including IPv4 and IPv6, through the configuration profile.
- Shadowsocks proxy support.
- Shadowsocks obfs-tls and obfs-http plugins.
- Shadowsocks over WebSocket and TLS.
- UDP relay where supported by the server.
- Network request policies using customized filters such as host, host suffix, and host keyword.
- VLESS proxy support in the current version history.
- AnyTLS support in the current version history.
- DNS over HTTPS and DNS over QUIC support in the version history.
- Current App Store compatibility information for iPhone, iPad, Mac, and Apple TV.

## Evidence boundary

The App Store record does not by itself freeze the complete Quantumult X configuration grammar or prove every version-specific field.

Therefore:

- syntax/schema completeness remains target-specific;
- implementation must use the project's adapter boundary;
- runtime behavior remains separate;
- physical-device testing remains separate;
- no capability should be promoted merely because a similar field exists in another client.

## Classification

- Identity: VERIFIED
- Listed client capabilities: VERIFIED for the stated claims
- Complete configuration grammar: PENDING
- Full target compatibility: UNKNOWN until mapped against the project's evidence matrix
- Runtime validation: RUNTIME_UNVERIFIED

## Security boundary

Do not commit user credentials, proxy secrets, certificates, or private configuration values.
