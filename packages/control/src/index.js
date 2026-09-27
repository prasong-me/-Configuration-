export const ControlState = Object.freeze({
  RECEIVED: "RECEIVED",
  ANALYZING: "ANALYZING",
  NEEDS_CLARIFICATION: "NEEDS_CLARIFICATION",
  WAITING_FOR_USER: "WAITING_FOR_USER",
  RESOLVED: "RESOLVED",
});

export const CONTROL_CONTRACT_VERSION = "0.1";

const TARGET_HINTS = Object.freeze({
  apple: ["apple", "ios", "iphone", "mobileconfig", "dns declaration"],
  wireguard: ["wireguard"],
  mihomo: ["mihomo"],
  shadowrocket: ["shadowrocket"],
  loon: ["loon"],
  stash: ["stash"],
  "quantumult-x": ["quantumult x", "quantumultx"],
});

const OPERATION_HINTS = Object.freeze({
  export: ["export", "ส่งออก", "สร้างไฟล์", "generate"],
  validate: ["validate", "ตรวจสอบ", "เช็ก", "ตรวจ"],
  analyze: ["analyze", "วิเคราะห์"],
  compile: ["compile", "แปลง", "คอมไพล์"],
});

function clean(value) {
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

function candidatesFromText(text, hints) {
  const source = clean(text).toLowerCase();
  if (!source) return [];
  return Object.entries(hints)
    .filter(([, words]) => words.some(word => source.includes(word)))
    .map(([id]) => id);
}

export function createControlRequest(input, context = {}) {
  return {
    contractVersion: CONTROL_CONTRACT_VERSION,
    state: ControlState.RECEIVED,
    input,
    context: context && typeof context === "object" ? structuredClone(context) : {},
  };
}

export function analyzeControlRequest(request) {
  const source = request?.input;
  const text = typeof source === "string"
    ? source
    : source && typeof source === "object"
      ? [source.request, source.description, source.input].filter(Boolean).join(" ")
      : "";

  const explicitTarget = source && typeof source === "object" ? clean(source.target).toLowerCase() : "";
  const explicitOperation = source && typeof source === "object" ? clean(source.operation).toLowerCase() : "";
  const explicitFormat = source && typeof source === "object" ? clean(source.format).toLowerCase() : "";

  const targetCandidates = explicitTarget
    ? [explicitTarget]
    : candidatesFromText(text, TARGET_HINTS);
  const operationCandidates = explicitOperation
    ? [explicitOperation]
    : candidatesFromText(text, OPERATION_HINTS);

  const uniqueTarget = [...new Set(targetCandidates)];
  const uniqueOperation = [...new Set(operationCandidates)];

  const target = uniqueTarget.length === 1 ? uniqueTarget[0] : "";
  const operation = uniqueOperation.length === 1 ? uniqueOperation[0] : "";

  const missing = [];
  if (!target) missing.push("target");
  if (!operation) missing.push("operation");

  const formatRequiredFor = new Set(["apple"]);
  if (target && formatRequiredFor.has(target) && !explicitFormat) {
    missing.push("format");
  }

  if (missing.length) {
    return {
      ...request,
      state: ControlState.NEEDS_CLARIFICATION,
      analysis: {
        target,
        operation,
        format: explicitFormat,
        missing,
        targetCandidates: uniqueTarget,
        operationCandidates: uniqueOperation,
      },
    };
  }

  return {
    ...request,
    state: ControlState.RESOLVED,
    analysis: {
      target,
      operation,
      format: explicitFormat,
      missing: [],
      targetCandidates: uniqueTarget,
      operationCandidates: uniqueOperation,
    },
  };
}

export function applyClarification(request, answers = {}) {
  if (!request || request.state !== ControlState.NEEDS_CLARIFICATION) {
    throw new Error("Clarification can only be applied to a request in NEEDS_CLARIFICATION state.");
  }

  const current = request.input && typeof request.input === "object"
    ? structuredClone(request.input)
    : { request: request.input };

  const allowed = ["target", "operation", "format"];
  for (const key of allowed) {
    if (typeof answers[key] === "string" && answers[key].trim()) {
      current[key] = answers[key].trim();
    }
  }

  return analyzeControlRequest({
    ...request,
    state: ControlState.WAITING_FOR_USER,
    input: current,
  });
}
