# Architecture

## 1. Goal

The platform separates user intent from target-specific configuration syntax.

A user defines a canonical Policy. The system determines what each Target can support, compiles the supported semantics, reports limitations, validates the result, and serializes it into the target's native format.

## 2. Pipeline

```
Canonical Policy
      |
      v
Normalize
      |
      v
Validate Policy
      |
      v
Capability Engine
      |
      +---- unsupported / limited diagnostics
      |
      v
Compiler
      |
      v
Target Adapter
      |
      v
Target Model
      |
      v
Serializer
      |
      v
Target Configuration
```

## 3. Import pipeline

```
Target Configuration
      |
      v
Parser
      |
      v
Target Model
      |
      v
Canonical Policy
      |
      v
Validation / Diagnostics
```

## 4. Capability states

- **SUPPORTED** — target represents the requested feature directly.
- **LIMITED** — target can represent only part of the requested semantics.
- **TRANSFORMABLE** — equivalent semantics can be expressed through another supported mechanism.
- **LOSSY** — conversion is possible but changes behavior or information.
- **UNSUPPORTED** — target cannot represent the feature.
- **UNKNOWN** — capability has not been verified.

The compiler must never silently convert an unsupported feature into a different behavior.

## 5. Separation of responsibilities

### Policy
Describes intent.

### Compiler
Maps intent to target semantics.

### Adapter
Owns target-specific knowledge.

### Serializer
Owns syntax.

### Validator
Verifies correctness.

### Runtime
Actually applies the resulting configuration. Runtime behavior is outside the configuration compiler unless a supported native runtime is explicitly implemented.

## 6. Security boundaries

The project must not bypass operating-system permissions, application permissions, signing requirements, entitlements, sandbox boundaries, or other platform security controls.

If a feature is unavailable to a target, the system reports that limitation and provides compatible alternatives where appropriate.

## 7. Privacy boundary

Sensitive values should remain local whenever possible. The architecture must avoid requiring server-side storage of private keys, credentials, tokens, or personal configuration.

## 8. Public/private implementation boundary

The project may expose schemas, documentation, examples, validation contracts, and selected adapters publicly while retaining implementation components that the maintainer does not wish to publish. Public interfaces must remain documented and stable enough for users to understand generated artifacts.
