# Per-Capability Target Evidence Matrix — 2026-09-30

This matrix is evidence-scoped. A target-level evidence record does not imply that every capability is verified.

| Target | Capability state scope | Evidence scope | Runtime claim |
|---|---|---|---|
| Surge 5.x | vpn,dns,routing,blocking.malware,blocking.trackers,routing.rules,dns.profiles,dns.resolution,routing.final,policy.providers = SUPPORTED; dns.pipeline,blocking.blocklists,routing.bypassSystem,web.entry,runtime.commands = UNKNOWN; proxy.server = UNSUPPORTED | Official profile format + 15 real-device tests + profile-generation observation | Only the recorded real-device scope is verified |
| Mihomo / Clash-compatible | All capability keys UNKNOWN | Official reference only | No runtime compatibility claim |
| WireGuard | All capability keys UNKNOWN | Official reference + 1 partial real-device observation | Partial observation only |
| Shadowrocket | All capability keys UNKNOWN | Reference + 1 partial DNS/runtime observation | Partial observation only |
| Loon | All capability keys UNKNOWN | Reference only | No runtime compatibility claim |
| Stash | All capability keys UNKNOWN | Official/reference only | No runtime compatibility claim |
| Quantumult X | All capability keys UNKNOWN | Reference only | No runtime compatibility claim |
| Apple MobileConfig | dns,web.entry = SUPPORTED; all other capability keys UNKNOWN | Generator/reference evidence only | Export implementation is not physical-device runtime evidence |
| Apple Network DNS Settings | dns,dns.profiles,dns.resolution = SUPPORTED; all other capability keys UNKNOWN | Official format reference | Syntax/reference scope only |
| Apple DNSSettings legacy | dns,dns.profiles,dns.resolution = SUPPORTED; all other capability keys UNKNOWN | Official format reference | Legacy syntax/reference scope only |
| Apple DNS Provider Runtime | dns = SUPPORTED; all other capability keys UNKNOWN | Repository runtime contract/source-generation evidence | Does not prove signing, entitlement, device runtime or upstream E2E |

## Capability evidence rule

- SUPPORTED is a capability claim, not a blanket target claim.
- UNKNOWN remains blocking when requested.
- UNSUPPORTED remains fail-closed.
- Evidence is inherited only within the scope documented for the target/capability.
- Physical-device and end-to-end runtime validation remain separate release gates.
