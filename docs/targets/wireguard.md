# WireGuard Target Evidence

## Official evidence

WireGuard documents the standard configuration model using `[Interface]` and `[Peer]` sections, including fields such as `Address`, `DNS`, `PrivateKey`, `PublicKey`, `AllowedIPs`, and `Endpoint`. citeturn0search48

## Project status

This evidence establishes the base configuration syntax, but the iOS application's exact import behavior must be tested separately before an iOS-specific adapter is marked complete.

Private keys are secrets and must be supplied at runtime or through a protected secret mechanism.
