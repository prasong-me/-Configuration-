# Apple Configuration Profile — Official Evidence Snapshot

- Source: Apple Developer — Configuration Profile Reference
- URL: https://developer.apple.com/business/documentation/Configuration-Profile-Reference.pdf
- Evidence level: OFFICIAL
- Retrieved: 2026-10-02
- Scope: configuration-profile structure and documented payload capabilities

## Verified facts

Apple documents configuration profiles as XML property-list files used to distribute configuration information. The reference documents Wi-Fi, VPN, Web Clip and other network/device payloads, including DNS Proxy, Global HTTP Proxy, VPN, Web Clip and Wi-Fi payloads.

The documented top-level profile keys include PayloadContent, PayloadIdentifier, PayloadUUID, PayloadType, PayloadVersion, and related metadata. PayloadType for the profile is Configuration; PayloadVersion is documented as 1 in the referenced specification.

Each payload has common keys including PayloadType, PayloadVersion, PayloadIdentifier, PayloadUUID, PayloadDisplayName, and PayloadDescription, with payload-specific keys defined by the payload type.

The reference states that configuration profiles are property-list based and that Data values are represented using Base64 encoding. It also documents deployment through Apple Configurator, email, webpage, over-the-air profile delivery, and MDM.

## Project boundary

This evidence supports the Apple MobileConfig serializer/profile structure and documented payload mapping only. It does not prove physical-device runtime behavior, signing, entitlements, provisioning, NetworkExtension execution, or upstream DNS end-to-end behavior.

## Capability/evidence rule

- Official format evidence may establish documented syntax and payload availability.
- Runtime claims remain separate and require runtime/device evidence.
- Unsupported or undocumented mappings must remain fail-closed rather than inferred.
- This record does not freeze the Target Profile Contract shape; that remains governed by the project baseline pending normative-source reconciliation.

## Source excerpt anchors

The Apple reference table of contents identifies sections for DNS Proxy, Global HTTP Proxy, VPN, Per-App VPN, Web Clip, and Wi-Fi payloads. The opening specification sections define the profile structure and common payload dictionary keys.
