# Export Formats

This document is the test matrix for target-specific exports.

## Export targets

| Target | File | Function | State |
|---|---|---|---|
| Surge | .conf | exportSurge() | Template |
| Mihomo / Clash-compatible | .yaml | exportMihomo() | Template |
| WireGuard | .conf | exportWireGuard() | Template |
| Shadowrocket | .conf | exportShadowrocket() | Template |
| Loon | .conf | exportLoon() | Template |
| Stash | .yaml | exportStash() | Template |
| Quantumult X | .conf | exportQuantumultX() | Template |
| Apple Network DNS Settings | .json | exportAppleDnsDeclaration() | Reference |
| Apple DNSSettings legacy | .mobileconfig | exportAppleMobileConfigLegacy() | Legacy |

## Test order

For each target:

1. Export the file from the web application.
2. Import or load it in the real target application/device.
3. Test DNS.
4. Test routing / VPN or TUN behavior where applicable.
5. Test one blocking rule.
6. Record the actual result.
7. Return the exported artifact with secrets removed.
8. Promote the target from template to a verified adapter only after the real-device result is reviewed.

## Format notes

### Surge
Surge profiles use an INI-like format with sections such as [General], [Proxy], [Proxy Group], and [Rule].

Reference: https://manual.nssurge.com/profile/format.html

### Mihomo
Mihomo uses YAML. DNS is represented under dns, proxy nodes under proxies, proxy groups under proxy-groups, and routing rules under rules.

Reference: https://wiki.metacubex.one/en/config/

### WireGuard
The export uses the standard [Interface] / [Peer] structure. Private keys are deliberately placeholders.

Reference: https://www.wireguard.com/

### Shadowrocket
The export uses the Shadowrocket .conf profile structure. The current test fixture keeps the DNS and rule sections minimal so each feature can be tested independently.

Reference: https://github.com/LOWERTOP/Shadowrocket/wiki

### Loon
The export uses Loon's section-based configuration format. DNS is configured in [General] and rules in [Rule].

Reference: https://github.com/Loon0x00/LoonManual

### Stash
Stash configurations use YAML. DNS is under dns, and traffic rules are under rules.

Reference: https://stash.wiki/en/configuration/example-config

### Quantumult X
The export uses Quantumult X's section-based configuration. The minimal fixture includes [general], [dns], [policy], and [filter_local].

Reference: https://github.com/crossutility/Quantumult-X

### Apple Network DNS Settings
The current Apple declarative model uses the com.apple.configuration.network.dns-settings declaration. This is exported separately from the legacy .mobileconfig DNS payload.

Reference: https://developer.apple.com/documentation/devicemanagement/networkdnssettings

### Apple DNSSettings legacy
The com.apple.dnsSettings.managed payload is retained only as a legacy compatibility fixture because Apple documents the declarative network DNS settings configuration as its replacement on newer OS versions.

Reference: https://developer.apple.com/documentation/devicemanagement/dnssettings
