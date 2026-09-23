# Surge Target Evidence

## Target

Surge 5 / Surge profile format.

## Official evidence

Surge's official manual states that profiles use an INI-like format with sections including `[General]`, `[Proxy]`, `[Proxy Group]`, `[Rule]`, `[Host]`, `[URL Rewrite]`, `[MITM]`, `[WireGuard <name>]`, and others.

Source: https://manual.nssurge.com/profile/format.html

Surge documents URL-scheme installation through `surge:///install-config?url=...`.

Source: https://manual.nssurge.com/tools/url-scheme.html

Surge documents an HTTP API with an API key for programmatic control.

Source: https://manual.nssurge.com/tools/http-api.html

Surge documents its WireGuard policy syntax separately and explicitly states that this creates an application-level outbound policy rather than installing a system-wide WireGuard VPN.

Source: https://manual.nssurge.com/policies/wireguard.html

## Project status

The evidence is sufficient to begin a Surge serializer design, but not sufficient to mark every feature supported.

The first adapter must start with a small fixture-backed subset and reject fields outside that subset.

## Known security boundary

Surge's MITM feature requires a trusted CA and can decrypt only hosts declared in its configuration. Private CA material must never be committed to this repository.

Source: https://manual.nssurge.com/http/mitm.html
