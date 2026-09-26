# Apple MobileConfig Validation Runbook

This runbook is the release gate for Apple MobileConfig exports.

## 1. Local structure validation

Generate a profile from the web app/exporter, then run:

```bash
npm run test:mobileconfig
```

For an existing profile on macOS:

```bash
plutil -convert xml1 -o - myprofile.mobileconfig | xmllint --noout -
```

The profile must have a top-level `PayloadType=Configuration`, a `PayloadContent` array, and valid payload identifiers/UUIDs.

## 2. Signature validation

For a signed CMS/DER profile on macOS:

```bash
security cms -D -i myprofile.mobileconfig > decoded.plist
security cms -V -i myprofile.mobileconfig
```

For the repository signing tool:

```bash
npm run sign:mobileconfig -- --input unsigned.mobileconfig --output signed.mobileconfig --cert signer.pem --key signer.key
```

A signature is never inferred from the presence of a certificate field. A real certificate/private key is required.

## 3. DNS roundtrip

The validation fixture contains three enabled DNS profiles and one disabled profile. The gate requires all three enabled profiles to survive Core -> exporter -> plist parsing and requires the disabled profile to be absent.

A missing profile is a failure unless the exporter explicitly reports the loss in a compatibility report.

## 4. CI

The `mobileconfig` GitHub Actions job runs on macOS and executes the MobileConfig validation plus the Node test suite.

The job is a release gate for the generated format, but it does not replace real-device verification.

## 5. macOS installation evidence

Run manually on a test Mac:

```bash
sudo profiles install -type configuration -path myprofile.mobileconfig
profiles status -type configuration
```

Record:
- install success/failure
- warnings
- payload identifiers
- whether the intended setting took effect
- macOS version

Do not store private keys, passwords, or secrets in evidence.

## 6. iOS/iPadOS installation evidence

Use Apple Configurator or the selected test MDM path. Record:
- device model and OS version
- installation accepted/rejected
- prompts/warnings
- installed payload identifiers
- DNS/Web Clip/Wi-Fi/VPN behavior
- screenshots or sanitized logs

Device acceptance is separate from exporter/CI success.

## 7. MDM evidence

If MDM support is claimed, record:
- MDM product/version
- enrollment mode
- declaration/profile identifier
- deployment result
- device response
- resulting behavior

A manual installation does not count as MDM evidence.

## 8. Declarative vs legacy DNS

The exporter exposes separate targets:
- `apple-dns-declaration`
- `apple-mobileconfig`
- `apple-mobileconfig-legacy`

The compatibility report must identify which target was exported. Legacy output must not be presented as the primary iOS 27+ declarative path.

## Acceptance criteria

All applicable checks must be true before an Apple target is promoted to device-verified:
- [ ] plist/XML validation passes
- [ ] payload identifiers and UUIDs are present
- [ ] every enabled DNS profile is represented
- [ ] disabled DNS profiles are absent
- [ ] signature verifies when a signed profile is being tested
- [ ] CI MobileConfig job passes
- [ ] macOS installation evidence exists when macOS support is claimed
- [ ] iOS/iPadOS installation evidence exists when device support is claimed
- [ ] MDM evidence exists when MDM support is claimed
- [ ] compatibility report documents every known limitation
