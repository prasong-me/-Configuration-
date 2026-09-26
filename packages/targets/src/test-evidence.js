export const targetTestEvidence = Object.freeze({
  surge: {
    target: "surge",
    status: "verified",
    source: "real-device",
    scope: "Surge 5.x",
    testsPassed: 15,
    profileGeneration: "passed",
    notes: [
      "Real-device testing result previously recorded for the Surge 5.x profile structure.",
      "Proxy credentials/endpoints are not included in generated artifacts."
    ],
    references: [
      "https://manual.nssurge.com/profile/format.html"
    ]
  },
  shadowrocket: {
    target: "shadowrocket",
    status: "partial",
    source: "real-device-log",
    scope: "DNS/runtime observation",
    testsPassed: 1,
    notes: [
      "A real-device log recorded configured DNS resolution attempts against 1.1.1.1 and 1.0.0.1.",
      "The same observation also recorded system DNS 94.140.14.15 and 94.140.14.16.",
      "This does not prove that every DNS query used only the configured resolvers."
    ],
    references: [
      "https://github.com/Shadowrocket/config/blob/master/default.conf"
    ]
  },
  pyto: {
    target: "pyto",
    status: "partial",
    source: "real-device-benchmark",
    scope: "iOS/Pyto direct DNS benchmark",
    testsPassed: 1,
    notes: [
      "Real iPhone/Pyto benchmark for example.com completed with 10 iterations per resolver and 5000ms timeout.",
      "The first observed run returned 10/10 successful samples for 1.1.1.1, 1.0.0.1, 9.9.9.9, 149.112.112.112, 8.8.8.8, and 8.8.4.4.",
      "A subsequent run returned 6/10 successful samples for 1.1.1.1 and 0/10 successful samples for 1.0.0.1, 9.9.9.9, 149.112.112.112, 8.8.8.8, and 8.8.4.4.",
      "Observed results are inconsistent across runs, so they are not sufficient to claim stable resolver reachability or target compatibility.",
      "The benchmark measured resolver-level behavior from Pyto; it does not prove that all iOS system DNS traffic used the selected resolver."
    ],
    references: []
  },
  wireguard: {
    target: "wireguard",
    status: "partial",
    source: "real-device-observation",
    scope: "VPN interface / routing observation",
    testsPassed: 1,
    notes: [
      "A real-device observation recorded VPN address 10.2.0.2 and Wi-Fi address 192.168.1.42.",
      "This observation is not sufficient to claim complete WireGuard target compatibility."
    ],
    references: [
      "https://www.wireguard.com/"
    ]
  }
});

export function getTargetTestEvidence(targetId) {
  const value = targetTestEvidence[targetId];
  return value ? structuredClone(value) : null;
}

export function hasTargetTestEvidence(targetId) {
  const value = targetTestEvidence[targetId];
  return Boolean(value && value.testsPassed > 0 && (value.status === "verified" || value.status === "partial"));
}
