export const CONTRACT_VERSION = "0.1";
export const BRIDGE_PROTOCOL = "configuration-bridge/0.1";

export function createEnvelope({ requestId, action, payload, metadata = {} }) {
  if (typeof requestId !== "string" || !requestId.trim()) {
    throw new TypeError("requestId must be a non-empty string.");
  }
  if (typeof action !== "string" || !action.trim()) {
    throw new TypeError("action must be a non-empty string.");
  }

  return {
    protocol: BRIDGE_PROTOCOL,
    contractVersion: CONTRACT_VERSION,
    requestId: requestId.trim(),
    action: action.trim(),
    payload,
    metadata: metadata && typeof metadata === "object" ? structuredClone(metadata) : {},
  };
}

export function validateEnvelope(envelope) {
  const errors = [];
  if (!envelope || typeof envelope !== "object") errors.push("ENVELOPE_OBJECT_REQUIRED");
  if (envelope?.protocol !== BRIDGE_PROTOCOL) errors.push("PROTOCOL_UNSUPPORTED");
  if (envelope?.contractVersion !== CONTRACT_VERSION) errors.push("CONTRACT_VERSION_UNSUPPORTED");
  if (typeof envelope?.requestId !== "string" || !envelope.requestId.trim()) errors.push("REQUEST_ID_REQUIRED");
  if (typeof envelope?.action !== "string" || !envelope.action.trim()) errors.push("ACTION_REQUIRED");
  if (!Object.prototype.hasOwnProperty.call(envelope ?? {}, "payload")) errors.push("PAYLOAD_REQUIRED");

  return { valid: errors.length === 0, errors };
}
