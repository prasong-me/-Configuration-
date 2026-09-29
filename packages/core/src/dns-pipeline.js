const VALID_RESULTS = new Set([
  "PASS",
  "RESPOND",
  "BLOCK",
  "FORWARD",
  "ERROR",
]);

export const DnsStageResult = Object.freeze({
  PASS: "PASS",
  RESPOND: "RESPOND",
  BLOCK: "BLOCK",
  FORWARD: "FORWARD",
  ERROR: "ERROR",
});

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function normalizeDnsPipeline(input = {}) {
  const source = input?.policy ?? input ?? {};
  const stages = Array.isArray(source.dnsPipeline)
    ? source.dnsPipeline
    : Array.isArray(source.dnsStages)
      ? source.dnsStages
      : [];

  return stages
    .filter(stage => stage && typeof stage === "object")
    .map((stage, index) => ({
      id: cleanString(stage.id) || `dns-stage-${index + 1}`,
      name: cleanString(stage.name) || `DNS Stage ${index + 1}`,
      provider: cleanString(stage.provider) || "",
      protocol: cleanString(stage.protocol) || "DoH",
      endpoint: cleanString(stage.endpoint) || "",
      role: cleanString(stage.role) || "resolver",
      order: Number.isFinite(stage.order) ? stage.order : index + 1,
      enabled: stage.enabled !== false,
      rules: Array.isArray(stage.rules) ? structuredClone(stage.rules) : [],
      onMatch: VALID_RESULTS.has(stage.onMatch) ? stage.onMatch : "PASS",
      onNoMatch: VALID_RESULTS.has(stage.onNoMatch) ? stage.onNoMatch : "PASS",
    }))
    .sort((a, b) => a.order - b.order);
}

export function processDnsQuery(query, stages, handlers = {}) {
  const normalizedStages = normalizeDnsPipeline({ dnsPipeline: stages });
  const trace = [];
  const request = typeof query === "string" ? { name: query } : { ...(query || {}) };

  for (const stage of normalizedStages) {
    if (!stage.enabled) {
      trace.push({ stageId: stage.id, result: "PASS", skipped: true });
      continue;
    }

    const handler = handlers[stage.id] ?? handlers[stage.provider] ?? null;

    if (typeof handler !== "function") {
      trace.push({
        stageId: stage.id,
        result: "PASS",
        reason: "NO_HANDLER",
      });
      continue;
    }

    try {
      const raw = handler(request, stage);
      const result = typeof raw === "string" ? raw : raw?.result;

      if (!VALID_RESULTS.has(result)) {
        trace.push({ stageId: stage.id, result: "ERROR", reason: "INVALID_RESULT" });
        return { result: "ERROR", trace };
      }

      trace.push({ stageId: stage.id, result, detail: raw });

      if (result !== "PASS") {
        return { result, trace, response: raw?.response };
      }
    } catch (error) {
      trace.push({
        stageId: stage.id,
        result: "ERROR",
        error: error instanceof Error ? error.message : String(error),
      });
      return { result: "ERROR", trace };
    }
  }

  return {
    result: "FORWARD",
    trace,
  };
}
