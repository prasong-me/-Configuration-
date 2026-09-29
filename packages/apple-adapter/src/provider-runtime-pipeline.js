import { decodeDnsWireMessage, encodeDnsWireMessage } from "./dns-wire-runtime.js";
import { createProviderStageExecutionEngine } from "./provider-stage-execution.js";

const isBytes = value => value instanceof Uint8Array || value instanceof ArrayBuffer || ArrayBuffer.isView(value);

function bytesCopy(value) {
  if (value instanceof Uint8Array) return value.slice();
  if (value instanceof ArrayBuffer) return new Uint8Array(value).slice();
  if (ArrayBuffer.isView(value)) return new Uint8Array(value.buffer, value.byteOffset, value.byteLength).slice();
  throw Object.assign(new Error("DNS runtime pipeline input must be bytes."), { code: "PIPELINE_INPUT_INVALID" });
}

function failure(code, error, trace = []) {
  return Object.freeze({ kind: "FAILURE", code, error, trace: Object.freeze([...trace]), output: null });
}

export async function executeDnsRuntimePipeline({
  input, stages = [], handlers = {}, direction = "REQUEST",
  decodeOptions = {}, encodeOptions = {}, initialContext = {},
} = {}) {
  if (!isBytes(input)) return failure("PIPELINE_INPUT_INVALID");
  if (!["REQUEST", "RESPONSE"].includes(direction)) return failure("PIPELINE_DIRECTION_INVALID");

  let message;
  try { message = decodeDnsWireMessage(bytesCopy(input), decodeOptions); }
  catch (error) { return failure("PIPELINE_DECODE_FAILED", error); }

  const context = { ...initialContext, direction, message, wireInput: bytesCopy(input) };
  const engine = createProviderStageExecutionEngine({ stages, handlers });
  if (!engine.valid) return failure("PIPELINE_STAGE_CONTRACT_INVALID", engine.errors);

  let execution;
  try { execution = await engine.execute(context); }
  catch (error) { return failure("PIPELINE_STAGE_ENGINE_FAILED", error); }

  if (execution.kind === "FAILURE") return failure("PIPELINE_STAGE_FAILED", execution, execution.trace);

  if (execution.kind === "TERMINAL") {
    if (execution.result === "DROP" || execution.result === "BLOCK") {
      return Object.freeze({ kind: "TERMINAL", result: execution.result, stageId: execution.stageId, trace: Object.freeze(execution.trace || []), output: null });
    }
    if (execution.result === "RESPOND") {
      const responseMessage = execution.context?.responseMessage;
      if (!responseMessage) return failure("PIPELINE_RESPONSE_MESSAGE_REQUIRED", execution, execution.trace);
      try {
        const output = encodeDnsWireMessage(responseMessage, encodeOptions);
        return Object.freeze({ kind: "OUTPUT", result: "RESPOND", stageId: execution.stageId, trace: Object.freeze(execution.trace || []), output, message: responseMessage });
      } catch (error) { return failure("PIPELINE_ENCODE_FAILED", error, execution.trace); }
    }
    return failure("PIPELINE_TERMINAL_RESULT_UNSUPPORTED", execution, execution.trace);
  }

  const outputMessage = execution.context?.message;
  if (!outputMessage) return failure("PIPELINE_OUTPUT_MESSAGE_REQUIRED", execution, execution.trace);
  try {
    const output = encodeDnsWireMessage(outputMessage, encodeOptions);
    return Object.freeze({ kind: "OUTPUT", result: "CONTINUE", trace: Object.freeze(execution.trace || []), output, message: outputMessage });
  } catch (error) { return failure("PIPELINE_ENCODE_FAILED", error, execution.trace); }
}

export const ProviderRuntimePipelineBoundary = Object.freeze({
  input: "RAW_DNS_DATA", decode: "DNS_WIRE_MESSAGE", stageContext: "DNS_CONTEXT", output: "RAW_DNS_DATA",
  deterministic: true, failClosed: true, preservesTransactionId: true, semanticInvention: false,
  forbidden: Object.freeze(["BYPASS_STAGE_EXECUTION","REORDER_STAGES","INVENT_RESPONSE","DROP_TERMINAL_RESULT_SEMANTICS","SILENTLY_FALLBACK_ON_DECODE_OR_ENCODE_FAILURE"]),
});
