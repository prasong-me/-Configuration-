# Official Source Snapshot — Target / Client Research

> Scope: official-source research snapshot for the Configuration Platform.
> This file is research/evidence input only. It is not runtime validation evidence and does not grant a target "verified" status by itself.

## Source precedence

1. Official technical documentation
2. Official source repository
3. Official release / changelog
4. Official App Store / Google Play listing
5. Official API reference
6. User-observed data is recorded separately and is never promoted to official evidence without confirmation.

Third-party aggregators are excluded from Source of Truth.

---

## 1. WireGuard

**Identity:** WireGuard

**Official sources**
- https://www.wireguard.com/
- https://www.wireguard.com/protocol/
- https://www.wireguard.com/quickstart/
- https://www.wireguard.com/xplatform/
- https://www.wireguard.com/install/

### Core protocol / configuration evidence

WireGuard securely encapsulates IP packets over UDP and uses a simple interface + peer model. The official conceptual documentation describes an interface with a private key and peers identified by public keys; peer selection/routing is based on AllowedIPs and peer endpoints. citeturn0search3turn0search0

The official quick-start documentation explicitly demonstrates these WireGuard configuration fields:
- `PrivateKey` — interface private key
- `ListenPort` — interface UDP listening port
- `PublicKey` — peer public key
- `AllowedIPs` — peer cryptokey-routing/address selection
- `Endpoint` — peer endpoint
- `PersistentKeepalive` — optional peer keepalive interval citeturn0search0

### Capability boundary: protocol vs host/network configuration

The following distinction is required in the Configuration Platform:

| Dimension | WireGuard status | Modeling rule |
|---|---|---|
| Tunnel protocol | CORE_CAPABILITY | WireGuard UDP tunnel |
| Interface private key | CORE_CONFIG | Secret; schema only in repository |
| Peer public key | CORE_CONFIG | Non-secret identifier |
| AllowedIPs | CORE_CONFIG | Core cryptokey-routing field |
| Endpoint | CORE_CONFIG | Peer endpoint |
| PersistentKeepalive | CORE_CONFIG | Optional peer setting |
| ListenPort | CORE_CONFIG | Interface setting |
| Interface IP address | PLATFORM/HOST_CONFIG | Do not treat as a WireGuard peer field |
| OS routes | PLATFORM/HOST_CONFIG | Host networking concern |
| DNS resolver configuration | PLATFORM/CLIENT_CONFIG | Do not assume it is a WireGuard protocol field |
| UI/import/export behavior | CLIENT_CAPABILITY / FORMAT_CAPABILITY | Must be established per target client |

The official conceptual documentation states that WireGuard adds a network interface and that ordinary networking utilities manage interface addresses and routes; the WireGuard-specific interface is configured using the `wg` tool. Therefore interface addressing and routing should not be collapsed into the protocol schema. citeturn0search3

### Cross-platform implementation boundary

The official cross-platform documentation states that userspace implementations should conform to the same WireGuard protocol/specification and configuration interface. It documents the `wg(8)` configuration interface and UAPI-style `get` / `set` operations. This supports a shared protocol-level model, while still requiring separate client/platform adapters. citeturn0search2

### Platform evidence — official WireGuard distribution

The current official installation page lists:
- Windows 10/11 and Windows Server 2016/2019/2022/2025 — v1.1.1
- macOS App Store — v1.0.16
- Android — v1.0.20260315
- iOS — v1.0.16
- Linux distributions with corresponding WireGuard module/tools packages
- FreeBSD/OpenBSD and additional platforms with userspace/kernel/tool variants citeturn0search1

These are official distribution/version observations from the WireGuard installation page. They are **not** runtime compatibility tests performed by this project.

### NAT / PersistentKeepalive semantics

The official quick-start documentation explains that PersistentKeepalive is useful when a peer behind NAT/firewall needs to maintain the mapping for incoming traffic after a period of inactivity. The documented sensible interval is 25 seconds; 0 disables the feature and is the default. The configuration model should therefore preserve the field as optional rather than silently inserting a value. citeturn0search0

