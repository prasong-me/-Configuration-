# Surge Target Evidence

## Target

Surge 5 / Surge profile format.

## Official evidence

Surge's official manual states that profiles use an INI-like format with sections including `[General]`, `[Proxy]`, `[Proxy Group]`, `[Rule]`, `[Host]`, `[URL Rewrite]`, `[MITM]`, `[WireGuard <name>]`, and others. citeturn2search1

Surge documents URL-scheme installation through `surge:///install-config?url=...`. citeturn2search4

Surge documents an HTTP API with an API key for programmatic control. citeturn2search5

Surge documents its WireGuard policy syntax separately and explicitly states that this creates an application-level outbound policy rather than installing a system-wide WireGuard VPN. citeturn2search9

## Project status

The evidence is sufficient to begin a Surge serializer design, but not sufficient to mark every feature supported.

The first adapter must start with a small fixture-backed subset and reject fields outside that subset.

## Known security boundary

Surge's MITM feature requires a trusted CA and can decrypt only hosts declared in its configuration. Private CA material must never be committed to this repository. citeturn2search11
