# Threat Management

Threat Management is target-independent. It evaluates policy and generated artifacts for security-relevant conditions before export or runtime use.

## Pipeline

Policy -> Threat Analysis -> Diagnostics

## Initial rule classes

- secret exposure
- unsafe fallback
- unsupported security control
- untrusted external provider
- configuration integrity
- target capability mismatch
- sensitive logging

Threat rules must produce deterministic diagnostics and must never silently modify user intent.
