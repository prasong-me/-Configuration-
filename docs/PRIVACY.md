# Privacy Model

## Principles

- Local-first processing where practical.
- Data minimization.
- No secret collection by default.
- No hidden transmission of configuration data.
- Explicit disclosure when a feature requires a remote service.
- User control over generated and exported artifacts.

## Sensitive material

Examples include:

- private keys
- passwords
- proxy credentials
- VPN credentials
- API tokens
- certificates and private certificate material
- personal configuration data

Sensitive material should not be committed to this repository.

## Web application

A future Web App should prefer browser-side generation for configuration that can be safely compiled locally. Server-side compilation should be optional and should not require secrets unless explicitly needed.

## Third-party providers

Remote rule lists, DNS providers, or other data sources must be identified, and their terms and licenses must be respected.
