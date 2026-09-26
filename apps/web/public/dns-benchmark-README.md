# Browser DNS Benchmark

This test runner measures real browser navigation behavior while the device uses the DNS configuration being evaluated.

## Components

- `dns-benchmark.html`: controller and result collector.
- `userscripts/dns-benchmark.user.js`: browser driver installed as a User Script.
- The controller sends one URL at a time to the current browser tab.
- The User Script runs on the target page, records Navigation Timing data, and redirects back to the controller with the result.

## Important measurement boundary

Browser page-load time is not DNS latency. It includes DNS, connection setup, TLS/QUIC, server response, redirects, and page behavior.

The `navigation` fields are therefore recorded separately. Later we can add a dedicated resolver-level test driver so the project does not confuse web load time with DNS resolver time.

## Planned drivers

The controller protocol is intentionally browser-neutral. Future drivers can implement the same result shape for other iOS browsers that support User Scripts or automation.

## Current limitations

- The controller currently uses the active tab, not multiple tabs.
- A target site can redirect, block scripts, or terminate navigation before the driver reports.
- Some sites may alter query parameters or navigation behavior.
- Results are stored locally in the browser using localStorage.
