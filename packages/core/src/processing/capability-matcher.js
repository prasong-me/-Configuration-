export function matchCapabilities(profiles = [], targetCapabilities = [], targetId = '') {
  const outcomes = [];
  const diagnostics = [];
  const capabilityMap = new Map();
  for (const capability of Array.isArray(targetCapabilities) ? targetCapabilities : []) {
    if (!capability || typeof capability.featureKey !== 'string') continue;
    capabilityMap.set(capability.featureKey, Boolean(capability.supported));
  }
  for (const profile of Array.isArray(profiles) ? profiles : []) {
    if (!profile?.enabled || !Array.isArray(profile.requirements)) continue;
    for (const requirement of profile.requirements) {
      const featureKey = requirement.featureKey;
      let result = 'UNKNOWN';
      let targetSupported;
      if (!capabilityMap.has(featureKey)) {
        diagnostics.push({ code: 'TARGET_CAPABILITY_UNKNOWN', severity: 'WARNING', message: `Target '${targetId}' has no capability evidence for feature '${featureKey}'.`, featureKey, profileId: profile.id, targetId, details: { reason: 'MISSING_CAPABILITY_EVIDENCE' } });
      } else {
        targetSupported = capabilityMap.get(featureKey);
        if (targetSupported) result = 'SUPPORTED';
        else if (requirement.requirementLevel === 'REQUIRED') {
          result = 'UNSUPPORTED';
          diagnostics.push({ code: 'TARGET_FEATURE_UNSUPPORTED', severity: 'ERROR', message: `Target '${targetId}' explicitly does not support required feature '${featureKey}'.`, featureKey, profileId: profile.id, targetId });
        } else {
          result = 'PARTIAL';
          diagnostics.push({ code: 'SEMANTIC_LOSS', severity: 'WARNING', message: `Target '${targetId}' does not support optional feature '${featureKey}'. Result will be partial.`, featureKey, profileId: profile.id, targetId });
        }
      }
      outcomes.push({ featureKey, result, profileId: profile.id, targetId, requirementLevel: requirement.requirementLevel, targetSupported });
    }
  }
  return { outcomes, diagnostics };
}