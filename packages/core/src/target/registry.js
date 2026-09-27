const OUTPUT_FORMATS = new Set(["plist", "json", "yaml", "ini", "text"]);

function cloneCapabilities(capabilities) {
  return capabilities.map((capability) => ({
    ...capability,
    notes: Array.isArray(capability.notes) ? [...capability.notes] : capability.notes,
  }));
}

function cloneTarget(target) {
  return {
    ...target,
    options: target.options ? { ...target.options } : target.options,
  };
}

function cloneRegistration(registration) {
  return {
    target: cloneTarget(registration.target),
    capabilities: cloneCapabilities(registration.capabilities),
    adapter: registration.adapter,
  };
}

function validateCapabilities(capabilities, targetId) {
  if (!Array.isArray(capabilities)) {
    throw new TypeError(`Target '${targetId}' capabilities must be an array.`);
  }

  for (const [index, capability] of capabilities.entries()) {
    if (!capability || typeof capability !== "object") {
      throw new TypeError(`Target '${targetId}' capability at index ${index} must be an object.`);
    }

    if (typeof capability.featureKey !== "string" || capability.featureKey.trim() === "") {
      throw new TypeError(`Target '${targetId}' capability at index ${index} requires a non-empty featureKey.`);
    }

    if (typeof capability.supported !== "boolean") {
      throw new TypeError(`Target '${targetId}' capability '${capability.featureKey}' supported must be boolean.`);
    }

    if (capability.version !== undefined && typeof capability.version !== "string") {
      throw new TypeError(`Target '${targetId}' capability '${capability.featureKey}' version must be a string.`);
    }

    if (
      capability.notes !== undefined &&
      (!Array.isArray(capability.notes) || capability.notes.some((note) => typeof note !== "string"))
    ) {
      throw new TypeError(`Target '${targetId}' capability '${capability.featureKey}' notes must be an array of strings.`);
    }
  }
}

export class ConfigurationTargetRegistry {
  constructor() {
    this.registrations = new Map();
  }

  register(registration) {
    if (!registration || typeof registration !== "object") {
      throw new TypeError("Invalid target registration.");
    }

    const { target, capabilities, adapter } = registration;

    if (!target || typeof target.targetId !== "string" || !target.targetId) {
      throw new TypeError("Target registration requires a valid targetId.");
    }

    if (!OUTPUT_FORMATS.has(target.outputFormat)) {
      throw new TypeError(
        `Target '${target.targetId}' declares an unsupported output format.`,
      );
    }

    if (
      !adapter ||
      typeof adapter.targetId !== "string" ||
      typeof adapter.compile !== "function"
    ) {
      throw new TypeError(
        `Target '${target.targetId}' requires a valid target adapter.`,
      );
    }

    if (adapter.targetId !== target.targetId) {
      throw new TypeError(
        `Target '${target.targetId}' does not match adapter '${adapter.targetId}'.`,
      );
    }

    validateCapabilities(capabilities, target.targetId);

    if (this.registrations.has(target.targetId)) {
      throw new Error(`Target '${target.targetId}' is already registered.`);
    }

    this.registrations.set(target.targetId, {
      target: cloneTarget(target),
      capabilities: cloneCapabilities(capabilities),
      adapter,
    });
  }

  has(targetId) {
    return this.registrations.has(targetId);
  }

  get(targetId) {
    const registration = this.registrations.get(targetId);
    return registration ? cloneRegistration(registration) : undefined;
  }

  getTarget(targetId) {
    const registration = this.registrations.get(targetId);
    return registration ? cloneTarget(registration.target) : undefined;
  }

  getCapabilities(targetId) {
    const registration = this.registrations.get(targetId);
    return registration ? cloneCapabilities(registration.capabilities) : [];
  }

  getAdapter(targetId) {
    return this.registrations.get(targetId)?.adapter;
  }

  list() {
    return [...this.registrations.values()].map(cloneRegistration);
  }
}
