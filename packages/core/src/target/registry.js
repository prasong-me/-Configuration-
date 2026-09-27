/** @typedef {import('../model/target').TargetId} TargetId */
/** @typedef {import('../model/target').TargetCapability} TargetCapability */
/** @typedef {import('./contracts').TargetAdapter} TargetAdapter */
/** @typedef {import('./registry').TargetRegistration} TargetRegistration */

export class TargetRegistry {
  constructor() {
    /** @private @type {Map<TargetId, TargetRegistration>} */
    this.registrations = new Map();
  }

  /** @param {TargetRegistration} registration */
  register(registration) {
    if (!registration?.target || !registration?.target.targetId) {
      throw new TypeError('Target registration requires a target with targetId.');
    }
    if (!registration.adapter || !registration.adapter.targetId) {
      throw new TypeError('Target registration requires an adapter with targetId.');
    }
    if (registration.target.targetId !== registration.adapter.targetId) {
      throw new Error(
        `Target ID '${registration.target.targetId}' does not match adapter target ID '${registration.adapter.targetId}'.`,
      );
    }
    if (!Array.isArray(registration.capabilities)) {
      throw new TypeError('Target registration requires a capabilities array.');
    }
    if (this.registrations.has(registration.target.targetId)) {
      throw new Error(
        `Target '${registration.target.targetId}' is already registered.`,
      );
    }

    this.registrations.set(registration.target.targetId, registration);
  }

  /** @param {TargetId} targetId */
  has(targetId) {
    return this.registrations.has(targetId);
  }

  /** @param {TargetId} targetId */
  get(targetId) {
    return this.registrations.get(targetId);
  }

  list() {
    return Array.from(this.registrations.values());
  }
}
