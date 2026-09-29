# Regression Matrix

| Area | Test | Gate |
|---|---|---|
| Contracts | tests/contracts.test.js | PASS required |
| Capability engine | tests/capabilities.test.js | PASS required |
| Compiler | tests/compiler.test.js | PASS required |
| Exporter | tests/exporter.test.js | PASS required |
| Target adapters | tests/target-adapters.test.js | PASS required |
| Wizard | tests/wizard.test.js | PASS required |
| DNS structure/wire | tests/dns-config-structure.test.js + tests/dns-wire-*.test.js | PASS required |
| Provider runtime | tests/provider-*.test.js | PASS required |
| Artifact matrix | tests/artifact-validation-matrix.test.js | PASS required |
| Capability/evidence matrix | tests/target-compatibility-matrix.test.js | PASS required |
| Mobile UI contract | tests/mobile-ui-contract.test.js | PASS required |
| Repository model integrity | scripts/validate-repository-models.mjs | PASS required |
| Web production build | npm run build:web | PASS required |

A passing regression suite does not upgrade a target from UNKNOWN to REAL-DEVICE-TESTED or RUNTIME-VALIDATED.
