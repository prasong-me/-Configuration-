# Configuration Platform

Target configuration generator for network/privacy applications.

## Architecture

The platform is an intermediary configuration generator. It does not implement a VPN, proxy engine, or target-app import mechanism.

The flow is:

1. Select a target application.
2. Create or edit a profile.
3. Configure DNS, proxy, routing and blocking policy.
4. Validate the configuration.
5. Generate the target application's native configuration.
6. Hand the result to the target application through a supported delivery mechanism such as iOS Share/Open In or a documented app link.
7. The target application remains responsible for importing and executing the configuration.

## Test-result gate

**A target configuration must have real test evidence before it can be presented as verified or exported as a verified target.**

Official documentation alone establishes syntax/reference information. It does not establish runtime compatibility.

The repository therefore records test results separately from target definitions. Partial observations are explicitly marked partial and must not be promoted to full verification.

Current recorded results:

- Surge 5.x: verified, 15 real-device tests plus profile-generation test.
- Shadowrocket: partial, real-device DNS/runtime observation.
- WireGuard: partial, real-device VPN-interface/routing observation.
- Other targets: reference/template only until real testing is recorded.

When a new test result is received, add the exact observed result to the target evidence record first, then update the target status only when the evidence supports that status.

## Target-specific code

The web core should remain target-agnostic. Target-specific formats and behavior belong in target definitions/adapters/scripts.

Do not spread target-specific branches through the main web UI.

## Security

Never commit private keys, passwords, tokens, certificates, or personal configuration data.

Remote sources should be treated as data. Do not execute arbitrary remote JavaScript.

## Testing

Run `npm test` for core tests.

Run `npm --prefix apps/web install && npm --prefix apps/web run build` for the web build.
