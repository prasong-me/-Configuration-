import { DiagnosticLevel, diagnostic } from "../../diagnostics/src/index.js";
export function validatePolicy(input) {
  const findings=[];
  if (!input || typeof input !== "object") return [diagnostic(DiagnosticLevel.CRITICAL,"POLICY_NOT_OBJECT","Policy must be an object.")];
  if (typeof input.version !== "string") findings.push(diagnostic(DiagnosticLevel.HIGH,"POLICY_VERSION_INVALID","Policy version must be a string.",{path:"version"}));
  const policy=input.policy;
  if (!policy || typeof policy !== "object") { findings.push(diagnostic(DiagnosticLevel.CRITICAL,"POLICY_BODY_MISSING","Policy body is required.",{path:"policy"})); return findings; }
  for (const key of ["vpn","dns","routing"]) if (policy[key] !== undefined && typeof policy[key] !== "boolean") findings.push(diagnostic(DiagnosticLevel.HIGH,"POLICY_VALUE_INVALID",`${key} must be boolean when present.`,{path:`policy.${key}`}));
  for (const key of ["malware","trackers"]) if (policy.blocking?.[key] !== undefined && typeof policy.blocking[key] !== "boolean") findings.push(diagnostic(DiagnosticLevel.HIGH,"POLICY_VALUE_INVALID",`blocking.${key} must be boolean when present.`,{path:`policy.blocking.${key}`}));
  return findings;
}
