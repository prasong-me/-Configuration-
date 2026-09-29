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

**Capability boundary**
- Core protocol concepts include Interface/PrivateKey and Peer/PublicKey.
- Peer routing uses AllowedIPs.
- Endpoint and PersistentKeepalive are protocol/configuration concepts.
- IPv4 and IPv6 are part of the WireGuard addressing/routing model.
- UAPI/userspace interfaces exist, but protocol capability must not be treated as proof of a particular OS/client UI capability.

**Platform note**
- The Configuration Platform should model WireGuard protocol capability separately from iOS, Android, and desktop client capabilities.

**Status:** VERIFIED — official protocol/configuration evidence.

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
