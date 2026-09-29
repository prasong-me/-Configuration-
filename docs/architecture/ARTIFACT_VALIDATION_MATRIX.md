# Artifact Validation Matrix

| Gate | What is checked | Evidence source |
|---|---|---|
| Export path | Every registered target reaches ConfigurationExporter | tests/artifact-validation-matrix.test.js |
| Output format | Adapter output format matches registered target format | exporter structural validation |
| Serialization | Registered serializer returns an artifact | exporter + regression tests |
| Capability admission | Requested UNKNOWN/UNSUPPORTED capability blocks export | tests/target-compatibility-matrix.test.js |
| Web build | Vite production build succeeds | GitHub Actions |
| Core regression | Full Node test suite succeeds | GitHub Actions |
| MobileConfig | Profile validator + generated run profile | GitHub Actions macOS workflow |

Artifact validation proves repository execution and syntax/structure. It does not prove target runtime behavior.