### Cryptographic capability

The official protocol documentation specifies:
- ChaCha20 + Poly1305 AEAD
- Curve25519 ECDH
- BLAKE2s
- SipHash24
- HKDF citeturn0search4

These are protocol-level properties and should not be represented as user-editable client configuration fields unless a target explicitly exposes such controls.

### Configuration-model boundary for this project

Recommended normalized WireGuard target model:

```text
WireGuardTarget
├── interface
│   ├── privateKey        [SECRET / required]
│   ├── listenPort        [optional]
│   └── addresses         [HOST/CLIENT layer, target-dependent]
└── peers[]
    ├── publicKey         [required]
    ├── allowedIPs[]      [required]
    ├── endpoint          [optional]
    └── persistentKeepalive [optional]
```

Additional DNS, route, MTU, kill-switch, on-demand, split-tunnel UI, import/export, and platform-specific settings must be modeled outside the protocol core unless an official target-specific source establishes their mapping.

### Security boundary

Do not commit:
- WireGuard private keys
- generated client secrets
- subscription secrets
- user-specific endpoint credentials

The repository may store field schemas, capability metadata, source URLs, examples with non-secret placeholder values when clearly marked as examples, and evidence classifications.

### Evidence classification

- **Protocol/configuration:** VERIFIED from official WireGuard documentation.
- **Cross-platform userspace configuration interface:** VERIFIED from official documentation.
- **Official distribution/platform availability:** VERIFIED from official installation page.
- **Specific third-party/client UI behavior:** NOT IMPLIED by the protocol evidence.
- **Real-device import/connection result:** RUNTIME_UNVERIFIED until separately tested.

**Status:** VERIFIED — official protocol/configuration/platform-source evidence.
**Runtime status:** RUNTIME_UNVERIFIED.

---

## 2. Surge 5

**Identity:** Surge

**Official sources**
- https://surge.sh/
- https://surge.sh/docs/api/
- https://surge.sh/docs/api/authentication
- https://surge.sh/docs/cli/
- https://surge.sh/docs/api/deploys

### API boundary

The official Surge API is the HTTP interface used by the official CLI and SDK. The documented API base is:

`https://surge.surge.sh`

The API has no path-based versioning; clients identify their own release through a `version` header. Authenticated endpoints use HTTP Basic authentication. The documented token form uses the literal username `token` and the API token as the password.

### Authentication model

Official authentication documentation defines two credential forms:

| Credential form | Username | Password | Use |
|---|---|---|---|
| Token | literal `token` | API token | Day-to-day authenticated API calls |
| Email + password | account email | account password | Minting tokens |

The documented token endpoint is `POST /token`. Official documentation states that minted tokens are valid for three years.

**Repository rule:** never store a real Surge token, account password, or other secret. Store only credential metadata/schema.

### API capability surface

The official API overview states that the API covers the operations exposed by the CLI, including:
- publish
- rollback
- DNS management
- analytics

The deploy API documents publishing as a `PUT /:domain` operation with a gzipped tar archive as the request body and newline-delimited JSON progress output.

### CLI capability surface

The official CLI documentation currently exposes commands covering:
- publishing
- previews
- revisions
- rollback / roll-forward / cutover
- DNS
- analytics
- project configuration
- collaborators
- SSL
- account/token management

This is CLI capability evidence, not proof that every command is available through every client or UI integration.

### Publish / revision semantics

The official documentation states that a normal publish creates an immutable revision and moves production to the new revision after upload completes. Rollback/cutover operations move the production pointer between existing revisions rather than rebuilding the project.

A preview can upload without moving production.

This distinction is useful to the Configuration Platform as **deployment/release semantics**, not as a network-configuration target capability.

### DNS boundary

Surge's official custom-domain documentation describes three domain-routing arrangements:
1. Surge name-server delegation
2. CNAME at the existing DNS provider
3. A record at the existing DNS provider

These are hosting/platform DNS behaviors and must not be conflated with the DNS resolver configuration model used by network clients.

