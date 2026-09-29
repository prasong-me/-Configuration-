});

test("export bridge enforces device platform compatibility when requested", () => {
  const android = exportConfiguration(
    { policy: { ...policy.policy, rules: [] }, resultMetadata: { status: "SUCCEEDED", diagnostics: [] } },
    { platformId: "android", targetId: "wireguard" }
  );
  assert.equal(android.ok, true);
  assert.equal(android.targetId, "wireguard");

  const incompatible = exportConfiguration(
    { policy: policy.policy, resultMetadata: { status: "SUCCEEDED", diagnostics: [] } },
    { platformId: "android", targetId: "surge" }