# Artifact Status Model

Version: 1.0.0

| Status | Meaning | Runnable |
|---|---|---|
| runnable | Required target data and runtime-specific values exist and validation passes. | yes |
| template | Structure is valid but runtime-specific data is intentionally absent. | no |
| partial | Only a documented subset of requested semantics is mapped. | no |
| invalid | Required syntax, schema, reference, or semantic validation failed. | no |
| rejected | Requested capability/constraint is unsupported by the target. | no |

A status must describe the artifact actually produced. It must not be inferred solely from the existence of an output file.