### Configuration-model boundary for this project

Surge should therefore be represented with separate dimensions:

```text
SurgeTarget
├── PLATFORM_CAPABILITY
│   └── Surge hosting / project lifecycle
├── API_CAPABILITY
│   ├── publish
│   ├── rollback
│   ├── DNS management
│   └── analytics
├── AUTH_CAPABILITY
│   └── token / email-password token minting
├── FORMAT_CAPABILITY
│   └── deploy archive + project files
└── RUNTIME_EVIDENCE
    └── separate from official documentation
```

Do **not** model Surge's hosting API as though it were a proxy/VPN protocol. If the project later targets a Surge network configuration feature, that capability must be established from the specific Surge configuration documentation rather than inferred from the hosting API.

### Security boundary

Never commit:
- Surge API tokens
- Surge account passwords
- session credentials
- private deployment secrets

The repository may store endpoint URLs, authentication schema, capability metadata, command names, and official source references.

### Evidence classification

- **API surface:** VERIFIED — official API documentation.
- **Authentication model:** VERIFIED — official authentication documentation.
- **CLI surface:** VERIFIED — official CLI documentation.
- **Deployment/revision semantics:** VERIFIED — official API/CLI documentation.
- **Network proxy/VPN client capability:** NOT IMPLIED by the Surge hosting API.
- **Runtime behavior in this project:** RUNTIME_UNVERIFIED.

**Status:** VERIFIED — official API/CLI evidence.
**Runtime status:** RUNTIME_UNVERIFIED.

---

## 2. Surge 5

**Identity:** Surge

**Official sources**
- https://surge.sh/
- https://surge.sh/docs/api/
- https://surge.sh/docs/api/authentication

**API**
- Official API base: https://surge.surge.sh
- Authenticated requests use HTTP Basic authentication.
- Token authentication uses username `token` and the API token as the password.
- Official API documentation describes operations including publish/rollback, DNS management, and analytics.

**Credential rule**
- Repository stores only credential metadata/schema.
- Never commit a real Surge token, email password, or other secret.

**Status:** VERIFIED — official API/authentication evidence.
**Runtime evidence:** Keep separate from official-source evidence.

---

## 3. ProxyPin

**Identity:** ProxyPin

**Official sources**
- Repository: https://github.com/wanghongenpin/proxypin
- Releases: https://github.com/wanghongenpin/proxypin/releases
- App Store: https://apps.apple.com/app/proxypin/id6450932949

**Officially documented capabilities**
- HTTP(S) traffic interception/inspection/rewrite.
- Windows, macOS, Android, iOS, and Linux support.
- Domain filtering.
- JavaScript scripting for request/response processing.
- Request rewrite and request mapping.
- Request blocking.
- AES request-body decryption.
- HAR import/export.
- QR/configuration synchronization.

**Release observation**
- v1.3.1 is marked Latest on the official releases page.
- v1.3.2 is marked Pre-release on the official releases page.
- This is release-channel information, not device-runtime validation.

**Status:** VERIFIED — official repository/release evidence.

---

## 4. Clash Mi

**Identity:** Clash Mi
**App ID:** 6744321968

**Official sources**
- App Store: https://apps.apple.com/app/id6744321968
- Official site: https://clashmi.app/

**Core/client boundary**
- The official App Store listing identifies Clash Mi as based on mihomo(meta).
- Mihomo/core capability and Clash Mi client/platform capability must remain separate in the data model.
- Common Mihomo configuration syntax may be reused only where supported by official Mihomo evidence.
- Client-specific UI/API/platform behavior belongs to the Clash Mi target adapter.

**Version**
- User-observed version: 1.0.30.1650.
- Classification: USER_OBSERVED / PENDING OFFICIAL RELEASE CONFIRMATION.
- Do not treat this version as official evidence until an official source confirms it.

**Status:** VERIFIED — identity/core relationship.
**Version status:** PENDING.

---

## 5. Clash Lite — Clash for iOS

**Identity:** Clash Lite — Clash for iOS
**App ID:** 6761357475

