import { validatePolicy } from "../../validator/src/index.js";
import { ControlState } from "./index.js";

export function validateExecutionInput(request, policyInput) {
  if (!request || request.state !== ControlState.RESOLVED) {
    return {
      ok: false,
      diagnostics: [{ code: "CONTROL_NOT_RESOLVED", message: "Validation requires a RESOLVED control request." }],
    };
  }

  const diagnostics = validatePolicy(policyInput ?? {});
  return {
    ok: !diagnostics.some(item => item.level === "CRITICAL" || item.level === "HIGH"),
    diagnostics,
  };
}
