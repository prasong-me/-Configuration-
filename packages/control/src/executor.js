import { normalizePolicy } from "../../core/src/index.js";
import { defaultControlRegistry } from "./registry.js";
import { validateExecutionInput } from "./validation.js";
import { getTargetAdapter } from "../../targets/src/adapters.js";
import { buildExecutionPlan } from "./index.js";

export function executeResolvedRequest(request, policyInput, options = {}) {
  const trace = ["RECEIVED", "ANALYZING", "RESOLVED", "ROUTING"];
  const plan = buildExecutionPlan(request);
  const policy = normalizePolicy(policyInput ?? {});
  const validation = validateExecutionInput(request, policy);
  trace.push("VALIDATING");
  if (!validation.ok) {
    return { ok: false, stage: "VALIDATING", trace, plan, validation, artifact: null };
  }

  const registry = options.registry ?? defaultControlRegistry;
  const descriptor = registry.resolve(plan.target, plan.format);
  if (!descriptor) {
    return {
      ok: false,
      stage: "ROUTING",
      plan,
      validation,
      error: { code: "TARGET_FORMAT_UNREGISTERED", target: plan.target, format: plan.format },
      artifact: null,
      trace,
    };
  }

  const adapter = (options.getAdapter ?? getTargetAdapter)(descriptor.targetId);
  if (!adapter || typeof adapter.compile !== "function") {
    return {
      ok: false,
      stage: "ROUTING",
      plan,
      validation,
      error: { code: "ADAPTER_UNAVAILABLE", targetId: descriptor.targetId },
      artifact: null,
      trace,
    };
  }

  trace.push("EXECUTING");
  const artifact = adapter.compile(policy);
  trace.push("EXPORTING");
  return {
    ok: true,
    stage: "COMPLETED",
    plan,
    validation,
    targetId: descriptor.targetId,
    artifact,
    trace: [...trace, "COMPLETED"],
  };
}
