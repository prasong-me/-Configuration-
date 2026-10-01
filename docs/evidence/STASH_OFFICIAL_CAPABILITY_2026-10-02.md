# Stash — Official Capability Evidence — 2026-10-02

> Evidence scope: Apple App Store official listing. This record supports the stated client/platform capabilities only; it does not substitute for physical runtime testing.

## Source

- Apple App Store: https://apps.apple.com/us/app/stash-rule-based-proxy/id1596063349
- App ID: 1596063349
- Developer: STASH NETWORKS LIMITED
- Source class: OFFICIAL
- Retrieved: 2026-10-02

## Officially described capabilities

The official App Store listing identifies Stash as a rule-based proxy client and describes:

- Clash Premium configuration adaptation.
- Multiple proxy protocols.
- Rule Set.
- JavaScript.
- HTTP rewriting.
- MitM.
- SSID Policy Groups.
- On-Demand Connections.
- TCP / UDP / ICMP traffic handling.
- Routing by domain, IP-CIDR, and User-Agent.
- DNS over TCP, DNS over TLS, and DNS over HTTPS.
- HTTP/HTTPS/TCP request dashboard.
- JavaScript-based HTTP(S) rewriting.
- HTTPS decryption through MitM.
- URL Rewrite.
- IPv6 support.
- Built-in DNS server with hostname mapping.
- Configuration overrides.

The listing also states compatibility with iPhone, iPad, Apple TV, and current platform requirements shown by the App Store record.

## Evidence boundary

These claims establish documented client capabilities. They do not establish:

- complete configuration-file grammar;
- one-to-one support for every Clash Premium field;
- runtime behavior for this project;
- compatibility of every feature on every supported platform;
- physical-device import/export success.

The project must keep Stash-specific behavior in the Stash adapter and must not infer universal Mihomo capability merely from Clash configuration compatibility.

## Classification

- Identity: VERIFIED
- Client capability evidence: VERIFIED for the listed claims
- Configuration grammar completeness: PENDING target-specific source reconciliation
- Full target compatibility: UNKNOWN until the project's evidence matrix supports the requested capability scope
- Runtime validation: RUNTIME_UNVERIFIED

## Security boundary

Do not commit user credentials, API keys, certificates, subscription secrets, or private configuration values. Store only schema/capability evidence.

## Repository rule

App Store capability evidence may support the target evidence layer but cannot be promoted into real-device/runtime evidence.
