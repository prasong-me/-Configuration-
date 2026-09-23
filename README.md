# Configuration Platform

> Define once. Validate once. Transform anywhere.

A configuration and policy orchestration platform designed to define a canonical policy once, validate target capabilities, and transform that policy into configuration formats supported by different applications, operating systems, and runtimes.

## Project status

Early architecture / foundation phase.

This repository intentionally starts with architecture, terminology, schemas, documentation, and validation boundaries before implementation.

## Core pipeline

Policy → Normalize → Capability Check → Compile → Adapter → Validate → Serialize → Target

## Core concepts

- **Policy** — the user's desired behavior in a platform-neutral model.
- **Profile** — a saved collection of policies.
- **Capability** — what a target can actually represent or execute.
- **Target** — an application, operating system feature, or runtime.
- **Compiler** — transforms canonical policy into a target model.
- **Adapter** — target-specific mapping layer.
- **Parser** — imports supported target configurations into the canonical model.
- **Serializer** — writes the target model in its native syntax.
- **Validator** — checks syntax, schema, capability, semantic mapping, and compatibility.
- **Diagnostic** — errors, warnings, unsupported features, and information.
- **Bundle** — a set of generated configurations for multiple targets.
- **Provider** — an external data source such as a rule list or DNS source.
- **Manifest** — metadata describing a generated bundle.

## Design principles

1. Define once.
2. Validate before export.
3. Never silently discard unsupported features.
4. Never bypass target permissions or platform security.
5. Prefer local-first processing for sensitive configuration data.
6. Clearly identify third-party sources, licenses, and attribution.
7. Separate configuration generation from runtime enforcement.
8. Treat generated configuration as an artifact that the user reviews and chooses to install or use.

## Planned targets

Initial targets are expected to include iOS MobileConfig, Surge-compatible configuration, Mihomo/Clash-compatible configuration, WireGuard configuration, and future native/runtime integrations. Target support is capability-driven and does not imply that every feature can be represented on every target.

## Repository layout

```
docs/          Architecture and project documentation
schemas/       Public canonical schemas
examples/      Example policies and bundles
packages/      Core implementation packages (added during implementation)
targets/       Target adapters (added as supported)
apps/          Web/API applications (added during implementation)
tests/         Unit, integration, compatibility, and fixtures
tools/         Developer and validation utilities
```

## Privacy

The project is designed around a local-first model. Sensitive material such as private keys, credentials, and tokens should not be transmitted to a service unless the user explicitly chooses a feature that requires it.

## Third-party software and data

Third-party formats, specifications, libraries, rule providers, and examples must retain appropriate attribution and license information. No third-party code should be copied into this project without recording its source and license.

## Disclaimer

Generated configurations are technical artifacts. Users are responsible for reviewing, installing, operating, and using them in accordance with applicable law, platform rules, software licenses, and third-party service terms.

## License

See [LICENSE](LICENSE).
