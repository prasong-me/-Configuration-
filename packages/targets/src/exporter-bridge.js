import { getTargetAdapter } from "./adapters.js";
import { getSerializer, serializeRepresentation } from "./serializer-registry.js";
import { assertTargetCompatible } from "./platform-registry.js";

const allowedFormats = new Set(["plist", "json", "yaml", "ini", "text"]);
const blockedStatuses = new Set(["FAILED", "BLOCKED", "REJECTED"]);

function diagnostic(code, message) {
  return { code, message };
}

export function exportConfiguration(processingResult, { targetId, platformId } = {}) {
  const status = processingResult?.resultMetadata?.status ?? processingResult?.status;
  const diagnostics = Array.isArray(processingResult?.resultMetadata?.diagnostics)
    ? processingResult.resultMetadata.diagnostics
    : [];

  if (blockedStatuses.has(status)) {
    return {
      ok: false,
      blocked: true,
      diagnostics: [diagnostic("PROCESSING_FAILED", `Processing status ${status} blocks export.`)],
      artifact: null
    };
  }

  if (platformId) {
    try {
      assertTargetCompatible(platformId, targetId);
    } catch (error) {
      return {
        ok: false,
        blocked: true,
        diagnostics: [diagnostic("PLATFORM_TARGET_INCOMPATIBLE", error instanceof Error ? error.message : String(error))],
        artifact: null
      };
    }
  }

  const adapter = getTargetAdapter(targetId);
  if (!adapter) {
    return {
      ok: false,
      blocked: true,
      diagnostics: [diagnostic("TARGET_NOT_REGISTERED", `Target not registered: ${targetId}`)],
      artifact: null
    };
  }

  let compiled;
  try {
    compiled = adapter.compile(processingResult?.policy ?? processingResult);
  } catch (error) {
    return {
      ok: false,
      blocked: true,
      diagnostics: [diagnostic("COMPILE_FAILED", error instanceof Error ? error.message : String(error))],
      artifact: null
    };
  }

  if (
    !compiled ||
    typeof compiled !== "object" ||
    !Object.hasOwn(compiled, "representation") ||
    typeof compiled.targetId !== "string" ||
    typeof compiled.outputFormat !== "string"
  ) {
    return {
      ok: false,
      blocked: true,
      diagnostics: [diagnostic("INVALID_COMPILE_RESULT", "Target adapter returned an invalid CompileResult.")],
      artifact: null
    };
  }

  if (compiled.targetId !== targetId) {
    return {
      ok: false,
      blocked: true,
      diagnostics: [diagnostic("TARGET_ID_MISMATCH", "Target adapter result does not match requested target.")],
      artifact: null
    };
  }

  if (!allowedFormats.has(compiled.outputFormat)) {
    return {
      ok: false,
      blocked: true,
      diagnostics: [
        diagnostic("TARGET_OUTPUT_FORMAT_MISMATCH", `Unsupported output format: ${compiled.outputFormat}`)
      ],
      artifact: null
    };
  }

  if (!getSerializer(compiled.outputFormat)) {
    return {
      ok: false,
      blocked: true,
      diagnostics: [
        diagnostic("SERIALIZER_NOT_REGISTERED", `Serializer not registered: ${compiled.outputFormat}`)
      ],
      artifact: null
    };
  }

  let artifact;
  try {
    artifact = serializeRepresentation(compiled.outputFormat, compiled.representation);
  } catch (error) {
    return {
      ok: false,
      blocked: true,
      diagnostics: [diagnostic("SERIALIZE_FAILED", error instanceof Error ? error.message : String(error))],
      artifact: null
    };
  }

  if (
    artifact === null ||
    artifact === undefined ||
    (typeof artifact === "string" && artifact.trim().length === 0)
  ) {
    return {
      ok: false,
      blocked: true,
      diagnostics: [diagnostic("EMPTY_ARTIFACT", "Target serializer returned an empty artifact.")],
      artifact: null
    };
  }

  return {
    ok: true,
    blocked: false,
    targetId,
    outputFormat: compiled.outputFormat,
    artifact,
    resultMetadata: processingResult?.resultMetadata ?? null,
    diagnostics
  };
}
