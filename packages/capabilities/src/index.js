export const CapabilityState = Object.freeze({
  SUPPORTED: "SUPPORTED",
  LIMITED: "LIMITED",
  TRANSFORMABLE: "TRANSFORMABLE",
  LOSSY: "LOSSY",
  UNSUPPORTED: "UNSUPPORTED",
  UNKNOWN: "UNKNOWN"
});

export function evaluateCapability(capability, requested = true) {
  if (!requested) return { requested: false, state: "NOT_REQUESTED" };
  return {
    requested: true,
    state: capability ?? CapabilityState.UNKNOWN
  };
}
