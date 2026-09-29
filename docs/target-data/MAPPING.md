# Canonical to Target Mapping Contract

Version: 1.0.0

The canonical model is target-agnostic. Target mapping translates canonical concepts into native target resources without changing semantics silently.

| Canonical concept | Target-native examples |
|---|---|
| proxy.name | Surge [Proxy] name; Mihomo/Stash proxies[].name; Shadowrocket [Proxy] name; Loon proxy name; Quantumult X server tag |
| proxy.type | target-native proxy type/protocol |
| proxy.server | target-native server/host |
| proxy.port | target-native port |
| proxy.credentials | target-native credential fields/parameters where supported |
| proxy.group | Surge [Proxy Group]; Mihomo/Stash proxy-groups[]; Shadowrocket [Proxy Group]; Loon policy group; Quantumult X [policy] |
| dns.server | Apple DNSSettings/Declarative DNS; Surge DNS; Mihomo/Stash dns.nameserver; Shadowrocket/Loon DNS; Quantumult X [dns] server |
| rule.match | target-native rule type/value representation |
| rule.action | target-native policy reference |
| vpn.interface | Apple payload, WireGuard [Interface], or target-specific VPN representation |
| vpn.peer | WireGuard [Peer] or target-native VPN peer representation where supported |

## Mapping invariants
1. Preserve canonical intent.
2. Preserve references by stable target-native names/tags.
3. Never invent runtime credentials or keys.
4. Never silently convert an unsupported or unresolved proxy action to DIRECT.
5. If a target cannot represent a capability, return an explicit unsupported/rejected result.
6. Mapping is not serialization; the adapter produces a target representation and the serializer emits bytes/text.
