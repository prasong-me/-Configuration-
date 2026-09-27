const SKIPPED_COMPONENT_TYPES = Object.freeze({ source: 'source', dns: 'dns', vpn: 'vpn', proxy: 'proxy' });

export function applySkipSemantics(doc) {
  const skippedSteps = Array.isArray(doc?.skipContext?.skippedSteps) ? [...doc.skipContext.skippedSteps] : [];
  const skippedTypes = new Set(
    Object.entries(SKIPPED_COMPONENT_TYPES)
      .filter(([step]) => skippedSteps.includes(step))
      .map(([, type]) => type),
  );
  const profiles = Array.isArray(doc?.profiles) ? doc.profiles : [];
  const activeProfiles = profiles
    .filter((profile) => profile?.enabled)
    .map((profile) => {
      const components = Array.isArray(profile.components) ? profile.components : undefined;
      if (!components || skippedTypes.size === 0) return profile;
      return {
        ...profile,
        components: components.filter((component) => !skippedTypes.has(component?.type)),
      };
    });
  return { activeProfiles, skippedSteps };
}
