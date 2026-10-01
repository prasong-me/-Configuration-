export function evaluateCompatibility(profilesTotal, profilesProcessed, profilesSkipped, outcomes = [], diagnostics = []) {
  let status = 'SUCCESS';
  for (const outcome of outcomes) {
    const { result, requirementLevel } = outcome;
    if (requirementLevel === 'REQUIRED') {
      if (result === 'UNSUPPORTED' || result === 'UNKNOWN') { status = 'FAILED'; break; }
      if (result === 'PARTIAL') status = 'PARTIAL';
    } else if (requirementLevel === 'OPTIONAL') {
      if ((result === 'PARTIAL' || result === 'UNSUPPORTED' || result === 'UNKNOWN') && status === 'SUCCESS') status = 'PARTIAL';
    }
  }
  if (diagnostics.some((diagnostic) => diagnostic.severity === 'ERROR')) status = 'FAILED';
  const summary = {
    profilesTotal, profilesProcessed, profilesSkipped,
    featuresRequired: outcomes.filter((o) => o.requirementLevel === 'REQUIRED').length,
    featuresOptional: outcomes.filter((o) => o.requirementLevel === 'OPTIONAL').length,
    featuresSupported: outcomes.filter((o) => o.result === 'SUPPORTED').length,
    featuresPartial: outcomes.filter((o) => o.result === 'PARTIAL').length,
    featuresUnsupported: outcomes.filter((o) => o.result === 'UNSUPPORTED').length,
    featuresUnknown: outcomes.filter((o) => o.result === 'UNKNOWN').length,
    diagnosticsTotal: diagnostics.length,
  };
  return { status, timestamp: new Date().toISOString(), diagnostics, summary };
}