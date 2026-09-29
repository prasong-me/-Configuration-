# Target Capability Matrix

Version: 1.0.0

This matrix describes target representation capability. It is not a ranking.

| Target | DNS | VPN | Proxy | Routing | Rules | MobileConfig | Proxy Groups |
|---|---|---|---|---|---|---|---|
| apple-mobileconfig | ✓ | ✓ | — | — | — | ✓ | — |
| apple-dns-declaration | ✓ | — | — | — | — | — | — |
| apple-mobileconfig-legacy | ✓ | — | — | — | — | ✓ | — |
| surge | ✓ | ✓ | ✓ | ✓ | ✓ | — | ✓ |
| mihomo | ✓ | — | ✓ | ✓ | ✓ | — | ✓ |
| wireguard | ✓ | ✓ | — | ✓ | — | — | — |
| shadowrocket | ✓ | — | ✓ | ✓ | ✓ | — | ✓ |
| loon | ✓ | — | ✓ | ✓ | ✓ | — | ✓ |
| stash | ✓ | — | ✓ | ✓ | ✓ | — | ✓ |
| quantumult-x | ✓ | — | ✓ | ✓ | ✓ | — | ✓ |

Legend: ✓ represented by the target model; — not represented as a native target capability in the current data definition.

Capability support must still be checked against the exact target-data constraints and required fields. A capability marked ✓ does not imply every canonical feature is representable.