**Official source**
- App Store: https://apps.apple.com/th/app/clash-lite-clash-for-ios/id6761357475

**Officially described capability**
- Identifies itself as a Mihomo Proxy Client.
- Supports compatible configuration import/management.
- Supports switching active configurations and connection start/stop.
- Provides routing rules/logs and latency testing.
- Supports subscription updates and advanced configuration.

**Core/client boundary**
- Mihomo capability is not automatically equivalent to every Clash Lite client/UI capability.
- Client-specific behavior remains in the Clash Lite adapter.

**Status:** VERIFIED — official App Store identity/capability evidence.
**Detailed API evidence:** PENDING.

---

## 6. Rocket Proxy

**Identity:** Rocket Proxy

**Official sources**
- Repository: https://github.com/jcltravels/RocketProxy
- Official site: https://jcltravels.co.uk/
- App Store: https://apps.apple.com/app/id6785291194

**Officially documented configuration compatibility**
- Imports Clash / Stash / Mihomo YAML.
- Supports proxy-groups, rules, rule-providers and proxy-providers within documented platform boundaries.
- Carries DNS configuration from imported YAML.
- Supports subscription URLs and QR import.
- Documents multiple protocols including WireGuard, AmneziaWG, VLESS/REALITY, Hysteria2, TUIC, etc.

**Critical architecture boundary**
- YAML/config compatibility does NOT imply that Rocket Proxy embeds the Mihomo core.
- Treat Rocket Proxy as its own client/engine with an import compatibility layer.
- Do not merge Rocket Proxy engine capability into the Mihomo core capability record.

**Platform note**
- Official repository currently documents iPhone/iPad/Mac/Android availability.
- Android has documented limitations for provider auto-update and GEOSITE relative to the listed iOS/macOS behavior.

**Status:** VERIFIED — official repository capability evidence.

---

## 7. Clash Live

**Identity:** UNRESOLVED

**Current state**
- No official source has yet been accepted that uniquely identifies the intended Clash Live client.
- Do not substitute Clash Mi or Clash Lite.
- Do not infer identity from third-party app aggregators.

**Status:** PENDING_IDENTITY_RESOLUTION

---

## Normalized capability model

The repository must keep these dimensions separate:

- `CORE_CAPABILITY` — protocol/core semantics
- `CLIENT_CAPABILITY` — behavior implemented by a specific client
- `PLATFORM_CAPABILITY` — iOS/Android/macOS/Windows/etc.
- `FORMAT_CAPABILITY` — import/export syntax
- `API_CAPABILITY` — documented external API
- `AUTH_CAPABILITY` — authentication/credential mechanism
- `RUNTIME_EVIDENCE` — observed real-device/runtime result

Compatibility between formats must never be interpreted as shared implementation.

---

## Status vocabulary

- `VERIFIED` — supported by sufficient official evidence for the stated claim.
- `PARTIAL` — only part of the capability boundary is evidenced.
- `PENDING` — evidence exists but is not sufficient to freeze the claim.
- `PENDING_IDENTITY_RESOLUTION` — target identity is not uniquely established.
- `USER_OBSERVED` — observed by the user; not official evidence.
- `RUNTIME_UNVERIFIED` — official documentation exists but real-device/runtime behavior has not been established.
- `UNSUPPORTED_CAPABILITY` — target has no documented mapping for the requested capability; fail closed.

---

## Security boundary

Never store:
- WireGuard private keys
- Surge API tokens/passwords
- Proxy subscription secrets
- Personal certificates
- Client credentials
- User-specific endpoint secrets

Only store normalized schemas, capability metadata, source references, and non-secret evidence.

---

## Next research handoff

1. Resolve Clash Live identity from an official source.
2. Expand official Mihomo core capability evidence separately from each client.
3. Extract target-specific configuration fields into target adapters.
4. Keep shared protocol/core fields in the common model.
5. Reconcile platform/version differences before freezing.
6. Runtime-test targets separately; do not promote documentation claims to runtime verification.
