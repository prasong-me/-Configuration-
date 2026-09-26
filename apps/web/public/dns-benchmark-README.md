# Browser DNS Benchmark

This test runner measures real browser navigation behavior while the device uses the DNS configuration being evaluated.

## Components
- `dns-benchmark.html`: controller and result collector.
- `userscripts/dns-benchmark.user.js`: browser driver installed as a User Script.
- `tools/pyto/dns_benchmark_builder.py`: Pyto smoke-test builder for a DNS Benchmark Shortcut.

## Measurement boundary
Browser page-load time is not DNS latency. It includes DNS, connection setup, TLS/QUIC, server response, redirects, and page behavior. Navigation Timing fields are recorded separately.

## Current test metadata
- Test resolver pair: `1.1.1.1`, `1.0.0.1`
- DNS transport in the configuration UI: DNS-over-HTTPS (HTTPS)
- Router DNS observed separately: `94.140.14.15`, `94.140.14.16`
- The test pair intentionally does not use the router's observed addresses.
- This metadata does not claim that one resolver is faster or better.

## iPhone / Pyto workflow
The current Pyto builder creates a binary `.shortcut` smoke-test workflow for Cloudflare, Google Public DNS and Quad9 and opens the iOS Share Sheet for a one-time user import.

Pyto cannot silently install a Shortcut into the iOS Shortcuts database. The current builder does not change system DNS.

The current Shortcut is a smoke test, not the final benchmark. A complete benchmark still needs real device validation, repeated rounds, multiple domains, result aggregation such as median/P95/P99, and a resolver-level measurement path.

## Browser controller workflow
The controller sends one URL at a time to the active browser tab. The User Script runs on the target page, records Navigation Timing, and redirects back to the controller with the result.

Results are stored locally in browser localStorage and can be exported as JSON.

## Limitations
- The controller currently uses the active tab, not multiple tabs.
- A target site can redirect, block scripts, or terminate navigation before the driver reports.
- Some sites may alter query parameters or navigation behavior.
- Browser-load results must not be presented as pure DNS resolver latency.
- Future resolver-level drivers must use real resolver queries and real device/network measurements rather than fabricated timings.

## Planned full benchmark
Shortcut/controller: select the DNS configuration under test → run the same domain set repeatedly → collect results → repeat for the next DNS configuration → compare measured statistics.

The benchmark should use the same domain set across configurations and preserve the network context so results remain comparable.