import { DiagnosticLevel, diagnostic } from "../../diagnostics/src/index.js";

export function analyzePolicy(policy) {
  const findings = [];
  const providers = policy?.policy?.providers;

  if (providers?.remote === true && !providers?.integrity) {
    findings.push(diagnostic(
      DiagnosticLevel.WARNING,
      "PROVIDER_UNTRUSTED",
      "A remote provider is enabled without integrity metadata.",
      { feature: "providers" }
    ));
  }

  if (policy?.policy?.credentials) {
    findings.push(diagnostic(
      DiagnosticLevel.HIGH,
      "SECRET_IN_POLICY",
      "Credential material should be kept outside ordinary policy data.",
      { feature: "credentials" }
    ));
  }

  return findings;
}
