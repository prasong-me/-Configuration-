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
    testsPassed: 2,
    iterationsPerRun: 10,
    timeoutMs: 5000,
    query: "example.com",
    observations: [
      {
        run: 1,
        successSamples: {"1.1.1.1": 10, "1.0.0.1": 10, "9.9.9.9": 10, "149.112.112.112": 10, "8.8.8.8": 10, "8.8.4.4": 10},
        errors: {"1.1.1.1": 0, "1.0.0.1": 0, "9.9.9.9": 0, "149.112.112.112": 0, "8.8.8.8": 0, "8.8.4.4": 0}
      },
      {
        run: 2,
        successSamples: {"1.1.1.1": 6, "1.0.0.1": 0, "9.9.9.9": 0, "149.112.112.112": 0, "8.8.8.8": 0, "8.8.4.4": 0},
        errors: {"1.1.1.1": 4, "1.0.0.1": 10, "9.9.9.9": 10, "149.112.112.112": 10, "8.8.8.8": 10, "8.8.4.4": 10}
      }
    ],
    notes: [
      "Two real iPhone/Pyto benchmark runs were recorded for example.com with 10 iterations per resolver and 5000ms timeout.",
      "The observed success rate changed between runs, so the current evidence is insufficient to claim stable resolver reachability or target compatibility.",
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
